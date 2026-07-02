BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL ROLE postgres;
SET LOCAL search_path = public, extensions;

SELECT plan(21);

SELECT has_function(
  'public'::name,
  'quarantine_content_mapping_candidates'::name,
  ARRAY['uuid', 'text', 'jsonb']::name[]
);
SELECT has_function(
  'public'::name,
  'apply_content_mapping_candidates'::name,
  ARRAY['uuid', 'text', 'text', 'jsonb', 'jsonb']::name[]
);
SELECT ok(
  has_function_privilege(
    'service_role',
    'public.apply_content_mapping_candidates(uuid,text,text,jsonb,jsonb)',
    'EXECUTE'
  ),
  'Service role can execute reviewed content-mapping apply'
);
SELECT ok(
  NOT has_function_privilege(
    'authenticated',
    'public.apply_content_mapping_candidates(uuid,text,text,jsonb,jsonb)',
    'EXECUTE'
  ),
  'Authenticated clients cannot invoke reviewed apply directly'
);
SELECT ok(
  has_function_privilege(
    'service_role',
    'public.quarantine_content_mapping_candidates(uuid,text,jsonb)',
    'EXECUTE'
  ),
  'Service role can execute transactional quarantine'
);
SELECT ok(
  NOT has_function_privilege(
    'authenticated',
    'public.quarantine_content_mapping_candidates(uuid,text,jsonb)',
    'EXECUTE'
  ),
  'Authenticated clients cannot invoke quarantine directly'
);

INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-000000000081', 'content-mapping-admin@example.test')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.user_profiles (id, email, name, role) VALUES (
  '00000000-0000-0000-0000-000000000081',
  'content-mapping-admin@example.test',
  'Content Mapping Admin',
  'admin'
) ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

INSERT INTO public.entities (id, entity_type, name, status, created_by) VALUES
  (
    '00000000-0000-0000-0000-000000000082', 'material',
    'Apply material A', 'pending_review',
    '00000000-0000-0000-0000-000000000081'
  ),
  (
    '00000000-0000-0000-0000-000000000083', 'material',
    'Apply material B', 'pending_review',
    '00000000-0000-0000-0000-000000000081'
  ),
  (
    '00000000-0000-0000-0000-000000000084', 'article',
    'Apply article', 'pending_review',
    '00000000-0000-0000-0000-000000000081'
  ) ON CONFLICT (id) DO NOTHING;

SET LOCAL ROLE service_role;

CREATE TEMP TABLE content_mapping_apply_result(payload JSONB);
GRANT SELECT, INSERT, DELETE, TRUNCATE ON content_mapping_apply_result
  TO service_role;

INSERT INTO content_mapping_apply_result(payload)
SELECT public.apply_content_mapping_candidates(
  '00000000-0000-0000-0000-000000000081',
  repeat('a', 64),
  repeat('b', 64),
  jsonb_build_array(jsonb_build_object(
    'candidate_key', 'relationship:fixture:a:b',
    'source_entity_id', '00000000-0000-0000-0000-000000000082',
    'target_entity_id', '00000000-0000-0000-0000-000000000083',
    'provenance', 'material_links'
  )),
  jsonb_build_array(jsonb_build_object(
    'candidate_key', 'content:article:fixture:a',
    'content_entity_id', '00000000-0000-0000-0000-000000000084',
    'subject_entity_id', '00000000-0000-0000-0000-000000000082',
    'provenance', 'articles.legacy_material_kv_id'
  ))
);

SELECT results_eq(
  $$ SELECT
       (payload->>'relationships_inserted')::INTEGER,
       (payload->>'content_mappings_inserted')::INTEGER,
       (payload->>'outbox_events_written')::INTEGER,
       payload->>'already_applied'
     FROM content_mapping_apply_result $$,
  $$ VALUES (1, 1, 2, 'false'::text) $$,
  'Approved graph rows and matching outbox events commit together'
);
SELECT is(
  (SELECT count(*) FROM public.entity_relationships
   WHERE source_entity_id = '00000000-0000-0000-0000-000000000082'
     AND target_entity_id = '00000000-0000-0000-0000-000000000083'
     AND relationship_type = 'related_to'),
  1::bigint,
  'Reviewed apply creates one pending relationship'
);
SELECT is(
  (SELECT count(*) FROM public.content_entities
   WHERE content_entity_id = '00000000-0000-0000-0000-000000000084'
     AND subject_entity_id = '00000000-0000-0000-0000-000000000082'
     AND role = 'discusses'),
  1::bigint,
  'Reviewed apply creates one pending content mapping'
);
SELECT is(
  (SELECT count(*) FROM public.graph_sync_outbox
   WHERE payload->>'migration_run_id' = (
     SELECT id::text FROM public.graph_migration_runs
     WHERE migration_version = 'stage-7-content-mapping-apply-v2'
       AND report->>'manifest_checksum' = repeat('b', 64)
   )),
  2::bigint,
  'Every applied graph row has an outbox event from the same run'
);
SELECT is(
  (SELECT status FROM public.graph_migration_runs
   WHERE migration_version = 'stage-7-content-mapping-apply-v2'
     AND report->>'manifest_checksum' = repeat('b', 64)),
  'completed',
  'Transactional apply records a completed migration run'
);
SELECT is(
  (SELECT count(*) FROM public.audit_log
   WHERE action = 'content_mapping_apply'
     AND entity_id = (
       SELECT id::text FROM public.graph_migration_runs
       WHERE migration_version = 'stage-7-content-mapping-apply-v2'
         AND report->>'manifest_checksum' = repeat('b', 64)
     )),
  1::bigint,
  'Transactional apply writes one summary audit record'
);

TRUNCATE content_mapping_apply_result;
INSERT INTO content_mapping_apply_result(payload)
SELECT public.apply_content_mapping_candidates(
  '00000000-0000-0000-0000-000000000081', repeat('a', 64), repeat('b', 64),
  jsonb_build_array(jsonb_build_object(
    'candidate_key', 'relationship:fixture:a:b',
    'source_entity_id', '00000000-0000-0000-0000-000000000082',
    'target_entity_id', '00000000-0000-0000-0000-000000000083',
    'provenance', 'material_links'
  )),
  jsonb_build_array(jsonb_build_object(
    'candidate_key', 'content:article:fixture:a',
    'content_entity_id', '00000000-0000-0000-0000-000000000084',
    'subject_entity_id', '00000000-0000-0000-0000-000000000082',
    'provenance', 'articles.legacy_material_kv_id'
  ))
);
SELECT is(
  (SELECT payload->>'already_applied' FROM content_mapping_apply_result),
  'true',
  'An exact manifest rerun returns the completed run'
);
SELECT results_eq(
  $$ SELECT
       (SELECT count(*) FROM public.entity_relationships
        WHERE source_entity_id = '00000000-0000-0000-0000-000000000082'),
       (SELECT count(*) FROM public.content_entities
        WHERE content_entity_id = '00000000-0000-0000-0000-000000000084'),
       (SELECT count(*) FROM public.graph_migration_runs
        WHERE migration_version = 'stage-7-content-mapping-apply-v2') $$,
  $$ VALUES (1::bigint, 1::bigint, 1::bigint) $$,
  'An exact rerun creates no duplicate graph rows or migration run'
);

SELECT throws_ok(
  $$ SELECT public.apply_content_mapping_candidates(
       '00000000-0000-0000-0000-000000000081',
       repeat('c', 64), repeat('d', 64),
       jsonb_build_array(jsonb_build_object(
         'candidate_key', 'relationship:self',
         'source_entity_id', '00000000-0000-0000-0000-000000000082',
         'target_entity_id', '00000000-0000-0000-0000-000000000082',
         'provenance', 'material_links'
       )),
       '[]'::jsonb
     ) $$,
  'P0001',
  'Self relationships cannot be applied',
  'Invalid manifests fail before leaving partial graph state'
);
SELECT is(
  (SELECT count(*) FROM public.graph_migration_runs
   WHERE migration_version = 'stage-7-content-mapping-apply-v2'),
  1::bigint,
  'A failed apply rolls its migration run back'
);

CREATE TEMP TABLE content_mapping_quarantine_result(payload JSONB);
GRANT SELECT, INSERT, DELETE, TRUNCATE ON content_mapping_quarantine_result
  TO service_role;
INSERT INTO content_mapping_quarantine_result(payload)
SELECT public.quarantine_content_mapping_candidates(
  '00000000-0000-0000-0000-000000000081',
  repeat('e', 64),
  jsonb_build_array(jsonb_build_object(
    'candidate_key', 'relationship:missing:a:z',
    'source_table', 'material_links',
    'source_identifier', 'a→z',
    'issue_category', 'awaiting_review',
    'reason', 'Target material is missing',
    'original_payload', jsonb_build_object('source', 'a', 'target', 'z'),
    'candidate_matches', '[]'::jsonb,
    'diagnostic_metadata', jsonb_build_object('provenance', 'material_links')
  ))
);
SELECT results_eq(
  $$ SELECT
       (payload->>'total_issues_written')::INTEGER,
       payload->>'already_quarantined'
     FROM content_mapping_quarantine_result $$,
  $$ VALUES (1, 'false'::text) $$,
  'Quarantine persists the complete reviewed issue manifest atomically'
);
SELECT is(
  (SELECT count(*) FROM public.graph_migration_issues i
   JOIN public.graph_migration_runs r ON r.id = i.run_id
   WHERE r.migration_version = 'stage-7-content-mapping-quarantine-v2'
     AND r.report->>'analysis_checksum' = repeat('e', 64)),
  1::bigint,
  'Quarantine creates one immutable issue record'
);
SELECT is(
  (SELECT count(*) FROM public.audit_log
   WHERE action = 'content_mapping_quarantine'),
  1::bigint,
  'Quarantine writes a summary audit record'
);

TRUNCATE content_mapping_quarantine_result;
INSERT INTO content_mapping_quarantine_result(payload)
SELECT public.quarantine_content_mapping_candidates(
  '00000000-0000-0000-0000-000000000081', repeat('e', 64),
  jsonb_build_array(jsonb_build_object(
    'candidate_key', 'relationship:missing:a:z',
    'source_table', 'material_links',
    'source_identifier', 'a→z',
    'issue_category', 'awaiting_review',
    'reason', 'Target material is missing',
    'original_payload', jsonb_build_object('source', 'a', 'target', 'z'),
    'candidate_matches', '[]'::jsonb,
    'diagnostic_metadata', jsonb_build_object('provenance', 'material_links')
  ))
);
SELECT is(
  (SELECT payload->>'already_quarantined'
   FROM content_mapping_quarantine_result),
  'true',
  'An exact quarantine rerun returns its completed run'
);
SELECT is(
  (SELECT count(*) FROM public.graph_migration_runs
   WHERE migration_version = 'stage-7-content-mapping-quarantine-v2'),
  1::bigint,
  'An exact quarantine rerun creates no duplicate run or issues'
);

SELECT * FROM finish();
ROLLBACK;
