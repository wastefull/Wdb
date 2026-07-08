-- Stage 7: complete reviewed relationship management workflows.
--
-- Adds manual material-relationship create/review/delete RPCs, plus a
-- focused delete RPC for manual content mappings so delete mutations retain
-- transactional outbox + audit compatibility.

BEGIN;

CREATE OR REPLACE FUNCTION public.create_manual_material_relationship(
  p_created_by UUID,
  p_source_entity_id UUID,
  p_target_entity_id UUID,
  p_relationship_type TEXT DEFAULT 'related_to'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_relationship public.entity_relationships%ROWTYPE;
  v_existing public.entity_relationships%ROWTYPE;
  v_user_email TEXT;
  v_source_name TEXT;
  v_target_name TEXT;
  v_created BOOLEAN := FALSE;
  v_outbox_written BOOLEAN := FALSE;
  v_type TEXT := btrim(COALESCE(p_relationship_type, 'related_to'));
  v_now TIMESTAMPTZ := now();
BEGIN
  IF p_created_by IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = p_created_by AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'A current WasteDB admin profile is required';
  END IF;

  IF p_source_entity_id IS NULL OR p_target_entity_id IS NULL THEN
    RAISE EXCEPTION 'Source and target material entities are required';
  END IF;

  IF p_source_entity_id = p_target_entity_id THEN
    RAISE EXCEPTION 'A material cannot relate to itself';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.relationship_types
    WHERE slug = v_type AND active = TRUE
  ) THEN
    RAISE EXCEPTION 'An active governed relationship type is required';
  END IF;

  SELECT name INTO v_source_name
  FROM public.entities
  WHERE id = p_source_entity_id AND entity_type = 'material';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Source must reference a canonical material entity';
  END IF;

  SELECT name INTO v_target_name
  FROM public.entities
  WHERE id = p_target_entity_id AND entity_type = 'material';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target must reference a canonical material entity';
  END IF;

  -- Treat related_to as undirected for duplicate protection.
  IF v_type = 'related_to' THEN
    SELECT * INTO v_existing
    FROM public.entity_relationships
    WHERE relationship_type = v_type
      AND (
        (source_entity_id = p_source_entity_id AND target_entity_id = p_target_entity_id)
        OR
        (source_entity_id = p_target_entity_id AND target_entity_id = p_source_entity_id)
      )
    ORDER BY created_at
    LIMIT 1;
  ELSE
    SELECT * INTO v_existing
    FROM public.entity_relationships
    WHERE source_entity_id = p_source_entity_id
      AND target_entity_id = p_target_entity_id
      AND relationship_type = v_type
    LIMIT 1;
  END IF;

  IF FOUND THEN
    v_relationship := v_existing;
  ELSE
    INSERT INTO public.entity_relationships (
      source_entity_id,
      target_entity_id,
      relationship_type,
      status,
      created_by,
      metadata
    ) VALUES (
      p_source_entity_id,
      p_target_entity_id,
      v_type,
      'pending_review',
      p_created_by,
      jsonb_build_object('provenance', 'manual_admin_curation')
    ) RETURNING * INTO v_relationship;
    v_created := TRUE;
  END IF;

  IF v_created THEN
    INSERT INTO public.graph_sync_outbox (
      event_key,
      source_table,
      source_identifier,
      operation,
      payload
    ) VALUES (
      'entity_relationships:manual:insert:' || v_relationship.id,
      'entity_relationships',
      v_relationship.id::TEXT,
      'insert',
      jsonb_build_object(
        'relationship_id', v_relationship.id,
        'source_entity_id', v_relationship.source_entity_id,
        'target_entity_id', v_relationship.target_entity_id,
        'relationship_type', v_relationship.relationship_type,
        'status', v_relationship.status,
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
      v_now, p_created_by::TEXT, v_user_email, 'entity_relationship',
      v_relationship.id::TEXT, 'material_relationship_create',
      jsonb_build_object(
        'source_entity_id', v_relationship.source_entity_id,
        'source_name', v_source_name,
        'target_entity_id', v_relationship.target_entity_id,
        'target_name', v_target_name,
        'relationship_type', v_relationship.relationship_type,
        'status', v_relationship.status,
        'provenance', 'manual_admin_curation'
      ),
      jsonb_build_array(jsonb_build_object(
        'field', 'status', 'newValue', v_relationship.status
      ))
    );
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'relationship_id', v_relationship.id,
    'source_entity_id', v_relationship.source_entity_id,
    'target_entity_id', v_relationship.target_entity_id,
    'relationship_type', v_relationship.relationship_type,
    'status', v_relationship.status,
    'created', v_created,
    'already_exists', NOT v_created,
    'outbox_event_written', v_outbox_written
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.review_material_relationship(
  p_relationship_id UUID,
  p_reviewed_by UUID,
  p_decision TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_relationship public.entity_relationships%ROWTYPE;
  v_previous_status TEXT;
  v_target_status TEXT;
  v_user_email TEXT;
  v_outbox_written BOOLEAN := FALSE;
  v_now TIMESTAMPTZ := now();
BEGIN
  IF p_reviewed_by IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = p_reviewed_by AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'A current WasteDB admin profile is required';
  END IF;

  v_target_status := CASE btrim(COALESCE(p_decision, ''))
    WHEN 'approve' THEN 'active'
    WHEN 'reject' THEN 'archived'
    ELSE NULL
  END;
  IF v_target_status IS NULL THEN
    RAISE EXCEPTION 'Decision must be approve or reject';
  END IF;

  SELECT * INTO v_relationship
  FROM public.entity_relationships
  WHERE id = p_relationship_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Material relationship does not exist';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.entities
    WHERE id = v_relationship.source_entity_id AND entity_type = 'material'
  ) OR NOT EXISTS (
    SELECT 1 FROM public.entities
    WHERE id = v_relationship.target_entity_id AND entity_type = 'material'
  ) THEN
    RAISE EXCEPTION 'Only material-to-material relationships are reviewable through this flow';
  END IF;

  v_previous_status := v_relationship.status;
  IF v_previous_status = v_target_status THEN
    RETURN jsonb_build_object(
      'success', TRUE,
      'relationship_id', v_relationship.id,
      'status', v_relationship.status,
      'changed', FALSE,
      'already_reviewed', TRUE,
      'outbox_event_written', FALSE
    );
  END IF;

  IF v_previous_status <> 'pending_review' THEN
    RAISE EXCEPTION 'Only pending material relationships can be reviewed';
  END IF;

  UPDATE public.entity_relationships
  SET status = v_target_status,
      reviewed_by = p_reviewed_by,
      reviewed_at = v_now,
      updated_at = v_now
  WHERE id = p_relationship_id
  RETURNING * INTO v_relationship;

  INSERT INTO public.graph_sync_outbox (
    event_key, source_table, source_identifier, operation, payload
  ) VALUES (
    'entity_relationships:review:' || v_target_status || ':' || v_relationship.id,
    'entity_relationships', v_relationship.id::TEXT, 'update',
    jsonb_build_object(
      'relationship_id', v_relationship.id,
      'source_entity_id', v_relationship.source_entity_id,
      'target_entity_id', v_relationship.target_entity_id,
      'relationship_type', v_relationship.relationship_type,
      'previous_status', v_previous_status,
      'status', v_relationship.status,
      'reviewed_by', p_reviewed_by,
      'reviewed_at', v_relationship.reviewed_at,
      'provenance', 'admin_material_relationship_review'
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
    v_now, p_reviewed_by::TEXT, v_user_email, 'entity_relationship',
    v_relationship.id::TEXT, 'material_relationship_' || btrim(p_decision),
    jsonb_build_object('status', v_previous_status),
    jsonb_build_object(
      'status', v_relationship.status,
      'reviewed_by', p_reviewed_by,
      'reviewed_at', v_relationship.reviewed_at
    ),
    jsonb_build_array(jsonb_build_object(
      'field', 'status', 'oldValue', v_previous_status,
      'newValue', v_relationship.status
    ))
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'relationship_id', v_relationship.id,
    'status', v_relationship.status,
    'changed', TRUE,
    'already_reviewed', FALSE,
    'outbox_event_written', v_outbox_written
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_material_relationship(
  p_relationship_id UUID,
  p_deleted_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_relationship public.entity_relationships%ROWTYPE;
  v_user_email TEXT;
  v_outbox_written BOOLEAN := FALSE;
  v_now TIMESTAMPTZ := now();
BEGIN
  IF p_deleted_by IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = p_deleted_by AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'A current WasteDB admin profile is required';
  END IF;

  SELECT * INTO v_relationship
  FROM public.entity_relationships
  WHERE id = p_relationship_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Material relationship does not exist';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.entities
    WHERE id = v_relationship.source_entity_id AND entity_type = 'material'
  ) OR NOT EXISTS (
    SELECT 1 FROM public.entities
    WHERE id = v_relationship.target_entity_id AND entity_type = 'material'
  ) THEN
    RAISE EXCEPTION 'Only material-to-material relationships are deletable through this flow';
  END IF;

  DELETE FROM public.entity_relationships WHERE id = p_relationship_id;

  INSERT INTO public.graph_sync_outbox (
    event_key, source_table, source_identifier, operation, payload
  ) VALUES (
    'entity_relationships:manual:delete:' || p_relationship_id,
    'entity_relationships', p_relationship_id::TEXT, 'delete',
    jsonb_build_object(
      'relationship_id', v_relationship.id,
      'source_entity_id', v_relationship.source_entity_id,
      'target_entity_id', v_relationship.target_entity_id,
      'relationship_type', v_relationship.relationship_type,
      'status', v_relationship.status,
      'deleted_by', p_deleted_by,
      'deleted_at', v_now,
      'provenance', 'manual_admin_curation'
    )
  ) ON CONFLICT (event_key) DO NOTHING;
  v_outbox_written := FOUND;

  SELECT email INTO v_user_email
  FROM public.user_profiles WHERE id = p_deleted_by;
  INSERT INTO public.audit_log (
    id, timestamp, user_id, user_email, entity_type, entity_id,
    action, before, changes
  ) VALUES (
    'audit:' || floor(extract(epoch FROM clock_timestamp()) * 1000)::BIGINT
      || ':' || gen_random_uuid(),
    v_now, p_deleted_by::TEXT, v_user_email, 'entity_relationship',
    p_relationship_id::TEXT, 'material_relationship_delete',
    jsonb_build_object(
      'source_entity_id', v_relationship.source_entity_id,
      'target_entity_id', v_relationship.target_entity_id,
      'relationship_type', v_relationship.relationship_type,
      'status', v_relationship.status
    ),
    jsonb_build_array(jsonb_build_object(
      'field', 'deleted', 'oldValue', FALSE, 'newValue', TRUE
    ))
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'relationship_id', p_relationship_id,
    'deleted', TRUE,
    'outbox_event_written', v_outbox_written
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_content_mapping(
  p_mapping_id UUID,
  p_deleted_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_mapping public.content_entities%ROWTYPE;
  v_user_email TEXT;
  v_outbox_written BOOLEAN := FALSE;
  v_now TIMESTAMPTZ := now();
BEGIN
  IF p_deleted_by IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = p_deleted_by AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'A current WasteDB admin profile is required';
  END IF;

  SELECT * INTO v_mapping
  FROM public.content_entities
  WHERE id = p_mapping_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Content mapping does not exist';
  END IF;

  DELETE FROM public.content_entities WHERE id = p_mapping_id;

  INSERT INTO public.graph_sync_outbox (
    event_key, source_table, source_identifier, operation, payload
  ) VALUES (
    'content_entities:manual:delete:' || p_mapping_id,
    'content_entities', p_mapping_id::TEXT, 'delete',
    jsonb_build_object(
      'mapping_id', v_mapping.id,
      'content_entity_id', v_mapping.content_entity_id,
      'subject_entity_id', v_mapping.subject_entity_id,
      'role', v_mapping.role,
      'status', v_mapping.status,
      'deleted_by', p_deleted_by,
      'deleted_at', v_now,
      'provenance', 'manual_admin_curation'
    )
  ) ON CONFLICT (event_key) DO NOTHING;
  v_outbox_written := FOUND;

  SELECT email INTO v_user_email
  FROM public.user_profiles WHERE id = p_deleted_by;
  INSERT INTO public.audit_log (
    id, timestamp, user_id, user_email, entity_type, entity_id,
    action, before, changes
  ) VALUES (
    'audit:' || floor(extract(epoch FROM clock_timestamp()) * 1000)::BIGINT
      || ':' || gen_random_uuid(),
    v_now, p_deleted_by::TEXT, v_user_email, 'content_entity',
    p_mapping_id::TEXT, 'content_mapping_delete',
    jsonb_build_object(
      'content_entity_id', v_mapping.content_entity_id,
      'subject_entity_id', v_mapping.subject_entity_id,
      'role', v_mapping.role,
      'status', v_mapping.status
    ),
    jsonb_build_array(jsonb_build_object(
      'field', 'deleted', 'oldValue', FALSE, 'newValue', TRUE
    ))
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'mapping_id', p_mapping_id,
    'deleted', TRUE,
    'outbox_event_written', v_outbox_written
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_manual_material_relationship(
  UUID, UUID, UUID, TEXT
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_manual_material_relationship(
  UUID, UUID, UUID, TEXT
) TO service_role;

REVOKE ALL ON FUNCTION public.review_material_relationship(
  UUID, UUID, TEXT
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_material_relationship(
  UUID, UUID, TEXT
) TO service_role;

REVOKE ALL ON FUNCTION public.delete_material_relationship(
  UUID, UUID
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_material_relationship(
  UUID, UUID
) TO service_role;

REVOKE ALL ON FUNCTION public.delete_content_mapping(
  UUID, UUID
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_content_mapping(
  UUID, UUID
) TO service_role;

COMMIT;
