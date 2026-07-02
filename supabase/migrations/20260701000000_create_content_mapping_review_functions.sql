-- Stage 7 reviewed content-mapping quarantine and apply primitives.
--
-- Both functions are service-role-only and execute as one PostgreSQL
-- statement. Any validation, graph, outbox, migration-run, or audit failure
-- rolls the entire operation back.

BEGIN;

-- The foundation governed `discusses` as a relationship type but omitted the
-- equivalent content role used by content_entities. Add it explicitly before
-- the reviewed apply function can reference it.
INSERT INTO public.content_roles (
  slug, label, description, active, approved_at
) VALUES (
  'discusses',
  'Discusses',
  'Meaningfully addresses a subject without implying evidentiary support.',
  true,
  now()
) ON CONFLICT (slug) DO NOTHING;

CREATE INDEX IF NOT EXISTS graph_migration_runs_content_mapping_manifest_idx
  ON public.graph_migration_runs (
    migration_version,
    ((report->>'manifest_checksum'))
  )
  WHERE status = 'completed'
    AND migration_version IN (
      'stage-7-content-mapping-quarantine-v2',
      'stage-7-content-mapping-apply-v2'
    );

CREATE OR REPLACE FUNCTION public.quarantine_content_mapping_candidates(
  p_started_by UUID,
  p_analysis_checksum TEXT,
  p_issues JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_run public.graph_migration_runs%ROWTYPE;
  v_issue JSONB;
  v_count INTEGER;
  v_relationship_count INTEGER := 0;
  v_content_count INTEGER := 0;
  v_report JSONB;
  v_now TIMESTAMPTZ := now();
  v_user_email TEXT;
BEGIN
  IF p_analysis_checksum IS NULL
     OR p_analysis_checksum !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'A lowercase SHA-256 analysis checksum is required';
  END IF;
  IF p_started_by IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.user_profiles WHERE id = p_started_by
  ) THEN
    RAISE EXCEPTION 'A current WasteDB user profile is required';
  END IF;
  IF jsonb_typeof(p_issues) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Quarantine issues must be a JSON array';
  END IF;
  v_count := jsonb_array_length(p_issues);
  IF v_count < 1 OR v_count > 5000 THEN
    RAISE EXCEPTION 'Quarantine issue count must be between 1 and 5000';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_issues) item
    WHERE jsonb_typeof(item) IS DISTINCT FROM 'object'
  ) OR (
    SELECT count(*) <> count(DISTINCT item->>'candidate_key')
    FROM jsonb_array_elements(p_issues) item
  ) THEN
    RAISE EXCEPTION 'Quarantine issues must be objects with unique candidate keys';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended('content-mapping-quarantine:' || p_analysis_checksum, 0)
  );

  SELECT * INTO v_run
  FROM public.graph_migration_runs
  WHERE migration_version = 'stage-7-content-mapping-quarantine-v2'
    AND status = 'completed'
    AND report->>'analysis_checksum' = p_analysis_checksum
  ORDER BY created_at
  LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'contract_version', 'stage-7-content-mapping-quarantine-v2',
      'run_id', v_run.id,
      'generated_at', v_run.completed_at,
      'analysis_checksum', p_analysis_checksum,
      'relationship_issues_written',
        COALESCE((v_run.report->>'relationship_issues_written')::INTEGER, 0),
      'content_mapping_issues_written',
        COALESCE((v_run.report->>'content_mapping_issues_written')::INTEGER, 0),
      'total_issues_written',
        COALESCE((v_run.report->>'total_issues_written')::INTEGER, 0),
      'already_quarantined', true
    );
  END IF;

  INSERT INTO public.graph_migration_runs (
    migration_version, mode, status, started_by, started_at, report
  ) VALUES (
    'stage-7-content-mapping-quarantine-v2',
    'apply',
    'running',
    p_started_by,
    v_now,
    jsonb_build_object('analysis_checksum', p_analysis_checksum)
  ) RETURNING * INTO v_run;

  FOR v_issue IN
    SELECT item FROM jsonb_array_elements(p_issues) item
    ORDER BY item->>'candidate_key'
  LOOP
    IF NULLIF(btrim(v_issue->>'candidate_key'), '') IS NULL
       OR NULLIF(btrim(v_issue->>'source_identifier'), '') IS NULL
       OR NULLIF(btrim(v_issue->>'reason'), '') IS NULL
       OR v_issue->>'issue_category' IS DISTINCT FROM 'awaiting_review'
       OR jsonb_typeof(v_issue->'original_payload') IS DISTINCT FROM 'object'
       OR COALESCE(jsonb_typeof(v_issue->'candidate_matches'), 'null') <> 'array'
       OR COALESCE(jsonb_typeof(v_issue->'diagnostic_metadata'), 'null') <> 'object'
       OR v_issue->>'source_table' NOT IN (
         'material_links',
         'linked_material_ids',
         'articles.legacy_material_kv_id',
         'guides.material_id'
       ) THEN
      RAISE EXCEPTION 'Malformed quarantine issue: %', v_issue->>'candidate_key';
    END IF;

    INSERT INTO public.graph_migration_issues (
      run_id,
      source_table,
      source_identifier,
      issue_category,
      reason,
      original_payload,
      candidate_matches,
      diagnostic_metadata
    ) VALUES (
      v_run.id,
      v_issue->>'source_table',
      v_issue->>'source_identifier',
      'awaiting_review',
      v_issue->>'reason',
      v_issue->'original_payload',
      COALESCE(v_issue->'candidate_matches', '[]'::jsonb),
      COALESCE(v_issue->'diagnostic_metadata', '{}'::jsonb)
        || jsonb_build_object('candidate_key', v_issue->>'candidate_key')
    );

    IF v_issue->>'source_table' IN ('material_links', 'linked_material_ids') THEN
      v_relationship_count := v_relationship_count + 1;
    ELSE
      v_content_count := v_content_count + 1;
    END IF;
  END LOOP;

  v_report := jsonb_build_object(
    'analysis_checksum', p_analysis_checksum,
    'manifest_checksum', p_analysis_checksum,
    'relationship_issues_written', v_relationship_count,
    'content_mapping_issues_written', v_content_count,
    'total_issues_written', v_count
  );

  UPDATE public.graph_migration_runs
  SET status = 'completed', completed_at = now(), report = v_report
  WHERE id = v_run.id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quarantine migration run could not be finalized';
  END IF;

  SELECT email INTO v_user_email
  FROM public.user_profiles WHERE id = p_started_by;
  INSERT INTO public.audit_log (
    id, timestamp, user_id, user_email, entity_type, entity_id,
    action, after, changes
  ) VALUES (
    'audit:' || floor(extract(epoch FROM clock_timestamp()) * 1000)::BIGINT
      || ':' || gen_random_uuid(),
    now(), p_started_by::TEXT, v_user_email, 'graph_migration_run',
    v_run.id::TEXT, 'content_mapping_quarantine', v_report,
    jsonb_build_array(jsonb_build_object('field', 'status', 'newValue', 'completed'))
  );

  RETURN jsonb_build_object(
    'contract_version', 'stage-7-content-mapping-quarantine-v2',
    'run_id', v_run.id,
    'generated_at', now(),
    'analysis_checksum', p_analysis_checksum,
    'relationship_issues_written', v_relationship_count,
    'content_mapping_issues_written', v_content_count,
    'total_issues_written', v_count,
    'already_quarantined', false
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_content_mapping_candidates(
  p_started_by UUID,
  p_analysis_checksum TEXT,
  p_manifest_checksum TEXT,
  p_relationships JSONB,
  p_content_mappings JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_run public.graph_migration_runs%ROWTYPE;
  v_item JSONB;
  v_source UUID;
  v_target UUID;
  v_inserted_id UUID;
  v_relationships_inserted INTEGER := 0;
  v_relationships_skipped INTEGER := 0;
  v_content_inserted INTEGER := 0;
  v_content_skipped INTEGER := 0;
  v_outbox_written INTEGER := 0;
  v_outbox_skipped INTEGER := 0;
  v_total INTEGER;
  v_report JSONB;
  v_now TIMESTAMPTZ := now();
  v_user_email TEXT;
BEGIN
  IF p_analysis_checksum IS NULL
     OR p_analysis_checksum !~ '^[a-f0-9]{64}$'
     OR p_manifest_checksum IS NULL
     OR p_manifest_checksum !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'Lowercase SHA-256 analysis and manifest checksums are required';
  END IF;
  IF p_started_by IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.user_profiles WHERE id = p_started_by
  ) THEN
    RAISE EXCEPTION 'A current WasteDB user profile is required';
  END IF;
  IF jsonb_typeof(p_relationships) IS DISTINCT FROM 'array'
     OR jsonb_typeof(p_content_mappings) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Approved relationship and content manifests must be arrays';
  END IF;
  v_total := jsonb_array_length(p_relationships)
    + jsonb_array_length(p_content_mappings);
  IF v_total < 1 OR v_total > 1000 THEN
    RAISE EXCEPTION 'Approved candidate count must be between 1 and 1000';
  END IF;
  IF EXISTS (
    SELECT 1 FROM (
      SELECT item FROM jsonb_array_elements(p_relationships) item
      UNION ALL
      SELECT item FROM jsonb_array_elements(p_content_mappings) item
    ) candidates
    WHERE jsonb_typeof(item) IS DISTINCT FROM 'object'
  ) OR (
    SELECT count(*) <> count(DISTINCT item->>'candidate_key')
    FROM (
      SELECT item FROM jsonb_array_elements(p_relationships) item
      UNION ALL
      SELECT item FROM jsonb_array_elements(p_content_mappings) item
    ) candidates
  ) THEN
    RAISE EXCEPTION 'Approved candidates must be objects with unique candidate keys';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended('content-mapping-apply:' || p_manifest_checksum, 0)
  );

  SELECT * INTO v_run
  FROM public.graph_migration_runs
  WHERE migration_version = 'stage-7-content-mapping-apply-v2'
    AND status = 'completed'
    AND report->>'manifest_checksum' = p_manifest_checksum
  ORDER BY created_at
  LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'contract_version', 'stage-7-content-mapping-apply-v2',
      'run_id', v_run.id,
      'generated_at', v_run.completed_at,
      'analysis_checksum', v_run.report->>'analysis_checksum',
      'manifest_checksum', p_manifest_checksum,
      'approved_candidate_count',
        COALESCE((v_run.report->>'approved_candidate_count')::INTEGER, 0),
      'relationships_inserted',
        COALESCE((v_run.report->>'relationships_inserted')::INTEGER, 0),
      'relationships_skipped',
        COALESCE((v_run.report->>'relationships_skipped')::INTEGER, 0),
      'content_mappings_inserted',
        COALESCE((v_run.report->>'content_mappings_inserted')::INTEGER, 0),
      'content_mappings_skipped',
        COALESCE((v_run.report->>'content_mappings_skipped')::INTEGER, 0),
      'outbox_events_written',
        COALESCE((v_run.report->>'outbox_events_written')::INTEGER, 0),
      'outbox_events_skipped',
        COALESCE((v_run.report->>'outbox_events_skipped')::INTEGER, 0),
      'already_applied', true
    );
  END IF;

  INSERT INTO public.graph_migration_runs (
    migration_version, mode, status, started_by, started_at, report
  ) VALUES (
    'stage-7-content-mapping-apply-v2',
    'apply',
    'running',
    p_started_by,
    v_now,
    jsonb_build_object(
      'analysis_checksum', p_analysis_checksum,
      'manifest_checksum', p_manifest_checksum
    )
  ) RETURNING * INTO v_run;

  FOR v_item IN
    SELECT item FROM jsonb_array_elements(p_relationships) item
    ORDER BY item->>'candidate_key'
  LOOP
    IF NULLIF(btrim(v_item->>'candidate_key'), '') IS NULL
       OR v_item->>'provenance' NOT IN ('material_links', 'linked_material_ids')
       OR NULLIF(v_item->>'source_entity_id', '') IS NULL
       OR NULLIF(v_item->>'target_entity_id', '') IS NULL THEN
      RAISE EXCEPTION 'Malformed approved relationship candidate';
    END IF;
    v_source := (v_item->>'source_entity_id')::UUID;
    v_target := (v_item->>'target_entity_id')::UUID;
    IF v_source = v_target THEN
      RAISE EXCEPTION 'Self relationships cannot be applied';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.entities
      WHERE id = v_source AND entity_type = 'material'
    ) OR NOT EXISTS (
      SELECT 1 FROM public.entities
      WHERE id = v_target AND entity_type = 'material'
    ) THEN
      RAISE EXCEPTION 'Relationship candidates must reference material entities';
    END IF;

    v_inserted_id := NULL;
    INSERT INTO public.entity_relationships (
      source_entity_id, target_entity_id, relationship_type,
      metadata, status, created_by
    ) VALUES (
      v_source, v_target, 'related_to',
      jsonb_build_object(
        'provenance', v_item->>'provenance',
        'candidate_key', v_item->>'candidate_key',
        'migration_run_id', v_run.id
      ),
      'pending_review', p_started_by
    )
    ON CONFLICT (source_entity_id, target_entity_id, relationship_type)
      DO NOTHING
    RETURNING id INTO v_inserted_id;
    IF v_inserted_id IS NULL THEN
      v_relationships_skipped := v_relationships_skipped + 1;
    ELSE
      v_relationships_inserted := v_relationships_inserted + 1;
    END IF;

    v_inserted_id := NULL;
    INSERT INTO public.graph_sync_outbox (
      event_key, source_table, source_identifier, operation, payload
    ) VALUES (
      'entity_relationships:insert:' || v_source || ':' || v_target || ':related_to',
      'entity_relationships', v_source || ':' || v_target, 'insert',
      jsonb_build_object(
        'source_entity_id', v_source,
        'target_entity_id', v_target,
        'relationship_type', 'related_to',
        'status', 'pending_review',
        'provenance', v_item->>'provenance',
        'candidate_key', v_item->>'candidate_key',
        'migration_run_id', v_run.id
      )
    ) ON CONFLICT (event_key) DO NOTHING
    RETURNING id INTO v_inserted_id;
    IF v_inserted_id IS NULL THEN
      v_outbox_skipped := v_outbox_skipped + 1;
    ELSE
      v_outbox_written := v_outbox_written + 1;
    END IF;
  END LOOP;

  FOR v_item IN
    SELECT item FROM jsonb_array_elements(p_content_mappings) item
    ORDER BY item->>'candidate_key'
  LOOP
    IF NULLIF(btrim(v_item->>'candidate_key'), '') IS NULL
       OR v_item->>'provenance' NOT IN (
         'articles.legacy_material_kv_id', 'guides.material_id'
       )
       OR NULLIF(v_item->>'content_entity_id', '') IS NULL
       OR NULLIF(v_item->>'subject_entity_id', '') IS NULL THEN
      RAISE EXCEPTION 'Malformed approved content-mapping candidate';
    END IF;
    v_source := (v_item->>'content_entity_id')::UUID;
    v_target := (v_item->>'subject_entity_id')::UUID;
    IF v_source = v_target THEN
      RAISE EXCEPTION 'Self content mappings cannot be applied';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.entities
      WHERE id = v_source AND entity_type IN ('article', 'guide')
    ) OR NOT EXISTS (
      SELECT 1 FROM public.entities
      WHERE id = v_target AND entity_type = 'material'
    ) THEN
      RAISE EXCEPTION 'Content mappings must reference content and material entities';
    END IF;

    v_inserted_id := NULL;
    INSERT INTO public.content_entities (
      content_entity_id, subject_entity_id, role, status, created_by
    ) VALUES (
      v_source, v_target, 'discusses', 'pending_review', p_started_by
    )
    ON CONFLICT (content_entity_id, subject_entity_id, role) DO NOTHING
    RETURNING id INTO v_inserted_id;
    IF v_inserted_id IS NULL THEN
      v_content_skipped := v_content_skipped + 1;
    ELSE
      v_content_inserted := v_content_inserted + 1;
    END IF;

    v_inserted_id := NULL;
    INSERT INTO public.graph_sync_outbox (
      event_key, source_table, source_identifier, operation, payload
    ) VALUES (
      'content_entities:insert:' || v_source || ':' || v_target || ':discusses',
      'content_entities', v_source || ':' || v_target, 'insert',
      jsonb_build_object(
        'content_entity_id', v_source,
        'subject_entity_id', v_target,
        'role', 'discusses',
        'status', 'pending_review',
        'provenance', v_item->>'provenance',
        'candidate_key', v_item->>'candidate_key',
        'migration_run_id', v_run.id
      )
    ) ON CONFLICT (event_key) DO NOTHING
    RETURNING id INTO v_inserted_id;
    IF v_inserted_id IS NULL THEN
      v_outbox_skipped := v_outbox_skipped + 1;
    ELSE
      v_outbox_written := v_outbox_written + 1;
    END IF;
  END LOOP;

  v_report := jsonb_build_object(
    'analysis_checksum', p_analysis_checksum,
    'manifest_checksum', p_manifest_checksum,
    'approved_candidate_count', v_total,
    'relationships_inserted', v_relationships_inserted,
    'relationships_skipped', v_relationships_skipped,
    'content_mappings_inserted', v_content_inserted,
    'content_mappings_skipped', v_content_skipped,
    'outbox_events_written', v_outbox_written,
    'outbox_events_skipped', v_outbox_skipped
  );

  UPDATE public.graph_migration_runs
  SET status = 'completed', completed_at = now(), report = v_report
  WHERE id = v_run.id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Content-mapping apply run could not be finalized';
  END IF;

  SELECT email INTO v_user_email
  FROM public.user_profiles WHERE id = p_started_by;
  INSERT INTO public.audit_log (
    id, timestamp, user_id, user_email, entity_type, entity_id,
    action, after, changes
  ) VALUES (
    'audit:' || floor(extract(epoch FROM clock_timestamp()) * 1000)::BIGINT
      || ':' || gen_random_uuid(),
    now(), p_started_by::TEXT, v_user_email, 'graph_migration_run',
    v_run.id::TEXT, 'content_mapping_apply', v_report,
    jsonb_build_array(jsonb_build_object('field', 'status', 'newValue', 'completed'))
  );

  RETURN jsonb_build_object(
    'contract_version', 'stage-7-content-mapping-apply-v2',
    'run_id', v_run.id,
    'generated_at', now(),
    'analysis_checksum', p_analysis_checksum,
    'manifest_checksum', p_manifest_checksum,
    'approved_candidate_count', v_total,
    'relationships_inserted', v_relationships_inserted,
    'relationships_skipped', v_relationships_skipped,
    'content_mappings_inserted', v_content_inserted,
    'content_mappings_skipped', v_content_skipped,
    'outbox_events_written', v_outbox_written,
    'outbox_events_skipped', v_outbox_skipped,
    'already_applied', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.quarantine_content_mapping_candidates(
  UUID, TEXT, JSONB
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.quarantine_content_mapping_candidates(
  UUID, TEXT, JSONB
) TO service_role;

REVOKE ALL ON FUNCTION public.apply_content_mapping_candidates(
  UUID, TEXT, TEXT, JSONB, JSONB
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_content_mapping_candidates(
  UUID, TEXT, TEXT, JSONB, JSONB
) TO service_role;

COMMIT;
