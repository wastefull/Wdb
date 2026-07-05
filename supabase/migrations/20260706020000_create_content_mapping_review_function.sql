-- Stage 7: approve or reject one pending content mapping atomically.

BEGIN;

CREATE OR REPLACE FUNCTION public.review_content_mapping(
  p_mapping_id UUID,
  p_reviewed_by UUID,
  p_decision TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_mapping public.content_entities%ROWTYPE;
  v_previous_status TEXT;
  v_target_status TEXT;
  v_user_email TEXT;
  v_changed BOOLEAN := FALSE;
  v_outbox_written BOOLEAN := FALSE;
  v_now TIMESTAMPTZ := now();
BEGIN
  IF p_reviewed_by IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = p_reviewed_by AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'A current WasteDB admin profile is required';
  END IF;

  v_target_status := CASE btrim(p_decision)
    WHEN 'approve' THEN 'active'
    WHEN 'reject' THEN 'archived'
    ELSE NULL
  END;
  IF v_target_status IS NULL THEN
    RAISE EXCEPTION 'Decision must be approve or reject';
  END IF;

  SELECT * INTO v_mapping
  FROM public.content_entities
  WHERE id = p_mapping_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Content mapping does not exist';
  END IF;

  v_previous_status := v_mapping.status;
  IF v_mapping.status = v_target_status THEN
    RETURN jsonb_build_object(
      'success', TRUE, 'mapping_id', v_mapping.id,
      'status', v_mapping.status, 'changed', FALSE,
      'already_reviewed', TRUE, 'outbox_event_written', FALSE
    );
  END IF;
  IF v_mapping.status <> 'pending_review' THEN
    RAISE EXCEPTION 'Only pending content mappings can be reviewed';
  END IF;

  UPDATE public.content_entities
  SET status = v_target_status,
      reviewed_by = p_reviewed_by,
      reviewed_at = v_now,
      updated_at = v_now
  WHERE id = p_mapping_id
  RETURNING * INTO v_mapping;
  v_changed := TRUE;

  INSERT INTO public.graph_sync_outbox (
    event_key, source_table, source_identifier, operation, payload
  ) VALUES (
    'content_entities:review:' || v_target_status || ':' || v_mapping.id,
    'content_entities', v_mapping.id::TEXT, 'update',
    jsonb_build_object(
      'mapping_id', v_mapping.id,
      'content_entity_id', v_mapping.content_entity_id,
      'subject_entity_id', v_mapping.subject_entity_id,
      'role', v_mapping.role,
      'lifecycle_focus', v_mapping.lifecycle_focus,
      'evidence_use', v_mapping.evidence_use,
      'previous_status', v_previous_status,
      'status', v_mapping.status,
      'reviewed_by', p_reviewed_by,
      'reviewed_at', v_mapping.reviewed_at,
      'provenance', 'admin_content_mapping_review'
    )
  ) ON CONFLICT (event_key) DO NOTHING;
  v_outbox_written := FOUND;

  SELECT email INTO v_user_email
  FROM public.user_profiles WHERE id = p_reviewed_by;
  INSERT INTO public.audit_log (
    id, timestamp, user_id, user_email, entity_type, entity_id,
    action, before, after, changes
  ) VALUES (
    'audit:' || floor(extract(epoch FROM clock_timestamp()) * 1000)::BIGINT
      || ':' || gen_random_uuid(),
    v_now, p_reviewed_by::TEXT, v_user_email, 'content_entity',
    v_mapping.id::TEXT, 'content_mapping_' || btrim(p_decision),
    jsonb_build_object('status', v_previous_status),
    jsonb_build_object(
      'status', v_mapping.status,
      'reviewed_by', p_reviewed_by,
      'reviewed_at', v_mapping.reviewed_at
    ),
    jsonb_build_array(jsonb_build_object(
      'field', 'status', 'oldValue', v_previous_status,
      'newValue', v_mapping.status
    ))
  );

  RETURN jsonb_build_object(
    'success', TRUE, 'mapping_id', v_mapping.id,
    'status', v_mapping.status, 'changed', v_changed,
    'already_reviewed', FALSE,
    'outbox_event_written', v_outbox_written
  );
END;
$$;

REVOKE ALL ON FUNCTION public.review_content_mapping(UUID, UUID, TEXT)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_content_mapping(UUID, UUID, TEXT)
TO service_role;

COMMIT;
