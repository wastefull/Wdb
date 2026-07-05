-- Stage 7: prefer exact identifier matches (id/legacy_kv_id/slug/name)
-- before normalized/fuzzy matching when resolving reviewed video triage links.

BEGIN;

CREATE OR REPLACE FUNCTION public.process_reviewed_video_material_mappings(
  p_admin_id UUID,
  p_apply BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_candidate RECORD;
  v_match_count INTEGER;
  v_exact_match_count INTEGER;
  v_material_entity_id UUID;
  v_mapping_id UUID;
  v_candidate_count INTEGER := 0;
  v_resolved_count INTEGER := 0;
  v_unresolved_count INTEGER := 0;
  v_existing_count INTEGER := 0;
  v_created_count INTEGER := 0;
  v_outbox_count INTEGER := 0;
  v_unresolved JSONB := '[]'::JSONB;
  v_user_email TEXT;
  v_now TIMESTAMPTZ := now();
  v_identifier_lower TEXT;
  v_identifier_normalized TEXT;
BEGIN
  IF p_admin_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = p_admin_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'A current WasteDB admin profile is required';
  END IF;

  FOR v_candidate IN
    SELECT
      vii.video_id,
      video_binding.entity_id AS video_entity_id,
      btrim(identifier.value) AS material_identifier,
      (array_agg(vii.id ORDER BY vii.id))[1] AS import_item_id
    FROM public.video_import_items vii
    CROSS JOIN LATERAL unnest(vii.material_identifiers) identifier(value)
    JOIN public.entity_canonical_bindings video_binding
      ON video_binding.video_id = vii.video_id
    WHERE vii.review_status = 'reviewed'
      AND vii.disposition IN ('material_video', 'both')
      AND vii.video_id IS NOT NULL
      AND NULLIF(btrim(identifier.value), '') IS NOT NULL
    GROUP BY vii.video_id, video_binding.entity_id, btrim(identifier.value)
    ORDER BY video_binding.entity_id, btrim(identifier.value)
  LOOP
    v_candidate_count := v_candidate_count + 1;
    v_identifier_lower := lower(v_candidate.material_identifier);
    v_identifier_normalized := regexp_replace(v_identifier_lower, '[^a-z0-9]+', '', 'g');

    -- Exact identifiers take precedence over fuzzy/normalized matches.
    SELECT count(*)::INTEGER, (array_agg(binding.entity_id ORDER BY m.name))[1]
    INTO v_exact_match_count, v_material_entity_id
    FROM public.materials m
    JOIN public.entity_canonical_bindings binding ON binding.material_id = m.id
    WHERE v_identifier_lower IN (
      lower(m.id::TEXT),
      lower(COALESCE(m.legacy_kv_id, '')),
      lower(COALESCE(m.slug, '')),
      lower(m.name)
    );

    IF v_exact_match_count = 1 AND v_material_entity_id IS NOT NULL THEN
      v_match_count := 1;
    ELSIF v_exact_match_count > 1 THEN
      v_match_count := v_exact_match_count;
      v_material_entity_id := NULL;
    ELSE
      SELECT count(*)::INTEGER, (array_agg(binding.entity_id ORDER BY m.name))[1]
      INTO v_match_count, v_material_entity_id
      FROM public.materials m
      JOIN public.entity_canonical_bindings binding ON binding.material_id = m.id
      WHERE v_identifier_normalized = regexp_replace(lower(m.name), '[^a-z0-9]+', '', 'g')
      OR EXISTS (
        SELECT 1
        FROM unnest(COALESCE(m.aliases, '{}'::TEXT[])) alias(value)
        WHERE v_identifier_normalized = regexp_replace(lower(alias.value), '[^a-z0-9]+', '', 'g')
      );
    END IF;

    IF v_match_count <> 1 OR v_material_entity_id IS NULL THEN
      v_unresolved_count := v_unresolved_count + 1;
      v_unresolved := v_unresolved || jsonb_build_array(jsonb_build_object(
        'video_id', v_candidate.video_id,
        'video_entity_id', v_candidate.video_entity_id,
        'import_item_id', v_candidate.import_item_id,
        'material_identifier', v_candidate.material_identifier,
        'match_count', v_match_count
      ));
      CONTINUE;
    END IF;

    v_resolved_count := v_resolved_count + 1;
    IF EXISTS (
      SELECT 1 FROM public.content_entities
      WHERE content_entity_id = v_candidate.video_entity_id
        AND subject_entity_id = v_material_entity_id
        AND role = 'primary_subject'
    ) THEN
      v_existing_count := v_existing_count + 1;
      CONTINUE;
    END IF;

    IF p_apply THEN
      v_mapping_id := NULL;
      INSERT INTO public.content_entities (
        content_entity_id, subject_entity_id, role, status, created_by
      ) VALUES (
        v_candidate.video_entity_id, v_material_entity_id,
        'primary_subject', 'pending_review', p_admin_id
      )
      ON CONFLICT (content_entity_id, subject_entity_id, role) DO NOTHING
      RETURNING id INTO v_mapping_id;

      IF v_mapping_id IS NULL THEN
        v_existing_count := v_existing_count + 1;
      ELSE
        v_created_count := v_created_count + 1;
        INSERT INTO public.graph_sync_outbox (
          event_key, source_table, source_identifier, operation, payload
        ) VALUES (
          'content_entities:video-triage:insert:' || v_mapping_id,
          'content_entities', v_mapping_id::TEXT, 'insert',
          jsonb_build_object(
            'mapping_id', v_mapping_id,
            'content_entity_id', v_candidate.video_entity_id,
            'subject_entity_id', v_material_entity_id,
            'role', 'primary_subject',
            'status', 'pending_review',
            'provenance', 'reviewed_video_triage',
            'import_item_id', v_candidate.import_item_id,
            'material_identifier', v_candidate.material_identifier
          )
        ) ON CONFLICT (event_key) DO NOTHING;
        IF FOUND THEN v_outbox_count := v_outbox_count + 1; END IF;
      END IF;
    END IF;
  END LOOP;

  IF p_apply THEN
    SELECT email INTO v_user_email FROM public.user_profiles WHERE id = p_admin_id;
    INSERT INTO public.audit_log (
      id, timestamp, user_id, user_email, entity_type, entity_id,
      action, after, changes
    ) VALUES (
      'audit:' || floor(extract(epoch FROM clock_timestamp()) * 1000)::BIGINT
        || ':' || gen_random_uuid(),
      v_now, p_admin_id::TEXT, v_user_email, 'video_import_batch',
      'reviewed-video-material-mappings', 'video_material_mapping_apply',
      jsonb_build_object(
        'candidate_count', v_candidate_count,
        'resolved_count', v_resolved_count,
        'unresolved_count', v_unresolved_count,
        'existing_count', v_existing_count,
        'created_count', v_created_count,
        'outbox_count', v_outbox_count,
        'role', 'primary_subject',
        'status', 'pending_review'
      ),
      jsonb_build_array(jsonb_build_object(
        'field', 'content_mappings', 'newValue', v_created_count
      ))
    );
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'mode', CASE WHEN p_apply THEN 'apply' ELSE 'preview' END,
    'candidate_count', v_candidate_count,
    'resolved_count', v_resolved_count,
    'unresolved_count', v_unresolved_count,
    'existing_count', v_existing_count,
    'creatable_count', v_resolved_count - v_existing_count,
    'created_count', v_created_count,
    'outbox_count', v_outbox_count,
    'role', 'primary_subject',
    'status', 'pending_review',
    'unresolved', v_unresolved
  );
END;
$$;

REVOKE ALL ON FUNCTION public.process_reviewed_video_material_mappings(
  UUID, BOOLEAN
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_reviewed_video_material_mappings(
  UUID, BOOLEAN
) TO service_role;

COMMIT;
