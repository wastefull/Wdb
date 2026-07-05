BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL ROLE postgres;
SET LOCAL search_path = public, extensions;

SELECT plan(14);

SELECT has_function('public'::name, 'publish_applied_reviewed_videos'::name, ARRAY[]::name[]);
SELECT ok(
  has_function_privilege('service_role', 'public.publish_applied_reviewed_videos()', 'EXECUTE'),
  'Service role can publish applied reviewed videos'
);
SELECT ok(
  NOT has_function_privilege('authenticated', 'public.publish_applied_reviewed_videos()', 'EXECUTE'),
  'Authenticated clients cannot invoke bulk publication directly'
);

INSERT INTO auth.users (id, email) VALUES
  ('30000000-0000-0000-0000-000000000001', 'video-publish-admin@example.test')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.user_profiles (id, email, name, role) VALUES
  ('30000000-0000-0000-0000-000000000001', 'video-publish-admin@example.test', 'Video Publish Admin', 'admin')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
INSERT INTO public.videos (id, title, youtube_url, youtube_id, status) VALUES
  ('30000000-0000-0000-0000-000000000002', 'Eligible reviewed video', 'https://youtube.test/eligible', 'publishEligible', 'draft'),
  ('30000000-0000-0000-0000-000000000003', 'Ignored reviewed video', 'https://youtube.test/ignored', 'publishIgnored', 'draft');
INSERT INTO public.entities (id, entity_type, name, status, created_by) VALUES
  ('30000000-0000-0000-0000-000000000004', 'video', 'Eligible reviewed video', 'draft', '30000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000005', 'video', 'Ignored reviewed video', 'draft', '30000000-0000-0000-0000-000000000001');
INSERT INTO public.entity_canonical_bindings (entity_id, video_id) VALUES
  ('30000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000002'),
  ('30000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000003');
INSERT INTO public.video_import_batches (
  id, source_playlist_id, preview_contract_version, source_preview_checksum,
  worksheet_checksum, row_count, status, created_by, reviewed_by, reviewed_at
) VALUES (
  '30000000-0000-0000-0000-000000000006', 'PL-publication-test',
  'stage-7-youtube-playlist-preview-v1', repeat('5', 64), repeat('4', 64),
  2, 'completed', '30000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001', now()
);
INSERT INTO public.video_import_items (
  id, batch_id, source_row_number, candidate_key, provider_video_id,
  provider_url, playlist_positions, title, provider_classification,
  disposition, review_status, original_payload, created_by, reviewed_by,
  reviewed_at, video_id, applied_at
) VALUES
  (
    '30000000-0000-0000-0000-000000000007',
    '30000000-0000-0000-0000-000000000006', 1, 'publication-eligible',
    'publishEligible', 'https://youtube.test/eligible', ARRAY[1],
    'Eligible reviewed video', 'new', 'material_video', 'reviewed', '{}'::JSONB,
    '30000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001', now(),
    '30000000-0000-0000-0000-000000000002', now()
  ),
  (
    '30000000-0000-0000-0000-000000000008',
    '30000000-0000-0000-0000-000000000006', 2, 'publication-ignored',
    'publishIgnored', 'https://youtube.test/ignored', ARRAY[2],
    'Ignored reviewed video', 'new', 'ignore', 'reviewed', '{}'::JSONB,
    '30000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001', now(),
    '30000000-0000-0000-0000-000000000003', now()
  );

SET LOCAL ROLE service_role;
CREATE TEMP TABLE publication_result(payload JSONB);
GRANT SELECT, INSERT, DELETE, TRUNCATE ON publication_result TO service_role;
INSERT INTO publication_result(payload)
SELECT public.publish_applied_reviewed_videos();

SELECT is((SELECT payload->>'published_count' FROM publication_result), '1', 'Only eligible reviewed videos are published');
SELECT is((SELECT status FROM public.videos WHERE id = '30000000-0000-0000-0000-000000000002'), 'published', 'Eligible video becomes published');
SELECT is((SELECT status FROM public.entities WHERE id = '30000000-0000-0000-0000-000000000004'), 'active', 'Eligible canonical entity becomes active');
SELECT is((SELECT reviewed_by FROM public.videos WHERE id = '30000000-0000-0000-0000-000000000002'), '30000000-0000-0000-0000-000000000001'::UUID, 'Publication preserves the triage reviewer');
SELECT is((SELECT status FROM public.videos WHERE id = '30000000-0000-0000-0000-000000000003'), 'draft', 'Ignored videos remain drafts');
SELECT is((SELECT status FROM public.entities WHERE id = '30000000-0000-0000-0000-000000000005'), 'draft', 'Ignored video entities remain drafts');
SELECT is((SELECT count(*) FROM public.graph_sync_outbox WHERE payload->>'provenance' = 'reviewed_video_triage_publication'), 2::BIGINT, 'Publication writes video and entity outbox events');
SELECT is((SELECT count(*) FROM public.audit_log WHERE action = 'video_publish' AND entity_id = '30000000-0000-0000-0000-000000000002'), 1::BIGINT, 'Publication writes one video audit record');

TRUNCATE publication_result;
INSERT INTO publication_result(payload)
SELECT public.publish_applied_reviewed_videos();
SELECT is((SELECT payload->>'published_count' FROM publication_result), '0', 'Exact publication reruns are idempotent');
SELECT is((SELECT count(*) FROM public.graph_sync_outbox WHERE payload->>'provenance' = 'reviewed_video_triage_publication'), 2::BIGINT, 'Publication reruns create no duplicate outbox events');
SELECT is((SELECT count(*) FROM public.audit_log WHERE action = 'video_publish' AND entity_id = '30000000-0000-0000-0000-000000000002'), 1::BIGINT, 'Publication reruns create no duplicate audit record');

SELECT * FROM finish();
ROLLBACK;
