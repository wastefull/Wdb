BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL ROLE postgres;
SET LOCAL search_path = public, extensions;

SELECT plan(17);

SELECT has_function(
  'public'::name,
  'stage_video_triage_worksheet'::name,
  ARRAY[
    'text', 'text', 'text', 'text', 'text', 'text', 'uuid', 'jsonb', 'jsonb'
  ]::name[]
);

SELECT ok(
  has_function_privilege(
    'service_role',
    'public.stage_video_triage_worksheet(text,text,text,text,text,text,uuid,jsonb,jsonb)',
    'EXECUTE'
  ),
  'Service role can execute worksheet staging'
);
SELECT ok(
  NOT has_function_privilege(
    'authenticated',
    'public.stage_video_triage_worksheet(text,text,text,text,text,text,uuid,jsonb,jsonb)',
    'EXECUTE'
  ),
  'Authenticated clients cannot call worksheet staging directly'
);
SELECT ok(
  NOT has_function_privilege(
    'anon',
    'public.stage_video_triage_worksheet(text,text,text,text,text,text,uuid,jsonb,jsonb)',
    'EXECUTE'
  ),
  'Anonymous clients cannot call worksheet staging'
);

INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-000000000074', 'stage7-staging-admin@example.test')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_profiles (id, email, name, role) VALUES (
  '00000000-0000-0000-0000-000000000074',
  'stage7-staging-admin@example.test',
  'Stage 7 Staging Admin',
  'admin'
)
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

CREATE TEMP TABLE video_triage_staging_snapshot AS
SELECT
  (SELECT count(*) FROM public.videos) AS videos,
  (SELECT count(*) FROM public.entities WHERE entity_type = 'video') AS entities,
  (SELECT count(*) FROM public.editorial_leads) AS editorial_leads;

CREATE TEMP TABLE video_triage_staging_result (payload JSONB);

GRANT SELECT ON video_triage_staging_snapshot TO service_role;
GRANT SELECT, INSERT, DELETE, TRUNCATE ON video_triage_staging_result
  TO service_role;

SET LOCAL ROLE service_role;

INSERT INTO video_triage_staging_result (payload)
SELECT public.stage_video_triage_worksheet(
  'PL-stage7-staging-fixture',
  'Stage 7 staging fixture',
  'stage-7-youtube-playlist-preview-v1',
  repeat('a', 64),
  repeat('b', 64),
  'stage7-staging.csv',
  '00000000-0000-0000-0000-000000000074',
  '{"valid_for_staging":true,"warnings":0}'::jsonb,
  jsonb_build_array(
    jsonb_build_object(
      'source_row_number', 2,
      'candidate_key', 'abc123DEF_0',
      'provider_video_id', 'abc123DEF_0',
      'provider_url', 'https://www.youtube.com/watch?v=abc123DEF_0',
      'playlist_positions', jsonb_build_array(1),
      'title', 'Material fixture',
      'description', NULL,
      'channel_name', 'Fixture channel',
      'duration_seconds', 120,
      'provider_classification', 'new',
      'privacy_status', 'public',
      'embeddable', true,
      'provider_issues', '[]'::jsonb,
      'suggested_topic_tags', jsonb_build_array('3d_printing'),
      'disposition', NULL,
      'material_identifiers', '[]'::jsonb,
      'reviewed_topic_tags', '[]'::jsonb,
      'editorial_targets', '[]'::jsonb,
      'review_notes', NULL,
      'original_payload', '{"playlist_id":"PL-stage7-staging-fixture"}'::jsonb
    ),
    jsonb_build_object(
      'source_row_number', 3,
      'candidate_key', 'private:2',
      'provider_video_id', NULL,
      'provider_url', NULL,
      'playlist_positions', jsonb_build_array(2),
      'title', 'Private video',
      'description', NULL,
      'channel_name', NULL,
      'duration_seconds', NULL,
      'provider_classification', 'private',
      'privacy_status', 'private',
      'embeddable', NULL,
      'provider_issues', jsonb_build_array('private_video'),
      'suggested_topic_tags', '[]'::jsonb,
      'disposition', 'ignore',
      'material_identifiers', '[]'::jsonb,
      'reviewed_topic_tags', '[]'::jsonb,
      'editorial_targets', '[]'::jsonb,
      'review_notes', 'Unavailable source retained without publication.',
      'original_payload', '{"playlist_id":"PL-stage7-staging-fixture"}'::jsonb
    )
  )
);

SELECT is(
  (SELECT payload->>'created' FROM video_triage_staging_result),
  'true',
  'The first staging call creates a private batch'
);
SELECT is(
  (SELECT count(*) FROM public.video_import_batches
   WHERE source_playlist_id = 'PL-stage7-staging-fixture'),
  1::bigint,
  'Staging creates one batch'
);
SELECT is(
  (SELECT count(*) FROM public.video_import_items i
   JOIN public.video_import_batches b ON b.id = i.batch_id
   WHERE b.source_playlist_id = 'PL-stage7-staging-fixture'),
  2::bigint,
  'Staging creates every candidate in one transaction'
);
SELECT is(
  (SELECT status FROM public.video_import_batches
   WHERE source_playlist_id = 'PL-stage7-staging-fixture'),
  'needs_review',
  'An available candidate without a disposition keeps the batch in review'
);
SELECT results_eq(
  $$ SELECT disposition, review_status, reviewed_by IS NOT NULL
     FROM public.video_import_items
     WHERE candidate_key = 'private:2' $$,
  $$ VALUES ('ignore'::text, 'reviewed'::text, true) $$,
  'Explicit worksheet decisions retain reviewer metadata'
);
SELECT is(
  (SELECT count(*) FROM public.videos),
  (SELECT videos FROM video_triage_staging_snapshot),
  'Worksheet staging creates no videos'
);
SELECT is(
  (SELECT count(*) FROM public.entities WHERE entity_type = 'video'),
  (SELECT entities FROM video_triage_staging_snapshot),
  'Worksheet staging creates no video entities'
);
SELECT is(
  (SELECT count(*) FROM public.editorial_leads),
  (SELECT editorial_leads FROM video_triage_staging_snapshot),
  'Worksheet staging creates no editorial leads'
);

TRUNCATE video_triage_staging_result;
INSERT INTO video_triage_staging_result (payload)
SELECT public.stage_video_triage_worksheet(
  'PL-stage7-staging-fixture',
  'Stage 7 staging fixture',
  'stage-7-youtube-playlist-preview-v1',
  repeat('a', 64),
  repeat('b', 64),
  'stage7-staging.csv',
  '00000000-0000-0000-0000-000000000074',
  '{"valid_for_staging":true,"warnings":0}'::jsonb,
  jsonb_build_array(
    jsonb_build_object(
      'source_row_number', 2,
      'candidate_key', 'abc123DEF_0',
      'provider_video_id', 'abc123DEF_0',
      'provider_url', 'https://www.youtube.com/watch?v=abc123DEF_0',
      'playlist_positions', jsonb_build_array(1),
      'title', 'Material fixture',
      'provider_classification', 'new',
      'privacy_status', 'public',
      'embeddable', true,
      'provider_issues', '[]'::jsonb,
      'suggested_topic_tags', jsonb_build_array('3d_printing'),
      'disposition', NULL,
      'material_identifiers', '[]'::jsonb,
      'reviewed_topic_tags', '[]'::jsonb,
      'editorial_targets', '[]'::jsonb,
      'original_payload', '{"playlist_id":"PL-stage7-staging-fixture"}'::jsonb
    ),
    jsonb_build_object(
      'source_row_number', 3,
      'candidate_key', 'private:2',
      'playlist_positions', jsonb_build_array(2),
      'title', 'Private video',
      'provider_classification', 'private',
      'privacy_status', 'private',
      'provider_issues', jsonb_build_array('private_video'),
      'suggested_topic_tags', '[]'::jsonb,
      'disposition', 'ignore',
      'material_identifiers', '[]'::jsonb,
      'reviewed_topic_tags', '[]'::jsonb,
      'editorial_targets', '[]'::jsonb,
      'original_payload', '{"playlist_id":"PL-stage7-staging-fixture"}'::jsonb
    )
  )
);

SELECT is(
  (SELECT payload->>'created' FROM video_triage_staging_result),
  'false',
  'Restaging the exact worksheet returns its existing batch'
);
SELECT is(
  (SELECT count(*) FROM public.video_import_batches
   WHERE source_playlist_id = 'PL-stage7-staging-fixture'),
  1::bigint,
  'An idempotent rerun does not duplicate the batch'
);
SELECT is(
  (SELECT count(*) FROM public.video_import_items i
   JOIN public.video_import_batches b ON b.id = i.batch_id
   WHERE b.source_playlist_id = 'PL-stage7-staging-fixture'),
  2::bigint,
  'An idempotent rerun does not duplicate candidates'
);

SELECT throws_ok(
  $$ SELECT public.stage_video_triage_worksheet(
       'PL-stage7-invalid-fixture',
       'Invalid duplicate rows',
       'stage-7-youtube-playlist-preview-v1',
       repeat('c', 64),
       repeat('d', 64),
       'invalid.csv',
       '00000000-0000-0000-0000-000000000074',
       '{}'::jsonb,
       jsonb_build_array(
         jsonb_build_object(
           'source_row_number', 2,
           'candidate_key', 'duplicate',
           'playlist_positions', jsonb_build_array(1),
           'provider_classification', 'private',
           'original_payload', '{}'::jsonb
         ),
         jsonb_build_object(
           'source_row_number', 2,
           'candidate_key', 'duplicate',
           'playlist_positions', jsonb_build_array(2),
           'provider_classification', 'private',
           'original_payload', '{}'::jsonb
         )
       )
     ) $$,
  'P0001',
  'Worksheet rows and candidate keys must be unique',
  'Invalid duplicate rows fail the transaction'
);
SELECT is(
  (SELECT count(*) FROM public.video_import_batches
   WHERE source_playlist_id = 'PL-stage7-invalid-fixture'),
  0::bigint,
  'A rejected worksheet leaves no partial batch'
);

RESET ROLE;
SET LOCAL ROLE postgres;
SELECT * FROM finish();

ROLLBACK;
