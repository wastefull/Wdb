-- Stage 7: allow post-apply review corrections for triage batches.
--
-- Review saves should remain blocked while a batch is applying or archived,
-- but completed/failed batches must be editable so admins can correct
-- dispositions and rerun draft-apply safely.

BEGIN;

CREATE OR REPLACE FUNCTION public.review_video_triage_item(
  p_item_id UUID,
  p_reviewer_id UUID,
  p_disposition TEXT,
  p_material_identifiers TEXT[],
  p_reviewed_topic_tags TEXT[],
  p_editorial_targets TEXT[],
  p_review_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_item public.video_import_items%ROWTYPE;
  v_batch public.video_import_batches%ROWTYPE;
  v_reviewer_role TEXT;
  v_disposition TEXT := NULLIF(btrim(p_disposition), '');
  v_material_identifiers TEXT[] := COALESCE(p_material_identifiers, '{}'::TEXT[]);
  v_reviewed_topic_tags TEXT[] := COALESCE(p_reviewed_topic_tags, '{}'::TEXT[]);
  v_editorial_targets TEXT[] := COALESCE(p_editorial_targets, '{}'::TEXT[]);
  v_available_count INTEGER;
  v_reviewed_available_count INTEGER;
  v_unreviewed_available_count INTEGER;
  v_reviewed_count INTEGER;
  v_batch_status TEXT;
  v_now TIMESTAMPTZ := now();
BEGIN
  SELECT role INTO v_reviewer_role
  FROM public.user_profiles
  WHERE id = p_reviewer_id;

  IF v_reviewer_role NOT IN ('staff', 'admin') THEN
    RAISE EXCEPTION 'A staff or admin reviewer is required';
  END IF;

  SELECT * INTO v_item
  FROM public.video_import_items
  WHERE id = p_item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Video triage item % does not exist', p_item_id;
  END IF;

  SELECT * INTO v_batch
  FROM public.video_import_batches
  WHERE id = v_item.batch_id
  FOR UPDATE;

  IF v_batch.status IN ('applying', 'archived') THEN
    RAISE EXCEPTION 'Batch % cannot be reviewed from status %',
      v_batch.id, v_batch.status;
  END IF;

  IF v_disposition IS NOT NULL AND v_disposition NOT IN (
    'material_video', 'editorial_lead', 'both', 'ignore'
  ) THEN
    RAISE EXCEPTION 'Unsupported triage disposition: %', v_disposition;
  END IF;

  IF v_item.provider_classification NOT IN ('new', 'existing')
     AND v_disposition IS NOT NULL
     AND v_disposition <> 'ignore' THEN
    RAISE EXCEPTION 'Unavailable candidates may only be ignored';
  END IF;

  IF NOT v_editorial_targets <@ ARRAY['article', 'blog_post', 'guide']::TEXT[] THEN
    RAISE EXCEPTION 'Unsupported editorial target';
  END IF;

  IF v_disposition IS NULL OR v_disposition = 'ignore' THEN
    v_material_identifiers := '{}'::TEXT[];
    v_reviewed_topic_tags := '{}'::TEXT[];
    v_editorial_targets := '{}'::TEXT[];
  END IF;

  UPDATE public.video_import_items
  SET disposition = v_disposition,
      material_identifiers = v_material_identifiers,
      reviewed_topic_tags = v_reviewed_topic_tags,
      editorial_targets = v_editorial_targets,
      review_notes = NULLIF(btrim(p_review_notes), ''),
      review_status = CASE
        WHEN v_disposition IS NULL THEN 'unreviewed'
        ELSE 'reviewed'
      END,
      reviewed_by = CASE
        WHEN v_disposition IS NULL THEN NULL
        ELSE p_reviewer_id
      END,
      reviewed_at = CASE
        WHEN v_disposition IS NULL THEN NULL
        ELSE v_now
      END
  WHERE id = p_item_id
  RETURNING * INTO v_item;

  SELECT
    count(*) FILTER (
      WHERE provider_classification IN ('new', 'existing')
    ),
    count(*) FILTER (
      WHERE provider_classification IN ('new', 'existing')
        AND disposition IS NOT NULL
    ),
    count(*) FILTER (
      WHERE provider_classification IN ('new', 'existing')
        AND disposition IS NULL
    ),
    count(*) FILTER (WHERE disposition IS NOT NULL)
  INTO
    v_available_count,
    v_reviewed_available_count,
    v_unreviewed_available_count,
    v_reviewed_count
  FROM public.video_import_items
  WHERE batch_id = v_batch.id;

  v_batch_status := CASE
    WHEN v_unreviewed_available_count = 0 THEN 'ready'
    ELSE 'needs_review'
  END;

  UPDATE public.video_import_batches
  SET status = v_batch_status,
      reviewed_by = CASE
        WHEN v_batch_status = 'ready' THEN p_reviewer_id
        ELSE NULL
      END,
      reviewed_at = CASE
        WHEN v_batch_status = 'ready' THEN v_now
        ELSE NULL
      END,
      error_message = NULL,
      validation_summary = validation_summary || jsonb_build_object(
        'available_count', v_available_count,
        'reviewed_available_count', v_reviewed_available_count,
        'unreviewed_available_count', v_unreviewed_available_count,
        'reviewed_count', v_reviewed_count,
        'last_reviewed_at', v_now
      )
  WHERE id = v_batch.id;

  RETURN jsonb_build_object(
    'success', true,
    'item_id', v_item.id,
    'batch_id', v_item.batch_id,
    'disposition', v_item.disposition,
    'review_status', v_item.review_status,
    'reviewed_at', v_item.reviewed_at,
    'batch_status', v_batch_status,
    'available_count', v_available_count,
    'reviewed_available_count', v_reviewed_available_count,
    'unreviewed_available_count', v_unreviewed_available_count,
    'reviewed_count', v_reviewed_count
  );
END;
$$;

COMMIT;
