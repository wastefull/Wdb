-- Stage 7: explicit admin-authored content-to-material mappings.
--
-- This is the day-to-day curation path. Unlike migration apply, each call
-- represents one deliberate review decision and therefore needs no apply gate.

BEGIN;

CREATE OR REPLACE FUNCTION public.create_manual_content_mapping(
  p_created_by UUID,
  p_content_entity_id UUID,
  p_subject_entity_id UUID,
  p_role TEXT,
  p_lifecycle_focus TEXT DEFAULT NULL,
  p_evidence_use TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_mapping public.content_entities%ROWTYPE;
  v_content_type TEXT;
  v_content_name TEXT;
  v_subject_name TEXT;
  v_user_email TEXT;
  v_inserted BOOLEAN := FALSE;
  v_outbox_written BOOLEAN := FALSE;
  v_now TIMESTAMPTZ := now();
BEGIN
  IF p_created_by IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE id = p_created_by AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'A current WasteDB admin profile is required';
  END IF;

  SELECT entity_type, name
  INTO v_content_type, v_content_name
  FROM public.entities
  WHERE id = p_content_entity_id
    AND entity_type IN ('article', 'guide', 'blog_post', 'video');
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Content must reference a canonical article, guide, blog post, or video entity';
  END IF;

  SELECT name
  INTO v_subject_name
  FROM public.entities
  WHERE id = p_subject_entity_id AND entity_type = 'material';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subject must reference a canonical material entity';
  END IF;

  IF p_content_entity_id = p_subject_entity_id THEN
    RAISE EXCEPTION 'Content cannot map to itself';
  END IF;
  IF NULLIF(btrim(p_role), '') IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.content_roles
    WHERE slug = btrim(p_role) AND active = TRUE
  ) THEN
    RAISE EXCEPTION 'An active governed content role is required';
  END IF;
  IF p_lifecycle_focus IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.lifecycle_focuses
    WHERE slug = btrim(p_lifecycle_focus) AND active = TRUE
  ) THEN
    RAISE EXCEPTION 'Lifecycle focus must be active and governed';
  END IF;
  IF p_evidence_use IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.evidence_uses
    WHERE slug = btrim(p_evidence_use) AND active = TRUE
  ) THEN
    RAISE EXCEPTION 'Evidence use must be active and governed';
  END IF;
  IF btrim(p_role) = 'evidence' AND p_evidence_use IS NULL THEN
    RAISE EXCEPTION 'Evidence mappings require an explicit evidence use';
  END IF;
  IF btrim(p_role) <> 'evidence' AND p_evidence_use IS NOT NULL THEN
    RAISE EXCEPTION 'Evidence use is only valid for evidence mappings';
  END IF;

  INSERT INTO public.content_entities (
    content_entity_id,
    subject_entity_id,
    role,
    lifecycle_focus,
    evidence_use,
    status,
    created_by
  ) VALUES (
    p_content_entity_id,
    p_subject_entity_id,
    btrim(p_role),
    NULLIF(btrim(p_lifecycle_focus), ''),
    NULLIF(btrim(p_evidence_use), ''),
    'pending_review',
    p_created_by
  )
  ON CONFLICT (content_entity_id, subject_entity_id, role) DO NOTHING
  RETURNING * INTO v_mapping;

  IF FOUND THEN
    v_inserted := TRUE;
  ELSE
    SELECT * INTO v_mapping
    FROM public.content_entities
    WHERE content_entity_id = p_content_entity_id
      AND subject_entity_id = p_subject_entity_id
      AND role = btrim(p_role);
  END IF;

  IF v_inserted THEN
    INSERT INTO public.graph_sync_outbox (
      event_key,
      source_table,
      source_identifier,
      operation,
      payload
    ) VALUES (
      'content_entities:manual:insert:' || v_mapping.id,
      'content_entities',
      v_mapping.id::TEXT,
      'insert',
      jsonb_build_object(
        'mapping_id', v_mapping.id,
        'content_entity_id', v_mapping.content_entity_id,
        'subject_entity_id', v_mapping.subject_entity_id,
        'role', v_mapping.role,
        'lifecycle_focus', v_mapping.lifecycle_focus,
        'evidence_use', v_mapping.evidence_use,
        'status', v_mapping.status,
        'provenance', 'manual_admin_curation'
      )
    ) ON CONFLICT (event_key) DO NOTHING;
    v_outbox_written := FOUND;

    SELECT email INTO v_user_email
    FROM public.user_profiles WHERE id = p_created_by;
    INSERT INTO public.audit_log (
      id, timestamp, user_id, user_email, entity_type, entity_id,
      action, after, changes
    ) VALUES (
      'audit:' || floor(extract(epoch FROM clock_timestamp()) * 1000)::BIGINT
        || ':' || gen_random_uuid(),
      v_now, p_created_by::TEXT, v_user_email, 'content_entity',
      v_mapping.id::TEXT, 'content_mapping_create',
      jsonb_build_object(
        'content_entity_id', v_mapping.content_entity_id,
        'content_name', v_content_name,
        'content_type', v_content_type,
        'subject_entity_id', v_mapping.subject_entity_id,
        'subject_name', v_subject_name,
        'role', v_mapping.role,
        'lifecycle_focus', v_mapping.lifecycle_focus,
        'evidence_use', v_mapping.evidence_use,
        'status', v_mapping.status,
        'provenance', 'manual_admin_curation'
      ),
      jsonb_build_array(jsonb_build_object(
        'field', 'status', 'newValue', v_mapping.status
      ))
    );
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'mapping_id', v_mapping.id,
    'content_entity_id', v_mapping.content_entity_id,
    'subject_entity_id', v_mapping.subject_entity_id,
    'role', v_mapping.role,
    'lifecycle_focus', v_mapping.lifecycle_focus,
    'evidence_use', v_mapping.evidence_use,
    'status', v_mapping.status,
    'created', v_inserted,
    'already_exists', NOT v_inserted,
    'outbox_event_written', v_outbox_written
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_manual_content_mapping(
  UUID, UUID, UUID, TEXT, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_manual_content_mapping(
  UUID, UUID, UUID, TEXT, TEXT, TEXT
) TO service_role;

COMMIT;
