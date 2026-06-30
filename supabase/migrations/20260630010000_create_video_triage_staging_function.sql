-- Stage 7: transactional, service-role-only worksheet staging.
--
-- This function persists validated playlist candidates and human triage
-- decisions. It does not create videos, entities, bindings, mappings, tags,
-- editorial leads, or public records.

BEGIN;

CREATE OR REPLACE FUNCTION public.stage_video_triage_worksheet(
  p_source_playlist_id TEXT,
  p_source_playlist_title TEXT,
  p_preview_contract_version TEXT,
  p_source_preview_checksum TEXT,
  p_worksheet_checksum TEXT,
  p_source_filename TEXT,
  p_created_by UUID,
  p_validation_summary JSONB,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_batch public.video_import_batches%ROWTYPE;
  v_item JSONB;
  v_row_count INTEGER;
  v_reviewed_count INTEGER;
  v_unreviewed_available_count INTEGER;
  v_status TEXT;
  v_disposition TEXT;
  v_classification TEXT;
  v_now TIMESTAMPTZ := now();
BEGIN
  IF NULLIF(btrim(p_source_playlist_id), '') IS NULL THEN
    RAISE EXCEPTION 'A source playlist identifier is required';
  END IF;

  IF p_preview_contract_version IS DISTINCT FROM
     'stage-7-youtube-playlist-preview-v1' THEN
    RAISE EXCEPTION 'Unsupported playlist preview contract';
  END IF;

  IF p_source_preview_checksum IS NULL
     OR p_source_preview_checksum !~ '^[a-f0-9]{64}$'
     OR p_worksheet_checksum IS NULL
     OR p_worksheet_checksum !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'Lowercase SHA-256 preview and worksheet checksums are required';
  END IF;

  IF p_created_by IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.user_profiles WHERE id = p_created_by
  ) THEN
    RAISE EXCEPTION 'A current WasteDB user profile is required';
  END IF;

  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Worksheet items must be a JSON array';
  END IF;

  v_row_count := jsonb_array_length(p_items);
  IF v_row_count < 1 OR v_row_count > 1000 THEN
    RAISE EXCEPTION 'Worksheet item count must be between 1 and 1000';
  END IF;

  IF COALESCE(jsonb_typeof(p_validation_summary), 'null') <> 'object' THEN
    RAISE EXCEPTION 'Validation summary must be a JSON object';
  END IF;

  -- Serialize identical worksheet attempts before checking the unique key.
  PERFORM pg_advisory_xact_lock(
    hashtextextended(
      'video-triage:' || p_source_playlist_id || ':' || p_worksheet_checksum,
      0
    )
  );

  SELECT *
  INTO v_batch
  FROM public.video_import_batches
  WHERE provider = 'youtube'
    AND source_playlist_id = p_source_playlist_id
    AND worksheet_checksum = p_worksheet_checksum;

  IF FOUND THEN
    IF v_batch.source_preview_checksum IS DISTINCT FROM p_source_preview_checksum
       OR v_batch.preview_contract_version IS DISTINCT FROM
          p_preview_contract_version
       OR v_batch.row_count IS DISTINCT FROM v_row_count THEN
      RAISE EXCEPTION 'Existing worksheet batch does not match staged provenance';
    END IF;

    RETURN jsonb_build_object(
      'success', true,
      'created', false,
      'batch_id', v_batch.id,
      'status', v_batch.status,
      'row_count', v_batch.row_count,
      'reviewed_count', (
        SELECT count(*)
        FROM public.video_import_items
        WHERE batch_id = v_batch.id
          AND disposition IS NOT NULL
      ),
      'message', 'This exact worksheet is already staged.'
    );
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_items) AS item
    WHERE jsonb_typeof(item) IS DISTINCT FROM 'object'
  ) THEN
    RAISE EXCEPTION 'Every worksheet item must be a JSON object';
  END IF;

  IF (
    SELECT count(*) <> count(DISTINCT (item->>'source_row_number')::INTEGER)
    FROM jsonb_array_elements(p_items) AS item
  ) OR (
    SELECT count(*) <> count(DISTINCT item->>'candidate_key')
    FROM jsonb_array_elements(p_items) AS item
  ) THEN
    RAISE EXCEPTION 'Worksheet rows and candidate keys must be unique';
  END IF;

  v_reviewed_count := 0;
  v_unreviewed_available_count := 0;

  FOR v_item IN
    SELECT item
    FROM jsonb_array_elements(p_items) AS item
    ORDER BY (item->>'source_row_number')::INTEGER
  LOOP
    v_classification := NULLIF(btrim(v_item->>'provider_classification'), '');
    v_disposition := NULLIF(btrim(v_item->>'disposition'), '');

    IF NULLIF(btrim(v_item->>'candidate_key'), '') IS NULL
       OR NULLIF(btrim(v_item->>'source_row_number'), '') IS NULL THEN
      RAISE EXCEPTION 'Each worksheet item requires a row number and candidate key';
    END IF;

    IF v_classification NOT IN (
      'new', 'existing', 'private', 'deleted', 'unavailable', 'malformed'
    ) THEN
      RAISE EXCEPTION 'Unsupported provider classification: %', v_classification;
    END IF;

    IF v_disposition IS NOT NULL AND v_disposition NOT IN (
      'material_video', 'editorial_lead', 'both', 'ignore'
    ) THEN
      RAISE EXCEPTION 'Unsupported triage disposition: %', v_disposition;
    END IF;

    IF v_classification NOT IN ('new', 'existing')
       AND v_disposition IS NOT NULL
       AND v_disposition <> 'ignore' THEN
      RAISE EXCEPTION 'Unavailable candidates may only be ignored';
    END IF;

    IF jsonb_typeof(v_item->'original_payload') IS DISTINCT FROM 'object' THEN
      RAISE EXCEPTION 'Each worksheet item requires its original row payload';
    END IF;

    IF v_disposition IS NOT NULL THEN
      v_reviewed_count := v_reviewed_count + 1;
    ELSIF v_classification IN ('new', 'existing') THEN
      v_unreviewed_available_count := v_unreviewed_available_count + 1;
    END IF;
  END LOOP;

  v_status := CASE
    WHEN v_unreviewed_available_count = 0 THEN 'ready'
    ELSE 'needs_review'
  END;

  INSERT INTO public.video_import_batches (
    provider,
    source_playlist_id,
    source_playlist_title,
    preview_contract_version,
    source_preview_checksum,
    worksheet_checksum,
    source_filename,
    row_count,
    status,
    validation_summary,
    created_by,
    reviewed_by,
    reviewed_at
  ) VALUES (
    'youtube',
    p_source_playlist_id,
    NULLIF(btrim(p_source_playlist_title), ''),
    p_preview_contract_version,
    p_source_preview_checksum,
    p_worksheet_checksum,
    NULLIF(btrim(p_source_filename), ''),
    v_row_count,
    v_status,
    p_validation_summary,
    p_created_by,
    CASE WHEN v_status = 'ready' THEN p_created_by ELSE NULL END,
    CASE WHEN v_status = 'ready' THEN v_now ELSE NULL END
  )
  RETURNING * INTO v_batch;

  FOR v_item IN
    SELECT item
    FROM jsonb_array_elements(p_items) AS item
    ORDER BY (item->>'source_row_number')::INTEGER
  LOOP
    v_disposition := NULLIF(btrim(v_item->>'disposition'), '');

    INSERT INTO public.video_import_items (
      batch_id,
      source_row_number,
      candidate_key,
      provider_video_id,
      provider_url,
      playlist_positions,
      title,
      description,
      channel_name,
      duration_seconds,
      provider_classification,
      privacy_status,
      embeddable,
      provider_issues,
      suggested_topic_tags,
      disposition,
      material_identifiers,
      reviewed_topic_tags,
      editorial_targets,
      review_notes,
      review_status,
      original_payload,
      created_by,
      reviewed_by,
      reviewed_at
    ) VALUES (
      v_batch.id,
      (v_item->>'source_row_number')::INTEGER,
      v_item->>'candidate_key',
      NULLIF(btrim(v_item->>'provider_video_id'), ''),
      NULLIF(btrim(v_item->>'provider_url'), ''),
      ARRAY(
        SELECT value::INTEGER
        FROM jsonb_array_elements_text(v_item->'playlist_positions')
      ),
      NULLIF(v_item->>'title', ''),
      NULLIF(v_item->>'description', ''),
      NULLIF(v_item->>'channel_name', ''),
      CASE
        WHEN NULLIF(v_item->>'duration_seconds', '') IS NULL THEN NULL
        ELSE (v_item->>'duration_seconds')::INTEGER
      END,
      v_item->>'provider_classification',
      NULLIF(v_item->>'privacy_status', ''),
      CASE
        WHEN jsonb_typeof(v_item->'embeddable') = 'boolean'
          THEN (v_item->>'embeddable')::BOOLEAN
        ELSE NULL
      END,
      ARRAY(
        SELECT value FROM jsonb_array_elements_text(
          COALESCE(v_item->'provider_issues', '[]'::jsonb)
        )
      ),
      ARRAY(
        SELECT value FROM jsonb_array_elements_text(
          COALESCE(v_item->'suggested_topic_tags', '[]'::jsonb)
        )
      ),
      v_disposition,
      ARRAY(
        SELECT value FROM jsonb_array_elements_text(
          COALESCE(v_item->'material_identifiers', '[]'::jsonb)
        )
      ),
      ARRAY(
        SELECT value FROM jsonb_array_elements_text(
          COALESCE(v_item->'reviewed_topic_tags', '[]'::jsonb)
        )
      ),
      ARRAY(
        SELECT value FROM jsonb_array_elements_text(
          COALESCE(v_item->'editorial_targets', '[]'::jsonb)
        )
      ),
      NULLIF(v_item->>'review_notes', ''),
      CASE WHEN v_disposition IS NULL THEN 'unreviewed' ELSE 'reviewed' END,
      v_item->'original_payload',
      p_created_by,
      CASE WHEN v_disposition IS NULL THEN NULL ELSE p_created_by END,
      CASE WHEN v_disposition IS NULL THEN NULL ELSE v_now END
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'created', true,
    'batch_id', v_batch.id,
    'status', v_batch.status,
    'row_count', v_row_count,
    'reviewed_count', v_reviewed_count,
    'unreviewed_available_count', v_unreviewed_available_count,
    'message', CASE
      WHEN v_status = 'ready' THEN 'Worksheet staged and ready for a later draft-apply review.'
      ELSE 'Worksheet staged for continued triage review.'
    END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.stage_video_triage_worksheet(
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  UUID,
  JSONB,
  JSONB
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.stage_video_triage_worksheet(
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  UUID,
  JSONB,
  JSONB
) TO service_role;

COMMIT;
