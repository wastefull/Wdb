BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL ROLE postgres;
SET LOCAL search_path = public, extensions;

SELECT plan(31);

SELECT has_function(
  'public'::name,
  'create_manual_content_mapping'::name,
  ARRAY['uuid', 'uuid', 'uuid', 'text', 'text', 'text', 'boolean']::name[]
);
SELECT ok(
  has_function_privilege(
    'service_role',
    'public.create_manual_content_mapping(uuid,uuid,uuid,text,text,text,boolean)',
    'EXECUTE'
  ),
  'Service role can create a manual content mapping'
);
SELECT ok(
  NOT has_function_privilege(
    'authenticated',
    'public.create_manual_content_mapping(uuid,uuid,uuid,text,text,text,boolean)',
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

TRUNCATE manual_mapping_result;
INSERT INTO manual_mapping_result(payload)
SELECT public.create_manual_content_mapping(
  '00000000-0000-0000-0000-000000000091',
  '00000000-0000-0000-0000-000000000093',
  '00000000-0000-0000-0000-000000000094',
  'primary_subject',
  'recycling',
  NULL,
  TRUE
);
SELECT is(
  (SELECT payload->>'status' FROM manual_mapping_result),
  'active',
  'Auto-published video links are created active'
);
SELECT is(
  (SELECT status FROM public.content_entities
   WHERE content_entity_id = '00000000-0000-0000-0000-000000000093'),
  'active',
  'Auto-published video links activate the mapping'
);
SELECT is(
  (SELECT status FROM public.videos
   WHERE id = '00000000-0000-0000-0000-000000000096'),
  'published',
  'Auto-published video links publish the video'
);
SELECT is(
  (SELECT count(*) FROM public.graph_sync_outbox
   WHERE payload->>'provenance' = 'manual_admin_curation_auto_publish'),
  3::bigint,
  'Auto-published video links write three outbox events'
);
SELECT is(
  (SELECT count(*) FROM public.audit_log
   WHERE action = 'video_publish'
     AND entity_id = '00000000-0000-0000-0000-000000000096'),
  1::bigint,
  'Auto-published video links write one video publish audit'
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
SET LOCAL ROLE postgres;

SELECT ok(
  has_function_privilege(
    'service_role',
    'public.process_reviewed_video_material_mappings(uuid,boolean)',
    'EXECUTE'
  ),
  'Service role can process reviewed video material mappings'
);

INSERT INTO public.materials (id, legacy_kv_id, name, slug, status) VALUES (
  '00000000-0000-0000-0000-000000000095',
  'manual-video-material',
  'Video mapping material',
  'video-mapping-material',
  'published'
);
SELECT is(
  (SELECT count(*) FROM public.entity_canonical_bindings
   WHERE material_id = '00000000-0000-0000-0000-000000000095'),
  1::BIGINT,
  'New materials receive a canonical binding automatically'
);
SELECT is(
  (SELECT e.status
   FROM public.entity_canonical_bindings binding
   JOIN public.entities e ON e.id = binding.entity_id
   WHERE binding.material_id = '00000000-0000-0000-0000-000000000095'),
  'active',
  'Published materials synchronize to an active canonical entity'
);
UPDATE public.materials
SET name = 'Updated video mapping material'
WHERE id = '00000000-0000-0000-0000-000000000095';
SELECT is(
  (SELECT e.name
   FROM public.entity_canonical_bindings binding
   JOIN public.entities e ON e.id = binding.entity_id
   WHERE binding.material_id = '00000000-0000-0000-0000-000000000095'),
  'Updated video mapping material',
  'Material edits synchronize canonical entity metadata'
);
INSERT INTO public.videos (id, title, youtube_url, youtube_id, status) VALUES (
  '00000000-0000-0000-0000-000000000096',
  'Reviewed mapping video',
  'https://www.youtube.com/watch?v=manualMap01',
  'manualMap01',
  'draft'
);
INSERT INTO public.entities (id, entity_type, name, status, created_by) VALUES
  ('00000000-0000-0000-0000-000000000098', 'video', 'Reviewed mapping video', 'draft', '00000000-0000-0000-0000-000000000091');
INSERT INTO public.entity_canonical_bindings (entity_id, video_id) VALUES (
  '00000000-0000-0000-0000-000000000098',
  '00000000-0000-0000-0000-000000000096'
);
INSERT INTO public.video_import_batches (
  id, source_playlist_id, preview_contract_version, source_preview_checksum,
  worksheet_checksum, row_count, status, created_by, reviewed_by, reviewed_at
) VALUES (
  '00000000-0000-0000-0000-000000000099', 'PL-manual-map',
  'stage-7-youtube-playlist-preview-v1', repeat('9', 64), repeat('8', 64),
  1, 'completed', '00000000-0000-0000-0000-000000000091',
  '00000000-0000-0000-0000-000000000091', now()
);
INSERT INTO public.video_import_items (
  id, batch_id, source_row_number, candidate_key, provider_video_id,
  provider_url, playlist_positions, title, provider_classification,
  disposition, material_identifiers, review_status, original_payload,
  created_by, reviewed_by, reviewed_at, video_id, applied_at
) VALUES (
  '00000000-0000-0000-0000-000000000100',
  '00000000-0000-0000-0000-000000000099', 1, 'manual-map-video',
  'manualMap01', 'https://www.youtube.com/watch?v=manualMap01', ARRAY[1],
  'Reviewed mapping video', 'new', 'material_video',
  ARRAY['updated_video-mapping material'], 'reviewed', '{}'::JSONB,
  '00000000-0000-0000-0000-000000000091',
  '00000000-0000-0000-0000-000000000091', now(),
  '00000000-0000-0000-0000-000000000096', now()
);

SET LOCAL ROLE service_role;
CREATE TEMP TABLE reviewed_video_mapping_result(payload JSONB);
GRANT SELECT, INSERT, DELETE, TRUNCATE ON reviewed_video_mapping_result TO service_role;
INSERT INTO reviewed_video_mapping_result(payload)
SELECT public.process_reviewed_video_material_mappings(
  '00000000-0000-0000-0000-000000000091', FALSE
);
SELECT results_eq(
  $$ SELECT (payload->>'resolved_count')::INTEGER,
            (payload->>'creatable_count')::INTEGER,
            (payload->>'created_count')::INTEGER
     FROM reviewed_video_mapping_result $$,
  $$ VALUES (1, 1, 0) $$,
  'Preview resolves reviewed material links without creating mappings'
);
SELECT is(
  (SELECT count(*) FROM public.content_entities
   WHERE content_entity_id = '00000000-0000-0000-0000-000000000098'),
  0::BIGINT,
  'Preview is non-mutating'
);

TRUNCATE reviewed_video_mapping_result;
INSERT INTO reviewed_video_mapping_result(payload)
SELECT public.process_reviewed_video_material_mappings(
  '00000000-0000-0000-0000-000000000091', TRUE
);
SELECT is(
  (SELECT payload->>'created_count' FROM reviewed_video_mapping_result),
  '1',
  'Apply creates the missing reviewed video mapping'
);
SELECT results_eq(
  $$ SELECT role, status FROM public.content_entities
     WHERE content_entity_id = '00000000-0000-0000-0000-000000000098' $$,
  $$ VALUES ('primary_subject'::TEXT, 'pending_review'::TEXT) $$,
  'Reviewed video links become pending primary-subject mappings'
);
SELECT is(
  (SELECT count(*) FROM public.graph_sync_outbox
   WHERE payload->>'provenance' = 'reviewed_video_triage'),
  1::BIGINT,
  'Apply writes the reviewed-video outbox event'
);
SELECT is(
  (SELECT count(*) FROM public.audit_log
   WHERE action = 'video_material_mapping_apply'),
  1::BIGINT,
  'Apply writes one summary audit record'
);

TRUNCATE reviewed_video_mapping_result;
INSERT INTO reviewed_video_mapping_result(payload)
SELECT public.process_reviewed_video_material_mappings(
  '00000000-0000-0000-0000-000000000091', TRUE
);
SELECT results_eq(
  $$ SELECT (payload->>'created_count')::INTEGER,
            (payload->>'existing_count')::INTEGER
     FROM reviewed_video_mapping_result $$,
  $$ VALUES (0, 1) $$,
  'Rerunning apply skips the existing mapping'
);

INSERT INTO public.materials (id, legacy_kv_id, name, slug, aliases, status) VALUES
  (
    '00000000-0000-0000-0000-000000000101',
    'concrete-material',
    'Concrete',
    'concrete',
    ARRAY['concrete rubble'],
    'published'
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    'concrete-rubble-material',
    'Concrete Rubble',
    '1766171968045azlfi8qem',
    ARRAY[]::TEXT[],
    'published'
  );

INSERT INTO public.videos (id, title, youtube_url, youtube_id, status) VALUES (
  '00000000-0000-0000-0000-000000000103',
  'Exact slug precedence video',
  'https://www.youtube.com/watch?v=manualMap02',
  'manualMap02',
  'draft'
);
INSERT INTO public.entities (id, entity_type, name, status, created_by) VALUES
  ('00000000-0000-0000-0000-000000000104', 'video', 'Exact slug precedence video', 'draft', '00000000-0000-0000-0000-000000000091');
INSERT INTO public.entity_canonical_bindings (entity_id, video_id) VALUES (
  '00000000-0000-0000-0000-000000000104',
  '00000000-0000-0000-0000-000000000103'
);
INSERT INTO public.video_import_items (
  id, batch_id, source_row_number, candidate_key, provider_video_id,
  provider_url, playlist_positions, title, provider_classification,
  disposition, material_identifiers, review_status, original_payload,
  created_by, reviewed_by, reviewed_at, video_id, applied_at
) VALUES (
  '00000000-0000-0000-0000-000000000105',
  '00000000-0000-0000-0000-000000000099', 2, 'manual-map-video-2',
  'manualMap02', 'https://www.youtube.com/watch?v=manualMap02', ARRAY[2],
  'Exact slug precedence video', 'new', 'material_video',
  ARRAY['concrete-rubble'], 'reviewed', '{}'::JSONB,
  '00000000-0000-0000-0000-000000000091',
  '00000000-0000-0000-0000-000000000091', now(),
  '00000000-0000-0000-0000-000000000103', now()
);

TRUNCATE reviewed_video_mapping_result;
INSERT INTO reviewed_video_mapping_result(payload)
SELECT public.process_reviewed_video_material_mappings(
  '00000000-0000-0000-0000-000000000091', FALSE
);
SELECT results_eq(
  $$ SELECT (payload->>'candidate_count')::INTEGER,
            (payload->>'resolved_count')::INTEGER,
            (payload->>'unresolved_count')::INTEGER,
            (payload->>'creatable_count')::INTEGER
     FROM reviewed_video_mapping_result $$,
  $$ VALUES (2, 2, 0, 1) $$,
  'Exact material slug matches are resolved before fuzzy alias matches'
);

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
