-- Publish videos that completed the explicitly reviewed Stage 7 triage apply.

BEGIN;

CREATE OR REPLACE FUNCTION public.publish_applied_reviewed_videos()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_published_count INTEGER := 0;
  v_video_outbox_count INTEGER := 0;
  v_entity_outbox_count INTEGER := 0;
BEGIN
DROP TABLE IF EXISTS pg_temp.reviewed_video_publication_candidates;
CREATE TEMP TABLE reviewed_video_publication_candidates ON COMMIT DROP AS
SELECT DISTINCT ON (video.id)
  video.id AS video_id,
  video.status AS previous_video_status,
  entity.id AS entity_id,
  entity.status AS previous_entity_status,
  item.reviewed_by,
  item.reviewed_at
FROM public.video_import_items item
JOIN public.videos video ON video.id = item.video_id
JOIN public.entity_canonical_bindings binding ON binding.video_id = video.id
JOIN public.entities entity ON entity.id = binding.entity_id
WHERE item.review_status = 'reviewed'
  AND item.disposition IN ('material_video', 'both')
  AND item.applied_at IS NOT NULL
  AND (video.status <> 'published' OR entity.status <> 'active')
ORDER BY video.id, item.reviewed_at DESC NULLS LAST;

SELECT count(*) INTO v_published_count
FROM reviewed_video_publication_candidates;

UPDATE public.videos video
SET
  status = 'published',
  reviewed_by = candidate.reviewed_by,
  reviewed_at = COALESCE(candidate.reviewed_at, now()),
  updated_at = now()
FROM reviewed_video_publication_candidates candidate
WHERE video.id = candidate.video_id;

UPDATE public.entities entity
SET
  status = 'active',
  reviewed_by = candidate.reviewed_by,
  reviewed_at = COALESCE(candidate.reviewed_at, now()),
  updated_at = now()
FROM reviewed_video_publication_candidates candidate
WHERE entity.id = candidate.entity_id;

INSERT INTO public.graph_sync_outbox (
  event_key, source_table, source_identifier, operation, payload
)
SELECT
  'videos:reviewed-publication:update:' || candidate.video_id,
  'videos', candidate.video_id::TEXT, 'update',
  jsonb_build_object(
    'video_id', candidate.video_id,
    'previous_status', candidate.previous_video_status,
    'status', 'published',
    'reviewed_by', candidate.reviewed_by,
    'provenance', 'reviewed_video_triage_publication'
  )
FROM reviewed_video_publication_candidates candidate
ON CONFLICT (event_key) DO NOTHING;
GET DIAGNOSTICS v_video_outbox_count = ROW_COUNT;

INSERT INTO public.graph_sync_outbox (
  event_key, source_table, source_identifier, operation, payload
)
SELECT
  'entities:reviewed-video-publication:update:' || candidate.entity_id,
  'entities', candidate.entity_id::TEXT, 'update',
  jsonb_build_object(
    'entity_id', candidate.entity_id,
    'video_id', candidate.video_id,
    'previous_status', candidate.previous_entity_status,
    'status', 'active',
    'reviewed_by', candidate.reviewed_by,
    'provenance', 'reviewed_video_triage_publication'
  )
FROM reviewed_video_publication_candidates candidate
ON CONFLICT (event_key) DO NOTHING;
GET DIAGNOSTICS v_entity_outbox_count = ROW_COUNT;

INSERT INTO public.audit_log (
  id, timestamp, user_id, user_email, entity_type, entity_id,
  action, before, after, changes
)
SELECT
  'audit:' || floor(extract(epoch FROM clock_timestamp()) * 1000)::BIGINT
    || ':' || gen_random_uuid(),
  now(), candidate.reviewed_by::TEXT, profile.email, 'video',
  candidate.video_id::TEXT, 'video_publish',
  jsonb_build_object('status', candidate.previous_video_status),
  jsonb_build_object(
    'status', 'published',
    'entity_id', candidate.entity_id,
    'provenance', 'reviewed_video_triage_publication'
  ),
  jsonb_build_array(jsonb_build_object(
    'field', 'status',
    'oldValue', candidate.previous_video_status,
    'newValue', 'published'
  ))
FROM reviewed_video_publication_candidates candidate
LEFT JOIN public.user_profiles profile ON profile.id = candidate.reviewed_by;

RETURN jsonb_build_object(
  'success', TRUE,
  'published_count', v_published_count,
  'video_outbox_count', v_video_outbox_count,
  'entity_outbox_count', v_entity_outbox_count
);
END;
$$;

REVOKE ALL ON FUNCTION public.publish_applied_reviewed_videos()
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publish_applied_reviewed_videos()
TO service_role;

SELECT public.publish_applied_reviewed_videos();

COMMIT;
