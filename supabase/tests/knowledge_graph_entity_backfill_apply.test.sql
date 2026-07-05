BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL ROLE postgres;
SET LOCAL search_path = public, extensions;

SELECT plan(24);

SELECT has_function(
  'public',
  'apply_graph_entity_backfill_phase',
  ARRAY['uuid', 'text', 'jsonb', 'text']
);
SELECT has_function(
  'public',
  'finalize_graph_entity_backfill_run',
  ARRAY['uuid', 'text', 'jsonb', 'text']
);

SELECT ok(
  NOT has_function_privilege(
    'anon',
    'public.apply_graph_entity_backfill_phase(uuid,text,jsonb,text)',
    'EXECUTE'
  ),
  'Anonymous users cannot execute entity-backfill phases'
);
SELECT ok(
  NOT has_function_privilege(
    'authenticated',
    'public.apply_graph_entity_backfill_phase(uuid,text,jsonb,text)',
    'EXECUTE'
  ),
  'Authenticated clients cannot execute entity-backfill phases directly'
);
SELECT ok(
  has_function_privilege(
    'service_role',
    'public.apply_graph_entity_backfill_phase(uuid,text,jsonb,text)',
    'EXECUTE'
  ),
  'Service-role workers can execute reviewed entity-backfill phases'
);

-- Preserve this Stage 6 fixture's original purpose: exercise the backfill's
-- insert path rather than the Stage 7 material compatibility trigger.
ALTER TABLE public.materials
  DISABLE TRIGGER materials_sync_canonical_binding;

INSERT INTO public.materials (
  id,
  name,
  slug,
  description,
  status
)
VALUES (
  '00000000-0000-0000-0000-000000000221',
  'Stage 6 Apply Material',
  'stage-6-apply-material',
  'Transactional apply test material.',
  'published'
);

ALTER TABLE public.materials
  ENABLE TRIGGER materials_sync_canonical_binding;

INSERT INTO public.graph_migration_runs (
  id,
  migration_version,
  mode,
  status,
  started_at,
  report
)
VALUES (
  '00000000-0000-0000-0000-000000000222',
  'stage-6-entity-backfill-v1',
  'apply',
  'running',
  now(),
  '{"expected_report_checksum":"test"}'::jsonb
);

SET LOCAL ROLE service_role;
CREATE TEMP TABLE entity_apply_results AS
SELECT public.apply_graph_entity_backfill_phase(
  '00000000-0000-0000-0000-000000000222',
  'materials',
  jsonb_build_array(
    jsonb_build_object(
      'source_table', 'materials',
      'source_id', '00000000-0000-0000-0000-000000000221',
      'binding_column', 'material_id',
      'entity_type', 'material',
      'name', 'Stage 6 Apply Material',
      'slug', 'stage-6-apply-material',
      'description', 'Transactional apply test material.',
      'status', 'active'
    )
  ),
  repeat('a', 64)
) AS result;
SET LOCAL ROLE postgres;

SELECT is(
  (SELECT result->>'success' FROM entity_apply_results),
  'true',
  'A valid phase applies successfully'
);
SELECT is(
  (SELECT (result->>'inserted')::bigint FROM entity_apply_results),
  1::bigint,
  'The first phase inserts one entity and binding pair'
);
SELECT results_eq(
  $$
    SELECT entity_type, name, slug, description, status
    FROM public.entities
    WHERE slug = 'stage-6-apply-material'
  $$,
  $$
    VALUES (
      'material',
      'Stage 6 Apply Material',
      'stage-6-apply-material',
      'Transactional apply test material.',
      'active'
    )
  $$,
  'The entity fields match the reviewed apply plan'
);
SELECT results_eq(
  $$
    SELECT count(*)::bigint
    FROM public.entity_canonical_bindings
    WHERE material_id = '00000000-0000-0000-0000-000000000221'
  $$,
  $$ VALUES (1::bigint) $$,
  'The inserted entity has exactly one canonical material binding'
);
SELECT results_eq(
  $$
    SELECT status, processed_count, inserted_count, updated_count
    FROM public.graph_migration_checkpoints
    WHERE run_id = '00000000-0000-0000-0000-000000000222'
      AND phase = 'materials'
  $$,
  $$ VALUES ('completed', 1::bigint, 1::bigint, 0::bigint) $$,
  'A successful phase records a completed checkpoint'
);

SELECT throws_ok(
  $$
    INSERT INTO public.graph_migration_runs (
      migration_version,
      mode,
      status,
      started_at
    )
    VALUES (
      'stage-6-entity-backfill-v1',
      'apply',
      'running',
      now()
    )
  $$,
  23505,
  NULL,
  'A concurrent active entity-backfill run is rejected'
);

SET LOCAL ROLE service_role;
CREATE TEMP TABLE empty_phase_results AS
SELECT phase, public.apply_graph_entity_backfill_phase(
  '00000000-0000-0000-0000-000000000222',
  phase,
  '[]'::jsonb,
  repeat('d', 64)
) AS result
FROM unnest(ARRAY['articles', 'guides', 'blog_posts', 'sources']) AS phase;
SET LOCAL ROLE postgres;

SELECT results_eq(
  $$
    SELECT count(*)::bigint
    FROM empty_phase_results
    WHERE result->>'success' = 'true'
  $$,
  $$ VALUES (4::bigint) $$,
  'Empty canonical phases complete without fabricating rows'
);

SET LOCAL ROLE service_role;
CREATE TEMP TABLE finalized_run AS
SELECT (
  public.finalize_graph_entity_backfill_run(
    '00000000-0000-0000-0000-000000000222',
    'completed',
    '{"missing_bindings":0}'::jsonb,
    NULL
  )
).*;
SET LOCAL ROLE postgres;

SELECT results_eq(
  $$
    SELECT status, report->'reconciliation'->>'missing_bindings'
    FROM finalized_run
  $$,
  $$ VALUES ('completed', '0') $$,
  'A run finalizes only after all five phases complete'
);

INSERT INTO public.graph_migration_runs (
  id,
  migration_version,
  mode,
  status,
  started_at
)
VALUES (
  '00000000-0000-0000-0000-000000000223',
  'stage-6-entity-backfill-v1',
  'apply',
  'running',
  now()
);

SET LOCAL ROLE service_role;
CREATE TEMP TABLE repeated_apply_result AS
SELECT public.apply_graph_entity_backfill_phase(
  '00000000-0000-0000-0000-000000000223',
  'materials',
  jsonb_build_array(
    jsonb_build_object(
      'source_table', 'materials',
      'source_id', '00000000-0000-0000-0000-000000000221',
      'binding_column', 'material_id',
      'entity_type', 'material',
      'name', 'Stage 6 Apply Material',
      'slug', 'stage-6-apply-material',
      'description', 'Transactional apply test material.',
      'status', 'active'
    )
  ),
  repeat('b', 64)
) AS result;
SET LOCAL ROLE postgres;

SELECT is(
  (SELECT (result->>'reconciled')::bigint FROM repeated_apply_result),
  1::bigint,
  'A repeated apply reconciles the existing entity instead of duplicating it'
);
SELECT results_eq(
  $$
    SELECT count(*)::bigint
    FROM public.entities
    WHERE entity_type = 'material'
      AND slug = 'stage-6-apply-material'
  $$,
  $$ VALUES (1::bigint) $$,
  'Repeated apply produces no duplicate entity'
);

UPDATE public.graph_migration_runs
SET status = 'failed',
    completed_at = now(),
    error_message = 'Test fixture closed after idempotency assertion'
WHERE id = '00000000-0000-0000-0000-000000000223';

INSERT INTO public.graph_migration_runs (
  id,
  migration_version,
  mode,
  status,
  started_at
)
VALUES (
  '00000000-0000-0000-0000-000000000224',
  'stage-6-entity-backfill-v1',
  'apply',
  'running',
  now()
);

SET LOCAL ROLE service_role;
CREATE TEMP TABLE failed_apply_result AS
SELECT public.apply_graph_entity_backfill_phase(
  '00000000-0000-0000-0000-000000000224',
  'materials',
  jsonb_build_array(
    jsonb_build_object(
      'source_table', 'materials',
      'source_id', '00000000-0000-0000-0000-000000000221',
      'binding_column', 'material_id',
      'entity_type', 'article',
      'name', 'Invalid mapping',
      'slug', 'invalid-mapping',
      'description', NULL,
      'status', 'active'
    )
  ),
  repeat('c', 64)
) AS result;
SET LOCAL ROLE postgres;

SELECT is(
  (SELECT result->>'success' FROM failed_apply_result),
  'false',
  'A malformed phase returns a controlled failure'
);
SELECT results_eq(
  $$
    SELECT status
    FROM public.graph_migration_checkpoints
    WHERE run_id = '00000000-0000-0000-0000-000000000224'
      AND phase = 'materials'
  $$,
  $$ VALUES ('failed') $$,
  'A failed phase persists its failed checkpoint'
);
SELECT results_eq(
  $$
    SELECT status
    FROM public.graph_migration_runs
    WHERE id = '00000000-0000-0000-0000-000000000224'
  $$,
  $$ VALUES ('failed') $$,
  'A failed phase marks its migration run failed'
);
SELECT results_eq(
  $$
    SELECT count(*)::bigint
    FROM public.entities
    WHERE slug = 'invalid-mapping'
  $$,
  $$ VALUES (0::bigint) $$,
  'A failed phase rolls back all graph mutations from that phase'
);
SELECT results_eq(
  $$
    SELECT count(*)::bigint
    FROM public.entity_canonical_bindings
    WHERE material_id = '00000000-0000-0000-0000-000000000221'
  $$,
  $$ VALUES (1::bigint) $$,
  'The failed retry preserves the previously reconciled canonical binding'
);

INSERT INTO public.graph_migration_issues (
  run_id,
  source_table,
  source_identifier,
  issue_category,
  reason,
  original_payload,
  candidate_matches,
  diagnostic_metadata
)
VALUES (
  '00000000-0000-0000-0000-000000000224',
  'materials',
  '00000000-0000-0000-0000-000000000221',
  'manual_correction_test',
  'Synthetic issue used to verify correction idempotency.',
  '{"name":"Original material payload"}'::jsonb,
  '[]'::jsonb,
  '{"test":true}'::jsonb
);

UPDATE public.graph_migration_issues
SET resolution_status = 'resolved',
    resolution_notes = 'Reviewed synthetic correction',
    resolved_at = now()
WHERE run_id = '00000000-0000-0000-0000-000000000224'
  AND issue_category = 'manual_correction_test';

SELECT results_eq(
  $$
    SELECT count(*)::bigint, min(resolution_status)
    FROM public.graph_migration_issues
    WHERE run_id = '00000000-0000-0000-0000-000000000224'
      AND issue_category = 'manual_correction_test'
  $$,
  $$ VALUES (1::bigint, 'resolved') $$,
  'A reviewed correction resolves one durable issue record'
);

SELECT results_eq(
  $$
    SELECT original_payload
    FROM public.graph_migration_issues
    WHERE run_id = '00000000-0000-0000-0000-000000000224'
      AND issue_category = 'manual_correction_test'
  $$,
  $$ VALUES ('{"name":"Original material payload"}'::jsonb) $$,
  'Resolving an issue preserves its original source payload'
);

SELECT throws_ok(
  $$
    UPDATE public.graph_migration_issues
    SET original_payload = '{"name":"Mutated payload"}'::jsonb
    WHERE run_id = '00000000-0000-0000-0000-000000000224'
      AND issue_category = 'manual_correction_test'
  $$,
  'P0001',
  'graph_migration_issues.original_payload is immutable',
  'Manual correction cannot overwrite the quarantined original payload'
);

SELECT lives_ok(
  $$
    UPDATE public.graph_migration_issues
    SET resolution_status = 'resolved',
        resolution_notes = 'Reviewed synthetic correction'
    WHERE run_id = '00000000-0000-0000-0000-000000000224'
      AND issue_category = 'manual_correction_test'
  $$,
  'Repeating the same reviewed correction is idempotent'
);

SELECT * FROM finish();

ROLLBACK;
