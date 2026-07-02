-- Stage 7: transactional draft-video apply from reviewed private triage.
--
-- Safety contract:
-- - Applies only reviewed private triage records.
-- - Creates draft videos plus video entities and canonical bindings only.
-- - Never publishes videos or creates relationship/content/tag graph records.
-- - Is idempotent for exact reruns and safe to resume.

BEGIN;

CREATE OR REPLACE FUNCTION public.apply_video_triage_batch(
  p_batch_id UUID,
  p_reviewer_id UUID,
  p_include_editorial_leads BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_batch public.video_import_batches%ROWTYPE;
  v_now TIMESTAMPTZ := now();
  v_unreviewed_available_count INTEGER := 0;
  v_target_draft_count INTEGER := 0;
  v_pending_draft_count INTEGER := 0;
  v_target_editorial_count INTEGER := 0;
  v_existing_editorial_count INTEGER := 0;
  v_video_id UUID;
  v_entity_id UUID;
  v_youtube_url TEXT;
  v_videos_inserted INTEGER := 0;
  v_videos_reused INTEGER := 0;
  v_entities_inserted INTEGER := 0;
  v_bindings_inserted INTEGER := 0;
  v_triage_items_applied INTEGER := 0;
  v_editorial_leads_inserted INTEGER := 0;
  v_already_applied BOOLEAN := FALSE;
  v_row_count INTEGER := 0;
  v_item RECORD;
BEGIN
  IF p_batch_id IS NULL THEN
    RAISE EXCEPTION 'Batch ID is required';
  END IF;
  IF p_reviewer_id IS NULL THEN
    RAISE EXCEPTION 'Reviewer ID is required';
  END IF;

  SELECT *
  INTO v_batch
  FROM public.video_import_batches
  WHERE id = p_batch_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Triage batch not found: %', p_batch_id;
  END IF;

  IF v_batch.status NOT IN ('ready', 'completed', 'failed') THEN
    RAISE EXCEPTION 'Batch status must be ready, failed, or completed. Current status: %', v_batch.status;
  END IF;

  SELECT count(*)::INTEGER
  INTO v_unreviewed_available_count
  FROM public.video_import_items
  WHERE batch_id = p_batch_id
    AND provider_classification IN ('new', 'existing')
    AND disposition IS NULL;

  IF v_unreviewed_available_count > 0 THEN
    RAISE EXCEPTION 'Batch has % unreviewed available candidates', v_unreviewed_available_count;
  END IF;

  SELECT count(*)::INTEGER
  INTO v_target_draft_count
  FROM public.video_import_items
  WHERE batch_id = p_batch_id
    AND review_status = 'reviewed'
    AND provider_classification IN ('new', 'existing')
    AND disposition IN ('material_video', 'both');

  SELECT count(*)::INTEGER
  INTO v_pending_draft_count
  FROM public.video_import_items
  WHERE batch_id = p_batch_id
    AND review_status = 'reviewed'
    AND provider_classification IN ('new', 'existing')
    AND disposition IN ('material_video', 'both')
    AND video_id IS NULL;

  IF p_include_editorial_leads THEN
    SELECT count(*)::INTEGER
    INTO v_target_editorial_count
    FROM public.video_import_items
    WHERE batch_id = p_batch_id
      AND review_status = 'reviewed'
      AND disposition IN ('editorial_lead', 'both');

    SELECT count(*)::INTEGER
    INTO v_existing_editorial_count
    FROM public.editorial_leads el
    JOIN public.video_import_items vii
      ON vii.id = el.source_import_item_id
    WHERE vii.batch_id = p_batch_id
      AND vii.review_status = 'reviewed'
      AND vii.disposition IN ('editorial_lead', 'both');
  END IF;

  v_already_applied :=
    v_batch.status = 'completed'
    AND v_pending_draft_count = 0
    AND (
      NOT p_include_editorial_leads
      OR v_target_editorial_count = v_existing_editorial_count
    );

  UPDATE public.video_import_batches
  SET
    status = 'applying',
    apply_started_at = COALESCE(apply_started_at, v_now),
    error_message = NULL,
    updated_at = v_now
  WHERE id = p_batch_id;

  FOR v_item IN
    SELECT
      id,
      provider_video_id,
      provider_url,
      title,
      description,
      duration_seconds,
      channel_name,
      source_row_number,
      candidate_key,
      material_identifiers,
      reviewed_topic_tags,
      review_notes,
      video_id
    FROM public.video_import_items
    WHERE batch_id = p_batch_id
      AND review_status = 'reviewed'
      AND provider_classification IN ('new', 'existing')
      AND disposition IN ('material_video', 'both')
    ORDER BY source_row_number ASC
  LOOP
    IF v_item.video_id IS NOT NULL THEN
      v_video_id := v_item.video_id;
      v_videos_reused := v_videos_reused + 1;
    ELSE
      v_youtube_url := COALESCE(
        NULLIF(trim(v_item.provider_url), ''),
        CASE
          WHEN v_item.provider_video_id IS NULL OR trim(v_item.provider_video_id) = ''
            THEN NULL
          ELSE 'https://www.youtube.com/watch?v=' || trim(v_item.provider_video_id)
        END
      );

      IF v_youtube_url IS NULL THEN
        RAISE EXCEPTION
          'Reviewed material-video candidate % has no usable YouTube URL',
          v_item.id;
      END IF;

      SELECT id
      INTO v_video_id
      FROM public.videos
      WHERE (
        v_item.provider_video_id IS NOT NULL
        AND youtube_id = v_item.provider_video_id
      )
      OR youtube_url = v_youtube_url
      ORDER BY created_at ASC
      LIMIT 1;

      IF v_video_id IS NULL THEN
        INSERT INTO public.videos (
          title,
          youtube_url,
          youtube_id,
          description,
          duration_seconds,
          channel_name,
          status,
          created_by
        )
        VALUES (
          COALESCE(NULLIF(trim(v_item.title), ''), 'Untitled video'),
          v_youtube_url,
          NULLIF(trim(v_item.provider_video_id), ''),
          v_item.description,
          v_item.duration_seconds,
          v_item.channel_name,
          'draft',
          p_reviewer_id
        )
        RETURNING id INTO v_video_id;
        v_videos_inserted := v_videos_inserted + 1;
      ELSE
        v_videos_reused := v_videos_reused + 1;
      END IF;

      UPDATE public.video_import_items
      SET
        video_id = v_video_id,
        applied_at = v_now,
        updated_at = v_now
      WHERE id = v_item.id
        AND video_id IS NULL;

      GET DIAGNOSTICS v_row_count = ROW_COUNT;
      v_triage_items_applied := v_triage_items_applied + v_row_count;
    END IF;

    SELECT entity_id
    INTO v_entity_id
    FROM public.entity_canonical_bindings
    WHERE video_id = v_video_id
    LIMIT 1;

    IF v_entity_id IS NULL THEN
      INSERT INTO public.entities (
        entity_type,
        name,
        status,
        created_by
      )
      VALUES (
        'video',
        COALESCE(NULLIF(trim(v_item.title), ''), 'Untitled video'),
        'draft',
        p_reviewer_id
      )
      RETURNING id INTO v_entity_id;

      INSERT INTO public.entity_canonical_bindings (
        entity_id,
        video_id
      )
      VALUES (v_entity_id, v_video_id)
      ON CONFLICT (video_id) DO NOTHING;

      GET DIAGNOSTICS v_row_count = ROW_COUNT;
      IF v_row_count = 1 THEN
        v_entities_inserted := v_entities_inserted + 1;
        v_bindings_inserted := v_bindings_inserted + 1;
      ELSE
        -- Another transaction bound this video first. Remove the orphan and
        -- reuse the canonical entity selected by that winning transaction.
        DELETE FROM public.entities
        WHERE id = v_entity_id;

        SELECT entity_id
        INTO v_entity_id
        FROM public.entity_canonical_bindings
        WHERE video_id = v_video_id
        LIMIT 1;
      END IF;
    END IF;
  END LOOP;

  IF p_include_editorial_leads THEN
    INSERT INTO public.editorial_leads (
      source_import_item_id,
      source_video_id,
      source_url,
      provider_video_id,
      title,
      description,
      channel_name,
      rationale,
      target_types,
      suggested_material_identifiers,
      suggested_topic_tags,
      status,
      created_by,
      original_payload
    )
    SELECT
      vii.id,
      vii.video_id,
      vii.provider_url,
      vii.provider_video_id,
      COALESCE(NULLIF(trim(vii.title), ''), 'Untitled lead'),
      vii.description,
      vii.channel_name,
      NULLIF(trim(vii.review_notes), ''),
      vii.editorial_targets,
      vii.material_identifiers,
      vii.reviewed_topic_tags,
      'needs_review',
      p_reviewer_id,
      jsonb_build_object(
        'batch_id', vii.batch_id,
        'source_row_number', vii.source_row_number,
        'candidate_key', vii.candidate_key,
        'provider_classification', vii.provider_classification,
        'provider_issues', vii.provider_issues,
        'review_notes', vii.review_notes
      )
    FROM public.video_import_items vii
    WHERE vii.batch_id = p_batch_id
      AND vii.review_status = 'reviewed'
      AND vii.disposition IN ('editorial_lead', 'both')
    ON CONFLICT (source_import_item_id) DO NOTHING;

    GET DIAGNOSTICS v_editorial_leads_inserted = ROW_COUNT;
  END IF;

  UPDATE public.video_import_batches
  SET
    status = 'completed',
    reviewed_by = p_reviewer_id,
    reviewed_at = COALESCE(reviewed_at, v_now),
    apply_started_at = COALESCE(apply_started_at, v_now),
    apply_completed_at = v_now,
    error_message = NULL,
    validation_summary = COALESCE(v_batch.validation_summary, '{}'::jsonb) || jsonb_build_object(
      'draft_apply', jsonb_build_object(
        'applied_at', v_now,
        'videos_inserted', v_videos_inserted,
        'videos_reused', v_videos_reused,
        'entities_inserted', v_entities_inserted,
        'bindings_inserted', v_bindings_inserted,
        'triage_items_applied', v_triage_items_applied,
        'editorial_leads_inserted', v_editorial_leads_inserted,
        'already_applied_rerun', v_already_applied
      )
    ),
    updated_at = v_now
  WHERE id = p_batch_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'batch_id', p_batch_id,
    'status', 'completed',
    'already_applied', v_already_applied,
    'videos_inserted', v_videos_inserted,
    'videos_reused', v_videos_reused,
    'entities_inserted', v_entities_inserted,
    'bindings_inserted', v_bindings_inserted,
    'triage_items_applied', v_triage_items_applied,
    'editorial_leads_inserted', v_editorial_leads_inserted,
    'pending_draft_items_before_apply', v_pending_draft_count,
    'target_draft_items', v_target_draft_count,
    'target_editorial_items', v_target_editorial_count
  );
EXCEPTION
  WHEN OTHERS THEN
    UPDATE public.video_import_batches
    SET
      status = 'failed',
      error_message = SQLERRM,
      updated_at = now()
    WHERE id = p_batch_id;

    RETURN jsonb_build_object(
      'success', FALSE,
      'batch_id', p_batch_id,
      'status', 'failed',
      'already_applied', FALSE,
      'videos_inserted', 0,
      'videos_reused', 0,
      'entities_inserted', 0,
      'bindings_inserted', 0,
      'triage_items_applied', 0,
      'editorial_leads_inserted', 0,
      'pending_draft_items_before_apply', 0,
      'target_draft_items', 0,
      'target_editorial_items', 0,
      'error', SQLERRM,
      'sqlstate', SQLSTATE
    );
END;
$$;

REVOKE ALL ON FUNCTION public.apply_video_triage_batch(
  UUID,
  UUID,
  BOOLEAN
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.apply_video_triage_batch(
  UUID,
  UUID,
  BOOLEAN
) TO service_role;

COMMIT;
