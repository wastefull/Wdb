BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL ROLE postgres;
SET LOCAL search_path = public, extensions;

SELECT plan(22);

SELECT has_function(
  'public'::name,
  'review_video_triage_item'::name,
  ARRAY['uuid', 'uuid', 'text', 'text[]', 'text[]', 'text[]', 'text']::name[]
);
SELECT ok(
  has_function_privilege(
    'service_role',
    'public.review_video_triage_item(uuid,uuid,text,text[],text[],text[],text)',
    'EXECUTE'
  ),
  'Service role can execute triage review'
);
SELECT ok(
  NOT has_function_privilege(
    'authenticated',
    'public.review_video_triage_item(uuid,uuid,text,text[],text[],text[],text)',
    'EXECUTE'
  ),
  'Authenticated clients cannot call triage review directly'
);
SELECT ok(
  NOT has_function_privilege(
    'anon',
    'public.review_video_triage_item(uuid,uuid,text,text[],text[],text[],text)',
    'EXECUTE'
  ),
  'Anonymous clients cannot call triage review'
);

INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-000000000075', 'stage7-review-admin@example.test')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.user_profiles (id, email, name, role) VALUES (
  '00000000-0000-0000-0000-000000000075',
  'stage7-review-admin@example.test',
  'Stage 7 Review Admin',
  'admin'
)
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

INSERT INTO public.video_import_batches (
  id,
  source_playlist_id,
  preview_contract_version,
  source_preview_checksum,
  worksheet_checksum,
  row_count,
  status,
  created_by
) VALUES (
  '00000000-0000-0000-0000-000000000750',
  'PL-stage7-review-fixture',
  'stage-7-youtube-playlist-preview-v1',
  repeat('e', 64),
  repeat('f', 64),
  3,
  'needs_review',
  '00000000-0000-0000-0000-000000000075'
);

INSERT INTO public.video_import_items (
  id,
  batch_id,
  source_row_number,
  candidate_key,
  provider_video_id,
  playlist_positions,
  title,
  provider_classification,
  original_payload,
  created_by
) VALUES
  (
    '00000000-0000-0000-0000-000000000751',
    '00000000-0000-0000-0000-000000000750',
    2,
    'review-video-1',
    'reviewVid01',
    ARRAY[1],
    'Review fixture one',
    'new',
    '{}'::jsonb,
    '00000000-0000-0000-0000-000000000075'
  ),
  (
    '00000000-0000-0000-0000-000000000752',
    '00000000-0000-0000-0000-000000000750',
    3,
    'review-video-2',
    'reviewVid02',
    ARRAY[2],
    'Review fixture two',
    'new',
    '{}'::jsonb,
    '00000000-0000-0000-0000-000000000075'
  ),
  (
    '00000000-0000-0000-0000-000000000753',
    '00000000-0000-0000-0000-000000000750',
    4,
    'review-private',
    NULL,
    ARRAY[3],
    'Private review fixture',
    'private',
    '{}'::jsonb,
    '00000000-0000-0000-0000-000000000075'
  );

SET LOCAL ROLE service_role;

SELECT lives_ok(
  $$ SELECT public.review_video_triage_item(
       '00000000-0000-0000-0000-000000000751',
       '00000000-0000-0000-0000-000000000075',
       'material_video',
       ARRAY['aluminum'],
       ARRAY['3d_printing'],
       '{}'::text[],
       'Reviewed as a material video.'
     ) $$,
  'An admin can review an available material video'
);
SELECT results_eq(
  $$ SELECT disposition, material_identifiers, reviewed_topic_tags,
            review_status, reviewed_by IS NOT NULL, reviewed_at IS NOT NULL
     FROM public.video_import_items
     WHERE id = '00000000-0000-0000-0000-000000000751' $$,
  $$ VALUES (
       'material_video'::text,
       ARRAY['aluminum']::text[],
       ARRAY['3d_printing']::text[],
       'reviewed'::text,
       true,
       true
     ) $$,
  'Review fields and attribution are persisted together'
);
SELECT is(
  (SELECT status FROM public.video_import_batches
   WHERE id = '00000000-0000-0000-0000-000000000750'),
  'needs_review',
  'A partially reviewed batch remains in review'
);

SELECT lives_ok(
  $$ SELECT public.review_video_triage_item(
       '00000000-0000-0000-0000-000000000752',
       '00000000-0000-0000-0000-000000000075',
       'ignore',
       '{}'::text[],
       '{}'::text[],
       '{}'::text[],
       'Not relevant.'
     ) $$,
  'A second available candidate can be ignored explicitly'
);
SELECT is(
  (SELECT status FROM public.video_import_batches
   WHERE id = '00000000-0000-0000-0000-000000000750'),
  'ready',
  'The batch becomes ready when all available candidates are reviewed'
);
SELECT results_eq(
  $$ SELECT reviewed_by IS NOT NULL, reviewed_at IS NOT NULL
     FROM public.video_import_batches
     WHERE id = '00000000-0000-0000-0000-000000000750' $$,
  $$ VALUES (true, true) $$,
  'Ready batches preserve final-review attribution'
);

SELECT throws_ok(
  $$ SELECT public.review_video_triage_item(
       '00000000-0000-0000-0000-000000000753',
       '00000000-0000-0000-0000-000000000075',
       'material_video',
       '{}'::text[],
       '{}'::text[],
       '{}'::text[],
       NULL
     ) $$,
  'P0001',
  'Unavailable candidates may only be ignored',
  'Private candidates cannot become material videos'
);
SELECT is(
  (SELECT review_status FROM public.video_import_items
   WHERE id = '00000000-0000-0000-0000-000000000753'),
  'unreviewed',
  'A rejected private-video decision leaves the item unchanged'
);
SELECT lives_ok(
  $$ SELECT public.review_video_triage_item(
       '00000000-0000-0000-0000-000000000753',
       '00000000-0000-0000-0000-000000000075',
       'ignore',
       ARRAY['should-clear'],
       ARRAY['3d_printing'],
       ARRAY['article'],
       'Private source retained as ignored.'
     ) $$,
  'A private candidate may be explicitly ignored'
);
SELECT results_eq(
  $$ SELECT material_identifiers, reviewed_topic_tags, editorial_targets
     FROM public.video_import_items
     WHERE id = '00000000-0000-0000-0000-000000000753' $$,
  $$ VALUES ('{}'::text[], '{}'::text[], '{}'::text[]) $$,
  'Ignoring a candidate clears inapplicable review metadata'
);

SELECT lives_ok(
  $$ SELECT public.review_video_triage_item(
       '00000000-0000-0000-0000-000000000751',
       '00000000-0000-0000-0000-000000000075',
       NULL,
       '{}'::text[],
       '{}'::text[],
       '{}'::text[],
       NULL
     ) $$,
  'A reviewer can return a decision to the unreviewed queue'
);
SELECT is(
  (SELECT status FROM public.video_import_batches
   WHERE id = '00000000-0000-0000-0000-000000000750'),
  'needs_review',
  'Unreviewing an available item moves the batch back to needs_review'
);
SELECT results_eq(
  $$ SELECT reviewed_by IS NULL, reviewed_at IS NULL
     FROM public.video_import_batches
     WHERE id = '00000000-0000-0000-0000-000000000750' $$,
  $$ VALUES (true, true) $$,
  'A reopened batch clears final-review attribution'
);
SELECT is(
  (SELECT (validation_summary->>'unreviewed_available_count')::integer
   FROM public.video_import_batches
   WHERE id = '00000000-0000-0000-0000-000000000750'),
  1,
  'Batch validation summary tracks remaining available review work'
);
SELECT is(
  (SELECT count(*) FROM public.videos),
  0::bigint,
  'Triage review creates no videos'
);
SELECT is(
  (SELECT count(*) FROM public.entities WHERE entity_type = 'video'),
  0::bigint,
  'Triage review creates no video entities'
);
SELECT is(
  (SELECT count(*) FROM public.editorial_leads),
  0::bigint,
  'Triage review creates no editorial leads'
);
SELECT is(
  (SELECT count(*) FROM public.content_entities),
  0::bigint,
  'Triage review creates no content mappings'
);

RESET ROLE;
SET LOCAL ROLE postgres;
SELECT * FROM finish();

ROLLBACK;
