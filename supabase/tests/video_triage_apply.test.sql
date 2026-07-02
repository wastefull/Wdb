BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL ROLE postgres;
SET LOCAL search_path = public, extensions;

SELECT plan(20);

SELECT has_function(
  'public'::name,
  'apply_video_triage_batch'::name,
  ARRAY['uuid', 'uuid', 'boolean']::name[]
);
SELECT ok(
  has_function_privilege(
    'service_role',
    'public.apply_video_triage_batch(uuid,uuid,boolean)',
    'EXECUTE'
  ),
  'Service role can execute draft apply'
);
SELECT ok(
  NOT has_function_privilege(
    'authenticated',
    'public.apply_video_triage_batch(uuid,uuid,boolean)',
    'EXECUTE'
  ),
  'Authenticated clients cannot execute draft apply directly'
);
SELECT ok(
  NOT has_function_privilege(
    'anon',
    'public.apply_video_triage_batch(uuid,uuid,boolean)',
    'EXECUTE'
  ),
  'Anonymous clients cannot execute draft apply directly'
);

INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-000000000085', 'stage7-apply-admin@example.test')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.user_profiles (id, email, name, role) VALUES (
  '00000000-0000-0000-0000-000000000085',
  'stage7-apply-admin@example.test',
  'Stage 7 Apply Admin',
  'admin'
)
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

CREATE TEMP TABLE video_triage_apply_snapshot AS
SELECT
  (SELECT count(*) FROM public.videos) AS videos,
  (SELECT count(*) FROM public.entities WHERE entity_type = 'video') AS video_entities,
  (SELECT count(*) FROM public.entity_canonical_bindings) AS video_bindings,
  (SELECT count(*) FROM public.editorial_leads) AS editorial_leads,
  (SELECT count(*) FROM public.entity_relationships) AS relationships,
  (SELECT count(*) FROM public.content_entities) AS content_mappings,
  (SELECT count(*) FROM public.tags) AS tags;

INSERT INTO public.videos (
  id,
  title,
  youtube_url,
  youtube_id,
  status,
  created_by
) VALUES (
  '00000000-0000-0000-0000-000000000860',
  'Existing apply fixture',
  'https://www.youtube.com/watch?v=applyReuse01',
  'applyReuse01',
  'draft',
  '00000000-0000-0000-0000-000000000085'
);
INSERT INTO public.entities (
  id,
  entity_type,
  name,
  status,
  created_by
) VALUES (
  '00000000-0000-0000-0000-000000000861',
  'video',
  'Existing apply fixture',
  'draft',
  '00000000-0000-0000-0000-000000000085'
);
INSERT INTO public.entity_canonical_bindings (entity_id, video_id) VALUES (
  '00000000-0000-0000-0000-000000000861',
  '00000000-0000-0000-0000-000000000860'
);

INSERT INTO public.video_import_batches (
  id,
  source_playlist_id,
  preview_contract_version,
  source_preview_checksum,
  worksheet_checksum,
  row_count,
  status,
  created_by,
  reviewed_by,
  reviewed_at
) VALUES (
  '00000000-0000-0000-0000-000000000850',
  'PL-stage7-apply-fixture',
  'stage-7-youtube-playlist-preview-v1',
  repeat('1', 64),
  repeat('2', 64),
  3,
  'ready',
  '00000000-0000-0000-0000-000000000085',
  '00000000-0000-0000-0000-000000000085',
  now()
);

INSERT INTO public.video_import_items (
  id,
  batch_id,
  source_row_number,
  candidate_key,
  provider_video_id,
  provider_url,
  playlist_positions,
  title,
  provider_classification,
  disposition,
  review_status,
  reviewed_by,
  reviewed_at,
  original_payload,
  created_by
) VALUES
  (
    '00000000-0000-0000-0000-000000000851',
    '00000000-0000-0000-0000-000000000850',
    2,
    'apply-reuse',
    'applyReuse01',
    'https://www.youtube.com/watch?v=applyReuse01',
    ARRAY[1],
    'Reuse fixture',
    'existing',
    'material_video',
    'reviewed',
    '00000000-0000-0000-0000-000000000085',
    now(),
    '{}'::jsonb,
    '00000000-0000-0000-0000-000000000085'
  ),
  (
    '00000000-0000-0000-0000-000000000852',
    '00000000-0000-0000-0000-000000000850',
    3,
    'apply-new',
    'applyNew02',
    'https://www.youtube.com/watch?v=applyNew02',
    ARRAY[2],
    'New fixture',
    'new',
    'material_video',
    'reviewed',
    '00000000-0000-0000-0000-000000000085',
    now(),
    '{}'::jsonb,
    '00000000-0000-0000-0000-000000000085'
  ),
  (
    '00000000-0000-0000-0000-000000000853',
    '00000000-0000-0000-0000-000000000850',
    4,
    'apply-editorial',
    'applyEditorial03',
    'https://www.youtube.com/watch?v=applyEditorial03',
    ARRAY[3],
    'Editorial fixture',
    'new',
    'editorial_lead',
    'reviewed',
    '00000000-0000-0000-0000-000000000085',
    now(),
    '{}'::jsonb,
    '00000000-0000-0000-0000-000000000085'
  );

CREATE TEMP TABLE video_triage_apply_result (payload JSONB);
GRANT SELECT, INSERT, DELETE, TRUNCATE ON video_triage_apply_result
  TO service_role;

SET LOCAL ROLE service_role;

INSERT INTO video_triage_apply_result (payload)
SELECT public.apply_video_triage_batch(
  '00000000-0000-0000-0000-000000000850',
  '00000000-0000-0000-0000-000000000085',
  TRUE
);

SELECT lives_ok(
  $$ SELECT 1 $$,
  'Draft apply returns a transactional result payload'
);
SELECT results_eq(
  $$ SELECT
       (payload->>'success')::boolean,
       payload->>'status',
       (payload->>'already_applied')::boolean,
       (payload->>'videos_inserted')::integer,
       (payload->>'videos_reused')::integer,
       (payload->>'entities_inserted')::integer,
       (payload->>'bindings_inserted')::integer,
       (payload->>'editorial_leads_inserted')::integer
     FROM video_triage_apply_result $$,
  $$ VALUES (true, 'completed'::text, false, 1, 1, 1, 1, 1) $$,
  'Apply creates draft artifacts once and reuses existing canonical video rows'
);
SELECT is(
  (SELECT status FROM public.video_import_batches
   WHERE id = '00000000-0000-0000-0000-000000000850'),
  'completed',
  'Successful apply marks the batch completed'
);
SELECT is(
  (SELECT count(*) FROM public.editorial_leads
   WHERE source_import_item_id = '00000000-0000-0000-0000-000000000853'),
  1::bigint,
  'Reviewed editorial dispositions create exactly one private lead'
);
SELECT results_eq(
  $$ SELECT
       (SELECT count(*) FROM public.entity_relationships),
       (SELECT count(*) FROM public.content_entities),
       (SELECT count(*) FROM public.tags) $$,
  $$ SELECT relationships, content_mappings, tags
     FROM video_triage_apply_snapshot $$,
  'Draft apply leaves relationship, content-mapping, and tag graph tables unchanged'
);

TRUNCATE video_triage_apply_result;
INSERT INTO video_triage_apply_result (payload)
SELECT public.apply_video_triage_batch(
  '00000000-0000-0000-0000-000000000850',
  '00000000-0000-0000-0000-000000000085',
  TRUE
);
SELECT is(
  (SELECT payload->>'already_applied' FROM video_triage_apply_result),
  'true',
  'An exact rerun is idempotent and reported as already applied'
);
SELECT results_eq(
  $$ SELECT
       (payload->>'videos_inserted')::integer,
       (payload->>'entities_inserted')::integer,
       (payload->>'bindings_inserted')::integer,
       (payload->>'editorial_leads_inserted')::integer
     FROM video_triage_apply_result $$,
  $$ VALUES (0, 0, 0, 0) $$,
  'An exact rerun does not duplicate videos, entities, bindings, or leads'
);

RESET ROLE;
SET LOCAL ROLE postgres;

INSERT INTO public.video_import_batches (
  id,
  source_playlist_id,
  preview_contract_version,
  source_preview_checksum,
  worksheet_checksum,
  row_count,
  status,
  created_by,
  reviewed_by,
  reviewed_at
) VALUES (
  '00000000-0000-0000-0000-000000000870',
  'PL-stage7-apply-fail-fixture',
  'stage-7-youtube-playlist-preview-v1',
  repeat('3', 64),
  repeat('4', 64),
  1,
  'ready',
  '00000000-0000-0000-0000-000000000085',
  '00000000-0000-0000-0000-000000000085',
  now()
);
INSERT INTO public.video_import_items (
  id,
  batch_id,
  source_row_number,
  candidate_key,
  provider_video_id,
  provider_url,
  playlist_positions,
  title,
  provider_classification,
  disposition,
  review_status,
  reviewed_by,
  reviewed_at,
  original_payload,
  created_by
) VALUES (
  '00000000-0000-0000-0000-000000000871',
  '00000000-0000-0000-0000-000000000870',
  2,
  'apply-fail-no-url',
  NULL,
  NULL,
  ARRAY[1],
  'Broken fixture',
  'new',
  'material_video',
  'reviewed',
  '00000000-0000-0000-0000-000000000085',
  now(),
  '{}'::jsonb,
  '00000000-0000-0000-0000-000000000085'
);

SET LOCAL ROLE service_role;
TRUNCATE video_triage_apply_result;
INSERT INTO video_triage_apply_result (payload)
SELECT public.apply_video_triage_batch(
  '00000000-0000-0000-0000-000000000870',
  '00000000-0000-0000-0000-000000000085',
  FALSE
);
SELECT results_eq(
  $$ SELECT
       (payload->>'success')::boolean,
       payload->>'status',
       COALESCE(payload->>'error', '') <> ''
     FROM video_triage_apply_result $$,
  $$ VALUES (false, 'failed'::text, true) $$,
  'Apply failures return a failed payload with error details'
);
SELECT results_eq(
  $$ SELECT
       status,
       COALESCE(error_message, '') <> ''
     FROM public.video_import_batches
     WHERE id = '00000000-0000-0000-0000-000000000870' $$,
  $$ VALUES ('failed'::text, true) $$,
  'Failed status and error details persist on the batch'
);

RESET ROLE;
SET LOCAL ROLE postgres;

INSERT INTO public.video_import_batches (
  id,
  source_playlist_id,
  preview_contract_version,
  source_preview_checksum,
  worksheet_checksum,
  row_count,
  status,
  created_by,
  reviewed_by,
  reviewed_at
) VALUES (
  '00000000-0000-0000-0000-000000000872',
  'PL-stage7-apply-retry-fixture',
  'stage-7-youtube-playlist-preview-v1',
  repeat('7', 64),
  repeat('8', 64),
  1,
  'failed',
  '00000000-0000-0000-0000-000000000085',
  '00000000-0000-0000-0000-000000000085',
  now()
);
INSERT INTO public.video_import_items (
  id,
  batch_id,
  source_row_number,
  candidate_key,
  provider_video_id,
  provider_url,
  playlist_positions,
  title,
  provider_classification,
  disposition,
  review_status,
  reviewed_by,
  reviewed_at,
  original_payload,
  created_by
) VALUES (
  '00000000-0000-0000-0000-000000000873',
  '00000000-0000-0000-0000-000000000872',
  2,
  'apply-retry-existing-failed-batch',
  'applyRetry05',
  'https://www.youtube.com/watch?v=applyRetry05',
  ARRAY[1],
  'Retry fixture',
  'new',
  'material_video',
  'reviewed',
  '00000000-0000-0000-0000-000000000085',
  now(),
  '{}'::jsonb,
  '00000000-0000-0000-0000-000000000085'
);

SET LOCAL ROLE service_role;
TRUNCATE video_triage_apply_result;
INSERT INTO video_triage_apply_result (payload)
SELECT public.apply_video_triage_batch(
  '00000000-0000-0000-0000-000000000872',
  '00000000-0000-0000-0000-000000000085',
  FALSE
);
SELECT results_eq(
  $$ SELECT
       (payload->>'success')::boolean,
       payload->>'status'
     FROM video_triage_apply_result $$,
  $$ VALUES (true, 'completed'::text) $$,
  'A failed batch can be safely resumed and completed'
);
SELECT is(
  (SELECT status FROM public.video_import_batches
   WHERE id = '00000000-0000-0000-0000-000000000872'),
  'completed',
  'Retrying a failed batch transitions it to completed'
);
SELECT is(
  (SELECT count(*) FROM public.video_import_items
   WHERE id = '00000000-0000-0000-0000-000000000873'
     AND video_id IS NOT NULL),
  1::bigint,
  'Retry apply binds reviewed draft targets during resume'
);

RESET ROLE;
SET LOCAL ROLE postgres;

INSERT INTO public.videos (
  id,
  title,
  youtube_url,
  youtube_id,
  status,
  created_by
) VALUES (
  '00000000-0000-0000-0000-000000000880',
  'Conflict fixture video',
  'https://www.youtube.com/watch?v=applyRace04',
  'applyRace04',
  'draft',
  '00000000-0000-0000-0000-000000000085'
);
INSERT INTO public.entities (
  id,
  entity_type,
  name,
  status,
  created_by
) VALUES (
  '00000000-0000-0000-0000-000000000881',
  'video',
  'Conflict winner entity',
  'draft',
  '00000000-0000-0000-0000-000000000085'
);

CREATE OR REPLACE FUNCTION public.test_force_competing_video_binding()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.video_id = '00000000-0000-0000-0000-000000000880'
     AND pg_trigger_depth() = 1
     AND NOT EXISTS (
       SELECT 1 FROM public.entity_canonical_bindings
       WHERE video_id = NEW.video_id
     )
  THEN
    INSERT INTO public.entity_canonical_bindings (entity_id, video_id)
    VALUES ('00000000-0000-0000-0000-000000000881', NEW.video_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER force_competing_video_binding
BEFORE INSERT ON public.entity_canonical_bindings
FOR EACH ROW
EXECUTE FUNCTION public.test_force_competing_video_binding();

INSERT INTO public.video_import_batches (
  id,
  source_playlist_id,
  preview_contract_version,
  source_preview_checksum,
  worksheet_checksum,
  row_count,
  status,
  created_by,
  reviewed_by,
  reviewed_at
) VALUES (
  '00000000-0000-0000-0000-000000000882',
  'PL-stage7-apply-race-fixture',
  'stage-7-youtube-playlist-preview-v1',
  repeat('5', 64),
  repeat('6', 64),
  1,
  'ready',
  '00000000-0000-0000-0000-000000000085',
  '00000000-0000-0000-0000-000000000085',
  now()
);
INSERT INTO public.video_import_items (
  id,
  batch_id,
  source_row_number,
  candidate_key,
  provider_video_id,
  provider_url,
  playlist_positions,
  title,
  provider_classification,
  disposition,
  review_status,
  reviewed_by,
  reviewed_at,
  original_payload,
  created_by
) VALUES (
  '00000000-0000-0000-0000-000000000883',
  '00000000-0000-0000-0000-000000000882',
  2,
  'apply-race-binding',
  'applyRace04',
  'https://www.youtube.com/watch?v=applyRace04',
  ARRAY[1],
  'Conflict fixture video',
  'existing',
  'material_video',
  'reviewed',
  '00000000-0000-0000-0000-000000000085',
  now(),
  '{}'::jsonb,
  '00000000-0000-0000-0000-000000000085'
);

SET LOCAL ROLE service_role;
TRUNCATE video_triage_apply_result;
INSERT INTO video_triage_apply_result (payload)
SELECT public.apply_video_triage_batch(
  '00000000-0000-0000-0000-000000000882',
  '00000000-0000-0000-0000-000000000085',
  FALSE
);
SELECT results_eq(
  $$ SELECT
       (payload->>'success')::boolean,
       (payload->>'entities_inserted')::integer,
       (payload->>'bindings_inserted')::integer
     FROM video_triage_apply_result $$,
  $$ VALUES (true, 0, 0) $$,
  'A competing canonical bind reuses the winner and does not keep an orphan entity'
);
SELECT is(
  (
    SELECT entity_id
    FROM public.entity_canonical_bindings
    WHERE video_id = '00000000-0000-0000-0000-000000000880'
  ),
  '00000000-0000-0000-0000-000000000881'::uuid,
  'The canonical binding points to the winning entity after conflict handling'
);
SELECT is(
  (SELECT count(*) FROM public.entities
   WHERE name = 'Conflict fixture video'
     AND id <> '00000000-0000-0000-0000-000000000881'),
  0::bigint,
  'No orphan conflict entity remains after binding conflict handling'
);
SELECT is(
  (SELECT count(*) FROM public.entity_canonical_bindings
   WHERE video_id = '00000000-0000-0000-0000-000000000880'),
  1::bigint,
  'Canonical binding remains unique for the conflict fixture video'
);

RESET ROLE;
SET LOCAL ROLE postgres;
DROP TRIGGER IF EXISTS force_competing_video_binding
  ON public.entity_canonical_bindings;
DROP FUNCTION IF EXISTS public.test_force_competing_video_binding();
SELECT * FROM finish();

ROLLBACK;
