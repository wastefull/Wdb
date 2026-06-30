BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL ROLE postgres;
SET LOCAL search_path = public, extensions;

SELECT plan(40);

SELECT has_table('public'::name, 'video_import_batches'::name);
SELECT has_table('public'::name, 'video_import_items'::name);
SELECT has_table('public'::name, 'editorial_leads'::name);

SELECT policies_are(
  'public',
  'video_import_batches',
  ARRAY[
    'video_curation_service_role_all',
    'video_curation_staff_insert',
    'video_curation_staff_read',
    'video_curation_staff_update'
  ]
);
SELECT policies_are(
  'public',
  'video_import_items',
  ARRAY[
    'video_curation_service_role_all',
    'video_curation_staff_insert',
    'video_curation_staff_read',
    'video_curation_staff_update'
  ]
);
SELECT policies_are(
  'public',
  'editorial_leads',
  ARRAY[
    'video_curation_service_role_all',
    'video_curation_staff_insert',
    'video_curation_staff_read',
    'video_curation_staff_update'
  ]
);

SELECT has_column(
  'public'::name,
  'video_import_items'::name,
  'external_playback_only'::name,
  'video_import_items.external_playback_only should exist'
);
SELECT has_function(
  'private'::name,
  'preserve_video_import_batch_source'::name
);
SELECT has_function(
  'private'::name,
  'preserve_video_import_item_source'::name
);
SELECT has_function('private'::name, 'preserve_editorial_lead_source'::name);

INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-000000000071', 'stage7-contributor@example.test'),
  ('00000000-0000-0000-0000-000000000072', 'stage7-staff@example.test'),
  ('00000000-0000-0000-0000-000000000073', 'stage7-admin@example.test')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_profiles (id, email, name, role) VALUES
  (
    '00000000-0000-0000-0000-000000000071',
    'stage7-contributor@example.test',
    'Stage 7 Contributor',
    'user'
  ),
  (
    '00000000-0000-0000-0000-000000000072',
    'stage7-staff@example.test',
    'Stage 7 Curator',
    'staff'
  ),
  (
    '00000000-0000-0000-0000-000000000073',
    'stage7-admin@example.test',
    'Stage 7 Admin',
    'admin'
  )
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

SET LOCAL ROLE anon;
SELECT is(
  (SELECT count(*) FROM public.video_import_batches),
  0::bigint,
  'Anonymous users cannot read video import batches'
);
SELECT is(
  (SELECT count(*) FROM public.video_import_items),
  0::bigint,
  'Anonymous users cannot read video import items'
);
SELECT is(
  (SELECT count(*) FROM public.editorial_leads),
  0::bigint,
  'Anonymous users cannot read editorial leads'
);
SELECT throws_ok(
  $$ INSERT INTO public.video_import_batches (
       provider,
       source_playlist_id,
       preview_contract_version,
       source_preview_checksum,
       worksheet_checksum,
       row_count,
       created_by
     ) VALUES (
       'youtube',
       'anonymous-probe',
       'stage-7-youtube-playlist-preview-v1',
       repeat('a', 64),
       repeat('b', 64),
       0,
       '00000000-0000-0000-0000-000000000071'
     ) $$,
  42501,
  NULL,
  'Anonymous users cannot create video import batches'
);
RESET ROLE;

SELECT set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000071',
  true
);
SET LOCAL ROLE authenticated;
SELECT is(
  (SELECT count(*) FROM public.video_import_batches),
  0::bigint,
  'Contributors cannot read private video curation records'
);
SELECT throws_ok(
  $$ INSERT INTO public.video_import_batches (
       provider,
       source_playlist_id,
       preview_contract_version,
       source_preview_checksum,
       worksheet_checksum,
       row_count,
       created_by
     ) VALUES (
       'youtube',
       'contributor-probe',
       'stage-7-youtube-playlist-preview-v1',
       repeat('a', 64),
       repeat('b', 64),
       0,
       '00000000-0000-0000-0000-000000000071'
     ) $$,
  42501,
  NULL,
  'Contributors cannot create video import batches'
);
RESET ROLE;

SELECT set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000072',
  true
);
SET LOCAL ROLE authenticated;
SELECT lives_ok(
  $$ INSERT INTO public.video_import_batches (
       id,
       provider,
       source_playlist_id,
       source_playlist_title,
       preview_contract_version,
       source_preview_checksum,
       worksheet_checksum,
       source_filename,
       row_count,
       created_by
     ) VALUES (
       '00000000-0000-0000-0000-000000000701',
       'youtube',
       'stage7-playlist',
       'Stage 7 playlist',
       'stage-7-youtube-playlist-preview-v1',
       repeat('a', 64),
       repeat('b', 64),
       'stage7.csv',
       2,
       '00000000-0000-0000-0000-000000000072'
     ) $$,
  'Staff can create a private video import batch'
);
SELECT is(
  (SELECT count(*) FROM public.video_import_batches),
  1::bigint,
  'Staff can read the private batch'
);
SELECT throws_ok(
  $$ INSERT INTO public.video_import_batches (
       provider,
       source_playlist_id,
       preview_contract_version,
       source_preview_checksum,
       worksheet_checksum,
       row_count,
       created_by
     ) VALUES (
       'youtube',
       'stage7-playlist',
       'stage-7-youtube-playlist-preview-v1',
       repeat('a', 64),
       repeat('b', 64),
       2,
       '00000000-0000-0000-0000-000000000072'
     ) $$,
  23505,
  NULL,
  'The same reviewed worksheet cannot create a duplicate batch'
);

SELECT lives_ok(
  $$ INSERT INTO public.video_import_items (
       id,
       batch_id,
       source_row_number,
       candidate_key,
       provider_video_id,
       provider_url,
       playlist_positions,
       title,
       provider_classification,
       privacy_status,
       embeddable,
       provider_issues,
       suggested_topic_tags,
       original_payload,
       created_by
     ) VALUES (
       '00000000-0000-0000-0000-000000000702',
       '00000000-0000-0000-0000-000000000701',
       2,
       'stage7-video-one',
       'abc123DEF_0',
       'https://www.youtube.com/watch?v=abc123DEF_0',
       ARRAY[1],
       'General education video',
       'new',
       'public',
       false,
       ARRAY['embedding_disabled'],
       ARRAY['3d_printing'],
       '{"suggested_topic_tags":["3d_printing"]}'::jsonb,
       '00000000-0000-0000-0000-000000000072'
     ) $$,
  'Staff can preserve a provider candidate and suggestion'
);
SELECT is(
  (
    SELECT external_playback_only
    FROM public.video_import_items
    WHERE id = '00000000-0000-0000-0000-000000000702'
  ),
  true,
  'Embedding-disabled candidates are marked for external playback'
);
SELECT lives_ok(
  $$ UPDATE public.video_import_items
     SET disposition = 'editorial_lead',
         editorial_targets = ARRAY['article'],
         reviewed_topic_tags = '{}'::text[],
         review_status = 'reviewed',
         reviewed_by = '00000000-0000-0000-0000-000000000072',
         reviewed_at = now(),
         review_notes = '3D-printing suggestion rejected during review.'
     WHERE id = '00000000-0000-0000-0000-000000000702' $$,
  'Staff can reject a suggestion while reviewing the candidate'
);
SELECT results_eq(
  $$ SELECT suggested_topic_tags, reviewed_topic_tags
     FROM public.video_import_items
     WHERE id = '00000000-0000-0000-0000-000000000702' $$,
  $$ VALUES (ARRAY['3d_printing']::text[], '{}'::text[]) $$,
  'Suggested and reviewed topics remain distinct'
);
SELECT throws_ok(
  $$ UPDATE public.video_import_items
     SET title = 'Rewritten provider title'
     WHERE id = '00000000-0000-0000-0000-000000000702' $$,
  'P0001',
  'video_import_items source provenance is immutable',
  'Review cannot overwrite provider facts'
);
SELECT lives_ok(
  $$ UPDATE public.video_import_items
     SET review_notes = 'Updated human review note.'
     WHERE id = '00000000-0000-0000-0000-000000000702' $$,
  'Human review fields remain editable'
);
SELECT throws_ok(
  $$ INSERT INTO public.video_import_items (
       batch_id,
       source_row_number,
       candidate_key,
       provider_video_id,
       playlist_positions,
       provider_classification,
       disposition,
       review_status,
       original_payload,
       created_by
     ) VALUES (
       '00000000-0000-0000-0000-000000000701',
       3,
       'missing-review-metadata',
       'reviewMeta01',
       ARRAY[2],
       'new',
       'material_video',
       'reviewed',
       '{}'::jsonb,
       '00000000-0000-0000-0000-000000000072'
     ) $$,
  23514,
  NULL,
  'Reviewed items require reviewer metadata'
);
SELECT lives_ok(
  $$ INSERT INTO public.video_import_items (
       id,
       batch_id,
       source_row_number,
       candidate_key,
       provider_video_id,
       playlist_positions,
       title,
       provider_classification,
       privacy_status,
       embeddable,
       original_payload,
       created_by
     ) VALUES (
       '00000000-0000-0000-0000-000000000703',
       '00000000-0000-0000-0000-000000000701',
       3,
       'private-video',
       'private0001',
       ARRAY[2],
       'Private video',
       'private',
       'private',
       NULL,
       '{"classification":"private"}'::jsonb,
       '00000000-0000-0000-0000-000000000072'
     ) $$,
  'Private candidates can be preserved without a disposition'
);
SELECT throws_ok(
  $$ UPDATE public.video_import_items
     SET disposition = 'material_video'
     WHERE id = '00000000-0000-0000-0000-000000000703' $$,
  23514,
  NULL,
  'Private candidates cannot become material videos'
);
SELECT throws_ok(
  $$ INSERT INTO public.video_import_items (
       batch_id,
       source_row_number,
       candidate_key,
       provider_video_id,
       playlist_positions,
       provider_classification,
       original_payload,
       created_by
     ) VALUES (
       '00000000-0000-0000-0000-000000000701',
       4,
       'duplicate-provider-video',
       'abc123DEF_0',
       ARRAY[3],
       'new',
       '{}'::jsonb,
       '00000000-0000-0000-0000-000000000072'
     ) $$,
  23505,
  NULL,
  'A provider video appears only once per batch'
);

SELECT lives_ok(
  $$ INSERT INTO public.editorial_leads (
       id,
       source_import_item_id,
       source_url,
       provider_video_id,
       title,
       target_types,
       suggested_topic_tags,
       created_by,
       original_payload
     ) VALUES (
       '00000000-0000-0000-0000-000000000704',
       '00000000-0000-0000-0000-000000000702',
       'https://www.youtube.com/watch?v=abc123DEF_0',
       'abc123DEF_0',
       'General education video',
       ARRAY['article'],
       ARRAY['3d_printing'],
       '00000000-0000-0000-0000-000000000072',
       '{"source":"video_import_item"}'::jsonb
     ) $$,
  'Staff can create a private editorial lead from reviewed triage'
);
SELECT is(
  (SELECT count(*) FROM public.editorial_leads),
  1::bigint,
  'Staff can read private editorial leads'
);
SELECT throws_ok(
  $$ INSERT INTO public.editorial_leads (
       source_import_item_id,
       title,
       target_types,
       created_by,
       original_payload
     ) VALUES (
       '00000000-0000-0000-0000-000000000703',
       'Invalid editorial target',
       ARRAY['video'],
       '00000000-0000-0000-0000-000000000072',
       '{}'::jsonb
     ) $$,
  23514,
  NULL,
  'Editorial leads only target articles, blog posts, or guides'
);
SELECT throws_ok(
  $$ UPDATE public.editorial_leads
     SET title = 'Rewritten source title'
     WHERE id = '00000000-0000-0000-0000-000000000704' $$,
  'P0001',
  'editorial_leads source provenance is immutable',
  'Editorial review cannot overwrite source facts'
);
SELECT lives_ok(
  $$ UPDATE public.editorial_leads
     SET rationale = 'Potential mission education article.'
     WHERE id = '00000000-0000-0000-0000-000000000704' $$,
  'Editorial rationale remains editable'
);
SELECT throws_ok(
  $$ UPDATE public.editorial_leads
     SET status = 'converted'
     WHERE id = '00000000-0000-0000-0000-000000000704' $$,
  23514,
  NULL,
  'A lead cannot be converted without a resulting content entity'
);
SELECT results_eq(
  $$ WITH deleted AS (
       DELETE FROM public.video_import_items
       WHERE id = '00000000-0000-0000-0000-000000000703'
       RETURNING id
     )
     SELECT count(*)::bigint FROM deleted $$,
  $$ VALUES (0::bigint) $$,
  'Staff deletes affect no preserved import records'
);
RESET ROLE;

SELECT set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000073',
  true
);
SET LOCAL ROLE authenticated;
SELECT lives_ok(
  $$ UPDATE public.video_import_batches
     SET status = 'needs_review',
         reviewed_by = '00000000-0000-0000-0000-000000000073',
         reviewed_at = now()
     WHERE id = '00000000-0000-0000-0000-000000000701' $$,
  'Admins can advance a reviewed import batch'
);
SELECT throws_ok(
  $$ UPDATE public.video_import_batches
     SET worksheet_checksum = repeat('c', 64)
     WHERE id = '00000000-0000-0000-0000-000000000701' $$,
  'P0001',
  'video_import_batches source provenance is immutable',
  'Admins cannot replace a batch source worksheet'
);
RESET ROLE;

SET LOCAL ROLE service_role;
SELECT is(
  (SELECT count(*) FROM public.video_import_items),
  2::bigint,
  'Service-role workers can read preserved import items'
);
SELECT lives_ok(
  $$ UPDATE public.video_import_batches
     SET validation_summary = '{"valid":true}'::jsonb
     WHERE id = '00000000-0000-0000-0000-000000000701' $$,
  'Service-role workers can update validation results'
);
RESET ROLE;

SET LOCAL ROLE postgres;
SELECT * FROM finish();

ROLLBACK;
