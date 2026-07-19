-- Stage 7: admin video links should publish immediately.
--
-- The shared content-mapping RPC gains an opt-in auto-publish mode for the
-- admin video-link workflow. Non-video content still uses the review queue.

BEGIN;

DROP FUNCTION IF EXISTS public.create_manual_content_mapping(
  UUID, UUID, UUID, TEXT, TEXT, TEXT
);

CREATE OR REPLACE FUNCTION public.create_manual_content_mapping(
  p_created_by UUID,
  p_content_entity_id UUID,
  p_subject_entity_id UUID,
  p_role TEXT,
  p_lifecycle_focus TEXT DEFAULT NULL,
  p_evidence_use TEXT DEFAULT NULL,
  p_auto_publish BOOLEAN DEFAULT FALSE
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
  v_mapping_promoted BOOLEAN := FALSE;
  v_outbox_written BOOLEAN := FALSE;
  v_publish_outbox_written BOOLEAN := FALSE;
  v_entity_outbox_written BOOLEAN := FALSE;
  v_now TIMESTAMPTZ := now();
  v_insert_status TEXT;
  v_video_id UUID;
  v_previous_video_status TEXT;
  v_previous_entity_status TEXT;
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

  IF p_auto_publish AND v_content_type <> 'video' THEN
    RAISE EXCEPTION 'Auto-publish is only supported for video content';
  END IF;

  v_insert_status :=
    CASE
      WHEN p_auto_publish AND v_content_type = 'video' THEN 'active'
      ELSE 'pending_review'
    END;

  INSERT INTO public.content_entities (
    content_entity_id,
    subject_entity_id,
    role,
    lifecycle_focus,
    evidence_use,
    status,
    created_by,
    reviewed_by,
    reviewed_at
  ) VALUES (
    p_content_entity_id,
    p_subject_entity_id,
    btrim(p_role),
    NULLIF(btrim(p_lifecycle_focus), ''),
    NULLIF(btrim(p_evidence_use), ''),
    v_insert_status,
    p_created_by,
    CASE WHEN v_insert_status = 'active' THEN p_created_by ELSE NULL END,
    CASE WHEN v_insert_status = 'active' THEN v_now ELSE NULL END
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

  IF NOT v_inserted AND p_auto_publish THEN
    IF v_mapping.status = 'pending_review' THEN
      UPDATE public.content_entities
      SET status = 'active',
          reviewed_by = p_created_by,
          reviewed_at = v_now,
          updated_at = v_now
      WHERE id = v_mapping.id
      RETURNING * INTO v_mapping;
      v_mapping_promoted := TRUE;
    ELSIF v_mapping.status <> 'active' THEN
      RAISE EXCEPTION 'Only pending content mappings can be auto-published';
    END IF;
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
  ELSIF v_mapping_promoted THEN
    INSERT INTO public.graph_sync_outbox (
      event_key,
      source_table,
      source_identifier,
      operation,
      payload
    ) VALUES (
      'content_entities:manual:auto_publish:' || v_mapping.id,
      'content_entities',
      v_mapping.id::TEXT,
      'update',
      jsonb_build_object(
        'mapping_id', v_mapping.id,
        'content_entity_id', v_mapping.content_entity_id,
        'subject_entity_id', v_mapping.subject_entity_id,
        'role', v_mapping.role,
        'lifecycle_focus', v_mapping.lifecycle_focus,
        'evidence_use', v_mapping.evidence_use,
        'previous_status', 'pending_review',
        'status', v_mapping.status,
        'reviewed_by', v_mapping.reviewed_by,
        'reviewed_at', v_mapping.reviewed_at,
        'provenance', 'manual_admin_curation_auto_publish'
      )
    ) ON CONFLICT (event_key) DO NOTHING;
    v_outbox_written := FOUND;
  END IF;

  IF p_auto_publish THEN
    SELECT video_id
    INTO v_video_id
    FROM public.entity_canonical_bindings
    WHERE entity_id = p_content_entity_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'The linked video could not be resolved';
    END IF;

    SELECT status
    INTO v_previous_video_status
    FROM public.videos
    WHERE id = v_video_id
    FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'The linked video could not be resolved';
    END IF;

    SELECT status
    INTO v_previous_entity_status
    FROM public.entities
    WHERE id = p_content_entity_id
    FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'The linked video entity could not be resolved';
    END IF;

    IF v_previous_video_status <> 'published' OR v_previous_entity_status <> 'active' THEN
      UPDATE public.videos
      SET
        status = 'published',
        reviewed_by = p_created_by,
        reviewed_at = v_now,
        updated_at = v_now
      WHERE id = v_video_id;

      UPDATE public.entities
      SET
        status = 'active',
        reviewed_by = p_created_by,
        reviewed_at = v_now,
        updated_at = v_now
      WHERE id = p_content_entity_id;

      INSERT INTO public.graph_sync_outbox (
        event_key,
        source_table,
        source_identifier,
        operation,
        payload
      ) VALUES (
        'videos:manual:auto_publish:' || v_video_id,
        'videos',
        v_video_id::TEXT,
        'update',
        jsonb_build_object(
          'video_id', v_video_id,
          'previous_status', v_previous_video_status,
          'status', 'published',
          'reviewed_by', p_created_by,
          'provenance', 'manual_admin_curation_auto_publish'
        )
      ) ON CONFLICT (event_key) DO NOTHING;
      v_publish_outbox_written := FOUND;

      INSERT INTO public.graph_sync_outbox (
        event_key,
        source_table,
        source_identifier,
        operation,
        payload
      ) VALUES (
        'entities:manual:auto_publish:' || p_content_entity_id,
        'entities',
        p_content_entity_id::TEXT,
        'update',
        jsonb_build_object(
          'entity_id', p_content_entity_id,
          'video_id', v_video_id,
          'previous_status', v_previous_entity_status,
          'status', 'active',
          'reviewed_by', p_created_by,
          'provenance', 'manual_admin_curation_auto_publish'
        )
      ) ON CONFLICT (event_key) DO NOTHING;
      v_entity_outbox_written := FOUND;

      SELECT email INTO v_user_email
      FROM public.user_profiles
      WHERE id = p_created_by;

      INSERT INTO public.audit_log (
        id, timestamp, user_id, user_email, entity_type, entity_id,
        action, before, after, changes
      ) VALUES (
        'audit:' || floor(extract(epoch FROM clock_timestamp()) * 1000)::BIGINT
          || ':' || gen_random_uuid(),
        v_now, p_created_by::TEXT, v_user_email, 'video',
        v_video_id::TEXT, 'video_publish',
        jsonb_build_object('status', v_previous_video_status),
        jsonb_build_object(
          'status', 'published',
          'entity_id', p_content_entity_id,
          'provenance', 'manual_admin_curation_auto_publish'
        ),
        jsonb_build_array(jsonb_build_object(
          'field', 'status', 'oldValue', v_previous_video_status,
          'newValue', 'published'
        ))
      );
    END IF;
  END IF;

  IF v_inserted THEN
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
  ELSIF v_mapping_promoted THEN
    SELECT email INTO v_user_email
    FROM public.user_profiles WHERE id = p_created_by;
    INSERT INTO public.audit_log (
      id, timestamp, user_id, user_email, entity_type, entity_id,
      action, before, after, changes
    ) VALUES (
      'audit:' || floor(extract(epoch FROM clock_timestamp()) * 1000)::BIGINT
        || ':' || gen_random_uuid(),
      v_now, p_created_by::TEXT, v_user_email, 'content_entity',
      v_mapping.id::TEXT, 'content_mapping_approve',
      jsonb_build_object('status', 'pending_review'),
      jsonb_build_object(
        'status', v_mapping.status,
        'reviewed_by', p_created_by,
        'reviewed_at', v_mapping.reviewed_at,
        'provenance', 'manual_admin_curation_auto_publish'
      ),
      jsonb_build_array(jsonb_build_object(
        'field', 'status', 'oldValue', 'pending_review',
        'newValue', v_mapping.status
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
    'outbox_event_written', v_outbox_written OR v_publish_outbox_written OR v_entity_outbox_written
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_manual_content_mapping(
  UUID, UUID, UUID, TEXT, TEXT, TEXT, BOOLEAN
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_manual_content_mapping(
  UUID, UUID, UUID, TEXT, TEXT, TEXT, BOOLEAN
) TO service_role;

COMMIT;
