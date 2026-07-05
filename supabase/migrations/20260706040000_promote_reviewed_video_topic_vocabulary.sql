-- Reviewed triage values are themselves human-approved topic vocabulary.
-- Normalize their mechanical slug form, but do not guess semantic aliases.

BEGIN;

CREATE OR REPLACE FUNCTION public.process_reviewed_video_topic_tags(
  p_admin_id UUID,
  p_apply BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_candidate_count INTEGER := 0;
  v_governed_topic_count INTEGER := 0;
  v_existing_vocab_count INTEGER := 0;
  v_new_topic_count INTEGER := 0;
  v_existing_count INTEGER := 0;
  v_creatable_count INTEGER := 0;
  v_created_count INTEGER := 0;
  v_outbox_count INTEGER := 0;
  v_user_email TEXT;
  v_now TIMESTAMPTZ := now();
BEGIN
  IF p_admin_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = p_admin_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'A current WasteDB admin profile is required';
  END IF;

  DROP TABLE IF EXISTS pg_temp.reviewed_video_topic_candidates;
  CREATE TEMP TABLE reviewed_video_topic_candidates ON COMMIT DROP AS
  WITH reviewed_values AS (
    SELECT
      vii.id AS import_item_id,
      binding.entity_id AS video_entity_id,
      split_value
    FROM public.video_import_items vii
    JOIN public.entity_canonical_bindings binding ON binding.video_id = vii.video_id
    CROSS JOIN LATERAL unnest(vii.reviewed_topic_tags) AS raw_topic
    CROSS JOIN LATERAL regexp_split_to_table(raw_topic, '\s*[,;]\s*') AS split_value
    WHERE vii.review_status = 'reviewed'
      AND vii.video_id IS NOT NULL
  ), normalized AS (
    SELECT DISTINCT
      import_item_id,
      video_entity_id,
      trim(BOTH '_' FROM regexp_replace(
        lower(btrim(split_value)), '[^a-z0-9]+', '_', 'g'
      )) AS topic_slug
    FROM reviewed_values
    WHERE NULLIF(btrim(split_value), '') IS NOT NULL
  )
  SELECT
    normalized.import_item_id,
    normalized.video_entity_id,
    normalized.topic_slug,
    tag.id AS tag_id,
    existing.entity_id IS NOT NULL AS already_tagged
  FROM normalized
  LEFT JOIN public.tags tag
    ON tag.slug = normalized.topic_slug
   AND tag.tag_type = 'topic'
   AND tag.active = TRUE
  LEFT JOIN public.entity_tags existing
    ON existing.entity_id = normalized.video_entity_id
   AND existing.tag_id = tag.id
  WHERE normalized.topic_slug <> '';

  SELECT
    count(*),
    count(DISTINCT topic_slug),
    count(DISTINCT topic_slug) FILTER (WHERE tag_id IS NOT NULL),
    count(DISTINCT topic_slug) FILTER (WHERE tag_id IS NULL),
    count(*) FILTER (WHERE already_tagged),
    count(*) FILTER (WHERE NOT already_tagged)
  INTO
    v_candidate_count,
    v_governed_topic_count,
    v_existing_vocab_count,
    v_new_topic_count,
    v_existing_count,
    v_creatable_count
  FROM reviewed_video_topic_candidates;

  IF p_apply THEN
    INSERT INTO public.tags (slug, label, tag_type, description, active, created_by)
    SELECT DISTINCT
      topic_slug,
      initcap(replace(topic_slug, '_', ' ')),
      'topic',
      'Topic explicitly reviewed during video triage.',
      TRUE,
      p_admin_id
    FROM reviewed_video_topic_candidates
    WHERE tag_id IS NULL
    ON CONFLICT (slug) DO NOTHING;

    UPDATE reviewed_video_topic_candidates candidate
    SET tag_id = tag.id
    FROM public.tags tag
    WHERE tag.slug = candidate.topic_slug
      AND tag.tag_type = 'topic'
      AND tag.active = TRUE;

    INSERT INTO public.entity_tags (
      entity_id, tag_id, status, created_by, reviewed_by, reviewed_at
    )
    SELECT video_entity_id, tag_id, 'active', p_admin_id, p_admin_id, v_now
    FROM reviewed_video_topic_candidates
    WHERE tag_id IS NOT NULL AND NOT already_tagged
    ON CONFLICT (entity_id, tag_id) DO NOTHING;
    GET DIAGNOSTICS v_created_count = ROW_COUNT;

    INSERT INTO public.graph_sync_outbox (
      event_key, source_table, source_identifier, operation, payload
    )
    SELECT
      'entity_tags:reviewed-video-topic:insert:' || candidate.video_entity_id || ':' || candidate.tag_id,
      'entity_tags', candidate.video_entity_id || ':' || candidate.tag_id,
      'insert', jsonb_build_object(
        'entity_id', candidate.video_entity_id,
        'tag_id', candidate.tag_id,
        'tag_slug', candidate.topic_slug,
        'status', 'active',
        'reviewed_by', p_admin_id,
        'provenance', 'reviewed_video_triage'
      )
    FROM reviewed_video_topic_candidates candidate
    JOIN public.entity_tags entity_tag
      ON entity_tag.entity_id = candidate.video_entity_id
     AND entity_tag.tag_id = candidate.tag_id
    WHERE candidate.tag_id IS NOT NULL
      AND NOT candidate.already_tagged
    ON CONFLICT (event_key) DO NOTHING;
    GET DIAGNOSTICS v_outbox_count = ROW_COUNT;

    IF v_created_count > 0 THEN
      SELECT email INTO v_user_email FROM public.user_profiles WHERE id = p_admin_id;
      INSERT INTO public.audit_log (
        id, timestamp, user_id, user_email, entity_type, entity_id,
        action, after, changes
      ) VALUES (
        'audit:' || floor(extract(epoch FROM clock_timestamp()) * 1000)::BIGINT
          || ':' || gen_random_uuid(),
        v_now, p_admin_id::TEXT, v_user_email, 'entity_tag', NULL,
        'reviewed_video_topic_apply',
        jsonb_build_object(
          'created_count', v_created_count,
          'governed_topic_count', v_governed_topic_count,
          'new_topic_count', v_new_topic_count,
          'status', 'active',
          'provenance', 'reviewed_video_triage'
        ),
        jsonb_build_array(jsonb_build_object(
          'field', 'entity_tags', 'newValue', v_created_count
        ))
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'mode', CASE WHEN p_apply THEN 'apply' ELSE 'preview' END,
    'candidate_count', v_candidate_count,
    'governed_topic_count', v_governed_topic_count,
    'existing_vocabulary_count', v_existing_vocab_count,
    'new_topic_count', v_new_topic_count,
    'resolved_count', v_candidate_count,
    'unresolved_count', 0,
    'existing_count', v_existing_count,
    'creatable_count', v_creatable_count,
    'created_count', v_created_count,
    'outbox_count', v_outbox_count,
    'status', 'active',
    'unresolved', '[]'::JSONB
  );
END;
$$;

REVOKE ALL ON FUNCTION public.process_reviewed_video_topic_tags(UUID, BOOLEAN)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_reviewed_video_topic_tags(UUID, BOOLEAN)
TO service_role;

COMMIT;
