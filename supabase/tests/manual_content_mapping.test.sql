BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL ROLE postgres;
SET LOCAL search_path = public, extensions;

SELECT plan(14);

SELECT has_function(
  'public'::name,
  'create_manual_content_mapping'::name,
  ARRAY['uuid', 'uuid', 'uuid', 'text', 'text', 'text']::name[]
);
SELECT ok(
  has_function_privilege(
    'service_role',
    'public.create_manual_content_mapping(uuid,uuid,uuid,text,text,text)',
    'EXECUTE'
  ),
  'Service role can create a manual content mapping'
);
SELECT ok(
  NOT has_function_privilege(
    'authenticated',
    'public.create_manual_content_mapping(uuid,uuid,uuid,text,text,text)',
    'EXECUTE'
  ),
  'Authenticated clients cannot bypass the admin Edge route'
);

INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-000000000091', 'manual-map-admin@example.test'),
  ('00000000-0000-0000-0000-000000000092', 'manual-map-user@example.test')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.user_profiles (id, email, name, role) VALUES
  ('00000000-0000-0000-0000-000000000091', 'manual-map-admin@example.test', 'Manual Map Admin', 'admin'),
  ('00000000-0000-0000-0000-000000000092', 'manual-map-user@example.test', 'Manual Map User', 'user')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
INSERT INTO public.entities (id, entity_type, name, status, created_by) VALUES
  ('00000000-0000-0000-0000-000000000093', 'video', 'Manual video', 'draft', '00000000-0000-0000-0000-000000000091'),
  ('00000000-0000-0000-0000-000000000094', 'material', 'Manual material', 'active', '00000000-0000-0000-0000-000000000091')
ON CONFLICT (id) DO NOTHING;

SET LOCAL ROLE service_role;
CREATE TEMP TABLE manual_mapping_result(payload JSONB);
GRANT SELECT, INSERT, DELETE, TRUNCATE ON manual_mapping_result TO service_role;

INSERT INTO manual_mapping_result(payload)
SELECT public.create_manual_content_mapping(
  '00000000-0000-0000-0000-000000000091',
  '00000000-0000-0000-0000-000000000093',
  '00000000-0000-0000-0000-000000000094',
  'primary_subject',
  'recycling',
  NULL
);
SELECT is(
  (SELECT payload->>'created' FROM manual_mapping_result),
  'true',
  'Manual creation reports a newly created mapping'
);
SELECT is(
  (SELECT status FROM public.content_entities
   WHERE content_entity_id = '00000000-0000-0000-0000-000000000093'),
  'pending_review',
  'Manual mappings remain pending review'
);
SELECT is(
  (SELECT role FROM public.content_entities
   WHERE content_entity_id = '00000000-0000-0000-0000-000000000093'),
  'primary_subject',
  'The explicit governed role is preserved'
);
SELECT is(
  (SELECT count(*) FROM public.graph_sync_outbox
   WHERE payload->>'provenance' = 'manual_admin_curation'
     AND payload->>'content_entity_id' = '00000000-0000-0000-0000-000000000093'),
  1::bigint,
  'Manual creation writes one outbox event'
);
SELECT is(
  (SELECT count(*) FROM public.audit_log
   WHERE action = 'content_mapping_create'
     AND after->>'content_entity_id' = '00000000-0000-0000-0000-000000000093'),
  1::bigint,
  'Manual creation writes one audit record'
);

TRUNCATE manual_mapping_result;
INSERT INTO manual_mapping_result(payload)
SELECT public.create_manual_content_mapping(
  '00000000-0000-0000-0000-000000000091',
  '00000000-0000-0000-0000-000000000093',
  '00000000-0000-0000-0000-000000000094',
  'primary_subject',
  'recycling',
  NULL
);
SELECT is(
  (SELECT payload->>'already_exists' FROM manual_mapping_result),
  'true',
  'An exact duplicate returns the existing mapping'
);
SELECT is(
  (SELECT count(*) FROM public.content_entities
   WHERE content_entity_id = '00000000-0000-0000-0000-000000000093'),
  1::bigint,
  'An exact duplicate creates no second mapping'
);
SELECT is(
  (SELECT count(*) FROM public.audit_log
   WHERE action = 'content_mapping_create'
     AND after->>'content_entity_id' = '00000000-0000-0000-0000-000000000093'),
  1::bigint,
  'An exact duplicate creates no second audit record'
);

SELECT throws_ok(
  $$ SELECT public.create_manual_content_mapping(
       '00000000-0000-0000-0000-000000000092',
       '00000000-0000-0000-0000-000000000093',
       '00000000-0000-0000-0000-000000000094',
       'mentioned', NULL, NULL
     ) $$,
  'P0001',
  'A current WasteDB admin profile is required',
  'Non-admin profiles cannot create manual mappings'
);
SELECT throws_ok(
  $$ SELECT public.create_manual_content_mapping(
       '00000000-0000-0000-0000-000000000091',
       '00000000-0000-0000-0000-000000000093',
       '00000000-0000-0000-0000-000000000094',
       'evidence', NULL, NULL
     ) $$,
  'P0001',
  'Evidence mappings require an explicit evidence use',
  'Evidence mappings require explicit editorial scope'
);
SELECT is(
  (SELECT count(*) FROM public.content_entities
   WHERE content_entity_id = '00000000-0000-0000-0000-000000000093'),
  1::bigint,
  'Rejected mappings leave existing graph state unchanged'
);

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
