BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL ROLE postgres;
SET LOCAL search_path = public, extensions;

SELECT plan(16);

SELECT has_function(
  'public'::name,
  'process_reviewed_video_topic_tags'::name,
  ARRAY['uuid', 'boolean']::name[]
);
SELECT ok(
  has_function_privilege(
    'service_role',
    'public.process_reviewed_video_topic_tags(uuid,boolean)',
    'EXECUTE'
  ),
  'Service role can process reviewed video topics'
);
SELECT ok(
  NOT has_function_privilege(
    'authenticated',
    'public.process_reviewed_video_topic_tags(uuid,boolean)',
    'EXECUTE'
  ),
  'Authenticated clients cannot bypass the admin Edge route'
);
SELECT results_eq(
  $$ SELECT slug, label, tag_type, active FROM public.tags WHERE slug = '3d_printing' $$,
  $$ VALUES ('3d_printing'::TEXT, '3D printing'::TEXT, 'topic'::TEXT, TRUE) $$,
  'The initial governed video topic exists and is active'
);

INSERT INTO auth.users (id, email) VALUES
  ('20000000-0000-0000-0000-000000000001', 'video-topic-admin@example.test')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.user_profiles (id, email, name, role) VALUES
  ('20000000-0000-0000-0000-000000000001', 'video-topic-admin@example.test', 'Video Topic Admin', 'admin')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
INSERT INTO public.videos (id, title, youtube_url, youtube_id, status) VALUES (
  '20000000-0000-0000-0000-000000000002',
  'Reviewed topic video',
  'https://www.youtube.com/watch?v=topicApply1',
  'topicApply1',
  'draft'
);
INSERT INTO public.entities (id, entity_type, name, status, created_by) VALUES (
  '20000000-0000-0000-0000-000000000003',
  'video', 'Reviewed topic video', 'draft',
  '20000000-0000-0000-0000-000000000001'
);
INSERT INTO public.entity_canonical_bindings (entity_id, video_id) VALUES (
  '20000000-0000-0000-0000-000000000003',
  '20000000-0000-0000-0000-000000000002'
);
INSERT INTO public.video_import_batches (
  id, source_playlist_id, preview_contract_version, source_preview_checksum,
  worksheet_checksum, row_count, status, created_by, reviewed_by, reviewed_at
) VALUES (
  '20000000-0000-0000-0000-000000000004', 'PL-topic-apply',
  'stage-7-youtube-playlist-preview-v1', repeat('7', 64), repeat('6', 64),
  1, 'completed', '20000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001', now()
);
INSERT INTO public.video_import_items (
  id, batch_id, source_row_number, candidate_key, provider_video_id,
  provider_url, playlist_positions, title, provider_classification,
  disposition, reviewed_topic_tags, review_status, original_payload,
  created_by, reviewed_by, reviewed_at, video_id, applied_at
) VALUES (
  '20000000-0000-0000-0000-000000000005',
  '20000000-0000-0000-0000-000000000004', 1, 'reviewed-topic-video',
  'topicApply1', 'https://www.youtube.com/watch?v=topicApply1', ARRAY[1],
  'Reviewed topic video', 'new', 'material_video',
  ARRAY['3d_printing', 'unknown topic, repair'], 'reviewed', '{}'::JSONB,
  '20000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001', now(),
  '20000000-0000-0000-0000-000000000002', now()
);

SET LOCAL ROLE service_role;
CREATE TEMP TABLE video_topic_result(payload JSONB);
GRANT SELECT, INSERT, DELETE, TRUNCATE ON video_topic_result TO service_role;

INSERT INTO video_topic_result(payload)
SELECT public.process_reviewed_video_topic_tags(
  '20000000-0000-0000-0000-000000000001', FALSE
);
SELECT results_eq(
  $$ SELECT (payload->>'candidate_count')::INTEGER,
            (payload->>'governed_topic_count')::INTEGER,
            (payload->>'new_topic_count')::INTEGER,
            (payload->>'creatable_count')::INTEGER
     FROM video_topic_result $$,
  $$ VALUES (3, 3, 2, 3) $$,
  'Preview promotes all explicitly reviewed topic values'
);
SELECT is(
  (SELECT count(*) FROM public.entity_tags
   WHERE entity_id = '20000000-0000-0000-0000-000000000003'),
  0::BIGINT,
  'Preview creates no entity tags'
);
SELECT is(
  (SELECT payload->>'existing_vocabulary_count' FROM video_topic_result),
  '1',
  'Preview distinguishes existing vocabulary from reviewed additions'
);

TRUNCATE video_topic_result;
INSERT INTO video_topic_result(payload)
SELECT public.process_reviewed_video_topic_tags(
  '20000000-0000-0000-0000-000000000001', TRUE
);
SELECT is((SELECT payload->>'created_count' FROM video_topic_result), '3', 'Apply creates every reviewed topic assignment');
SELECT results_eq(
  $$ SELECT tag.slug, entity_tag.status
     FROM public.entity_tags entity_tag
     JOIN public.tags tag ON tag.id = entity_tag.tag_id
     WHERE entity_tag.entity_id = '20000000-0000-0000-0000-000000000003'
     ORDER BY tag.slug $$,
  $$ VALUES ('3d_printing'::TEXT, 'active'::TEXT),
            ('repair'::TEXT, 'active'::TEXT),
            ('unknown_topic'::TEXT, 'active'::TEXT) $$,
  'Reviewed topics become active entity tags'
);
SELECT is(
  (SELECT count(*) FROM public.entity_tags
   WHERE entity_id = '20000000-0000-0000-0000-000000000003'
     AND reviewed_by = '20000000-0000-0000-0000-000000000001'),
  3::BIGINT,
  'Apply records the reviewing admin'
);
SELECT is(
  (SELECT count(*) FROM public.graph_sync_outbox
   WHERE payload->>'provenance' = 'reviewed_video_triage'
     AND payload->>'tag_slug' = '3d_printing'),
  1::BIGINT,
  'Apply writes one topic outbox event'
);
SELECT is(
  (SELECT count(*) FROM public.audit_log
   WHERE action = 'reviewed_video_topic_apply'),
  1::BIGINT,
  'Apply writes one summary audit record'
);

TRUNCATE video_topic_result;
INSERT INTO video_topic_result(payload)
SELECT public.process_reviewed_video_topic_tags(
  '20000000-0000-0000-0000-000000000001', TRUE
);
SELECT results_eq(
  $$ SELECT (payload->>'created_count')::INTEGER,
            (payload->>'existing_count')::INTEGER,
            (payload->>'outbox_count')::INTEGER
     FROM video_topic_result $$,
  $$ VALUES (0, 3, 0) $$,
  'Exact apply reruns skip the existing assignment and outbox event'
);
SELECT is(
  (SELECT count(*) FROM public.audit_log
   WHERE action = 'reviewed_video_topic_apply'),
  1::BIGINT,
  'An idempotent rerun creates no second audit record'
);
SELECT is(
  (SELECT count(*) FROM public.entity_tags
   WHERE entity_id = '20000000-0000-0000-0000-000000000003'),
  3::BIGINT,
  'An idempotent rerun creates no duplicate entity tag'
);
SELECT throws_ok(
  $$ SELECT public.process_reviewed_video_topic_tags(NULL, TRUE) $$,
  'P0001',
  'A current WasteDB admin profile is required',
  'Apply requires a current admin profile'
);

SELECT * FROM finish();
ROLLBACK;
