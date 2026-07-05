BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL ROLE postgres;
SET LOCAL search_path = public, extensions;

SELECT plan(16);

SELECT has_function(
  'public'::name,
  'review_content_mapping'::name,
  ARRAY['uuid', 'uuid', 'text']::name[]
);
SELECT ok(
  has_function_privilege(
    'service_role',
    'public.review_content_mapping(uuid,uuid,text)',
    'EXECUTE'
  ),
  'Service role can review content mappings'
);
SELECT ok(
  NOT has_function_privilege(
    'authenticated',
    'public.review_content_mapping(uuid,uuid,text)',
    'EXECUTE'
  ),
  'Authenticated clients cannot bypass the admin Edge route'
);

INSERT INTO auth.users (id, email) VALUES
  ('10000000-0000-0000-0000-000000000001', 'mapping-review-admin@example.test'),
  ('10000000-0000-0000-0000-000000000002', 'mapping-review-user@example.test')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.user_profiles (id, email, name, role) VALUES
  ('10000000-0000-0000-0000-000000000001', 'mapping-review-admin@example.test', 'Mapping Review Admin', 'admin'),
  ('10000000-0000-0000-0000-000000000002', 'mapping-review-user@example.test', 'Mapping Review User', 'user')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
INSERT INTO public.entities (id, entity_type, name, status, created_by) VALUES
  ('10000000-0000-0000-0000-000000000003', 'article', 'Review article', 'active', '10000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000004', 'material', 'Review material', 'active', '10000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.content_entities (
  id, content_entity_id, subject_entity_id, role, status, created_by
) VALUES
  ('10000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004', 'primary_subject', 'pending_review', '10000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004', 'mentioned', 'pending_review', '10000000-0000-0000-0000-000000000001');

SET LOCAL ROLE service_role;
CREATE TEMP TABLE mapping_review_result(payload JSONB);
GRANT SELECT, INSERT, DELETE, TRUNCATE ON mapping_review_result TO service_role;

SELECT throws_ok(
  $$ SELECT public.review_content_mapping(
       '10000000-0000-0000-0000-000000000005',
       '10000000-0000-0000-0000-000000000002', 'approve'
     ) $$,
  'P0001',
  'A current WasteDB admin profile is required',
  'Non-admin profiles cannot review mappings'
);
SELECT throws_ok(
  $$ SELECT public.review_content_mapping(
       '10000000-0000-0000-0000-000000000005',
       '10000000-0000-0000-0000-000000000001', 'publish'
     ) $$,
  'P0001',
  'Decision must be approve or reject',
  'Unknown review decisions are rejected'
);

INSERT INTO mapping_review_result(payload)
SELECT public.review_content_mapping(
  '10000000-0000-0000-0000-000000000005',
  '10000000-0000-0000-0000-000000000001', 'approve'
);
SELECT is((SELECT payload->>'status' FROM mapping_review_result), 'active', 'Approval reports active status');
SELECT is(
  (SELECT status FROM public.content_entities WHERE id = '10000000-0000-0000-0000-000000000005'),
  'active',
  'Approval activates the mapping'
);
SELECT is(
  (SELECT reviewed_by FROM public.content_entities WHERE id = '10000000-0000-0000-0000-000000000005'),
  '10000000-0000-0000-0000-000000000001'::UUID,
  'Approval records the reviewer'
);
SELECT ok(
  (SELECT reviewed_at IS NOT NULL FROM public.content_entities WHERE id = '10000000-0000-0000-0000-000000000005'),
  'Approval records the review timestamp'
);
SELECT is(
  (SELECT count(*) FROM public.graph_sync_outbox
   WHERE event_key = 'content_entities:review:active:10000000-0000-0000-0000-000000000005'),
  1::BIGINT,
  'Approval writes one status-change outbox event'
);
SELECT is(
  (SELECT count(*) FROM public.audit_log
   WHERE entity_id = '10000000-0000-0000-0000-000000000005'
     AND action = 'content_mapping_approve'),
  1::BIGINT,
  'Approval writes one audit record'
);

TRUNCATE mapping_review_result;
INSERT INTO mapping_review_result(payload)
SELECT public.review_content_mapping(
  '10000000-0000-0000-0000-000000000005',
  '10000000-0000-0000-0000-000000000001', 'approve'
);
SELECT is((SELECT payload->>'already_reviewed' FROM mapping_review_result), 'true', 'Exact approval reruns are idempotent');
SELECT is(
  (SELECT count(*) FROM public.graph_sync_outbox
   WHERE event_key = 'content_entities:review:active:10000000-0000-0000-0000-000000000005'),
  1::BIGINT,
  'Approval reruns do not duplicate outbox events'
);
SELECT throws_ok(
  $$ SELECT public.review_content_mapping(
       '10000000-0000-0000-0000-000000000005',
       '10000000-0000-0000-0000-000000000001', 'reject'
     ) $$,
  'P0001',
  'Only pending content mappings can be reviewed',
  'Reviewed mappings cannot be reversed through the initial review action'
);

TRUNCATE mapping_review_result;
INSERT INTO mapping_review_result(payload)
SELECT public.review_content_mapping(
  '10000000-0000-0000-0000-000000000006',
  '10000000-0000-0000-0000-000000000001', 'reject'
);
SELECT is((SELECT payload->>'status' FROM mapping_review_result), 'archived', 'Rejection reports archived status');
SELECT is(
  (SELECT count(*) FROM public.audit_log
   WHERE entity_id = '10000000-0000-0000-0000-000000000006'
     AND action = 'content_mapping_reject'),
  1::BIGINT,
  'Rejection writes one audit record'
);

SELECT * FROM finish();
ROLLBACK;
