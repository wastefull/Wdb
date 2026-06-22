-- Stage 6 entity-backfill apply primitives.
--
-- These functions add no graph content by themselves. They provide
-- service-role-only transactional phase execution and run finalization for the
-- separately approved entity backfill.

BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS graph_entity_backfill_single_active_idx
  ON public.graph_migration_runs(migration_version)
  WHERE migration_version = 'stage-6-entity-backfill-v1'
    AND mode = 'apply'
    AND status IN ('pending', 'running');

CREATE OR REPLACE FUNCTION public.apply_graph_entity_backfill_phase(
  p_run_id UUID,
  p_phase TEXT,
  p_records JSONB,
  p_plan_checksum TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_run public.graph_migration_runs%ROWTYPE;
  v_checkpoint public.graph_migration_checkpoints%ROWTYPE;
  v_record JSONB;
  v_source_id UUID;
  v_entity_id UUID;
  v_started_by UUID;
  v_entity_type TEXT;
  v_binding_column TEXT;
  v_name TEXT;
  v_slug TEXT;
  v_description TEXT;
  v_status TEXT;
  v_source_exists BOOLEAN;
  v_row_count INTEGER;
  v_processed BIGINT := 0;
  v_inserted BIGINT := 0;
  v_updated BIGINT := 0;
  v_reconciled BIGINT := 0;
  v_result JSONB;
  v_error TEXT;
BEGIN
  IF p_phase NOT IN (
    'materials',
    'articles',
    'guides',
    'blog_posts',
    'sources'
  ) THEN
    RAISE EXCEPTION 'Unsupported entity-backfill phase: %', p_phase;
  END IF;

  IF jsonb_typeof(p_records) <> 'array' THEN
    RAISE EXCEPTION 'Entity-backfill records must be a JSON array';
  END IF;

  IF p_plan_checksum IS NULL
     OR p_plan_checksum !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'A lowercase SHA-256 plan checksum is required';
  END IF;

  SELECT *
  INTO v_run
  FROM public.graph_migration_runs
  WHERE id = p_run_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Graph migration run % does not exist', p_run_id;
  END IF;

  IF v_run.migration_version <> 'stage-6-entity-backfill-v1'
     OR v_run.mode <> 'apply' THEN
    RAISE EXCEPTION 'Run % is not an entity-backfill apply run', p_run_id;
  END IF;

  IF v_run.status IN ('completed', 'blocked') THEN
    RAISE EXCEPTION 'Run % cannot execute from status %', p_run_id, v_run.status;
  END IF;

  SELECT *
  INTO v_checkpoint
  FROM public.graph_migration_checkpoints
  WHERE run_id = p_run_id
    AND phase = p_phase
  FOR UPDATE;

  IF FOUND AND v_checkpoint.status = 'completed' THEN
    IF v_checkpoint.cursor->>'plan_checksum' IS DISTINCT FROM p_plan_checksum THEN
      RAISE EXCEPTION
        'Completed phase % has a different plan checksum', p_phase;
    END IF;

    RETURN jsonb_build_object(
      'success', true,
      'phase', p_phase,
      'skipped_completed', true,
      'processed', v_checkpoint.processed_count,
      'inserted', v_checkpoint.inserted_count,
      'updated', v_checkpoint.updated_count,
      'reconciled',
        v_checkpoint.processed_count
        - v_checkpoint.inserted_count
        - v_checkpoint.updated_count
        - v_checkpoint.conflict_count
        - v_checkpoint.unresolved_count,
      'plan_checksum', p_plan_checksum
    );
  END IF;

  INSERT INTO public.graph_migration_checkpoints (
    run_id,
    phase,
    cursor,
    status,
    last_error
  )
  VALUES (
    p_run_id,
    p_phase,
    jsonb_build_object('plan_checksum', p_plan_checksum),
    'running',
    NULL
  )
  ON CONFLICT (run_id, phase) DO UPDATE
  SET cursor = EXCLUDED.cursor,
      status = 'running',
      last_error = NULL,
      updated_at = now();

  UPDATE public.graph_migration_runs
  SET status = 'running',
      started_at = COALESCE(started_at, now()),
      completed_at = NULL,
      error_message = NULL
  WHERE id = p_run_id;

  v_started_by := v_run.started_by;

  BEGIN
    -- Serialize entity/binding mutations so the dry-run collision contract
    -- cannot be invalidated by a concurrent apply worker.
    LOCK TABLE public.entities IN SHARE ROW EXCLUSIVE MODE;
    LOCK TABLE public.entity_canonical_bindings IN SHARE ROW EXCLUSIVE MODE;

    IF (
      SELECT count(*) <> count(DISTINCT item->>'source_id')
      FROM jsonb_array_elements(p_records) AS item
    ) THEN
      RAISE EXCEPTION 'Phase % contains duplicate source identifiers', p_phase;
    END IF;

    FOR v_record IN
      SELECT item
      FROM jsonb_array_elements(p_records) AS item
      ORDER BY item->>'source_id'
    LOOP
      IF v_record->>'source_table' IS DISTINCT FROM p_phase THEN
        RAISE EXCEPTION
          'Record source table % does not match phase %',
          v_record->>'source_table',
          p_phase;
      END IF;

      v_source_id := (v_record->>'source_id')::UUID;
      v_entity_type := NULLIF(btrim(v_record->>'entity_type'), '');
      v_binding_column := NULLIF(btrim(v_record->>'binding_column'), '');
      v_name := NULLIF(btrim(v_record->>'name'), '');
      v_slug := NULLIF(btrim(v_record->>'slug'), '');
      v_description := NULLIF(btrim(v_record->>'description'), '');
      v_status := NULLIF(btrim(v_record->>'status'), '');

      IF v_name IS NULL THEN
        RAISE EXCEPTION 'Source % in phase % has no entity name',
          v_source_id, p_phase;
      END IF;

      IF v_status NOT IN ('draft', 'pending_review', 'active', 'archived') THEN
        RAISE EXCEPTION 'Source % has unsupported entity status %',
          v_source_id, v_status;
      END IF;

      CASE p_phase
        WHEN 'materials' THEN
          IF v_entity_type <> 'material'
             OR v_binding_column <> 'material_id' THEN
            RAISE EXCEPTION 'Invalid material entity mapping';
          END IF;
          SELECT EXISTS (
            SELECT 1 FROM public.materials WHERE id = v_source_id
          ) INTO v_source_exists;
          SELECT entity_id INTO v_entity_id
          FROM public.entity_canonical_bindings
          WHERE material_id = v_source_id;
        WHEN 'articles' THEN
          IF v_entity_type <> 'article'
             OR v_binding_column <> 'article_id'
             OR v_slug IS NULL THEN
            RAISE EXCEPTION 'Invalid article entity mapping';
          END IF;
          SELECT EXISTS (
            SELECT 1 FROM public.articles WHERE id = v_source_id
          ) INTO v_source_exists;
          SELECT entity_id INTO v_entity_id
          FROM public.entity_canonical_bindings
          WHERE article_id = v_source_id;
        WHEN 'guides' THEN
          IF v_entity_type <> 'guide'
             OR v_binding_column <> 'guide_id'
             OR v_slug IS NULL THEN
            RAISE EXCEPTION 'Invalid guide entity mapping';
          END IF;
          SELECT EXISTS (
            SELECT 1 FROM public.guides WHERE id = v_source_id
          ) INTO v_source_exists;
          SELECT entity_id INTO v_entity_id
          FROM public.entity_canonical_bindings
          WHERE guide_id = v_source_id;
        WHEN 'blog_posts' THEN
          IF v_entity_type <> 'blog_post'
             OR v_binding_column <> 'blog_post_id'
             OR v_slug IS NULL THEN
            RAISE EXCEPTION 'Invalid blog-post entity mapping';
          END IF;
          SELECT EXISTS (
            SELECT 1 FROM public.blog_posts WHERE id = v_source_id
          ) INTO v_source_exists;
          SELECT entity_id INTO v_entity_id
          FROM public.entity_canonical_bindings
          WHERE blog_post_id = v_source_id;
        WHEN 'sources' THEN
          IF v_entity_type <> 'source'
             OR v_binding_column <> 'source_id' THEN
            RAISE EXCEPTION 'Invalid source entity mapping';
          END IF;
          SELECT EXISTS (
            SELECT 1 FROM public.sources WHERE id = v_source_id
          ) INTO v_source_exists;
          SELECT entity_id INTO v_entity_id
          FROM public.entity_canonical_bindings
          WHERE source_id = v_source_id;
      END CASE;

      IF NOT v_source_exists THEN
        RAISE EXCEPTION 'Source % no longer exists in phase %',
          v_source_id, p_phase;
      END IF;

      IF v_slug IS NOT NULL AND EXISTS (
        SELECT 1
        FROM public.entities e
        WHERE e.entity_type = v_entity_type
          AND lower(e.slug) = lower(v_slug)
          AND (v_entity_id IS NULL OR e.id <> v_entity_id)
      ) THEN
        RAISE EXCEPTION
          'Entity slug conflict for type % and slug %',
          v_entity_type,
          v_slug;
      END IF;

      IF v_entity_id IS NULL THEN
        INSERT INTO public.entities (
          entity_type,
          name,
          slug,
          description,
          status,
          created_by
        )
        VALUES (
          v_entity_type,
          v_name,
          v_slug,
          v_description,
          v_status,
          v_started_by
        )
        RETURNING id INTO v_entity_id;

        CASE p_phase
          WHEN 'materials' THEN
            INSERT INTO public.entity_canonical_bindings (
              entity_id,
              material_id
            ) VALUES (v_entity_id, v_source_id);
          WHEN 'articles' THEN
            INSERT INTO public.entity_canonical_bindings (
              entity_id,
              article_id
            ) VALUES (v_entity_id, v_source_id);
          WHEN 'guides' THEN
            INSERT INTO public.entity_canonical_bindings (
              entity_id,
              guide_id
            ) VALUES (v_entity_id, v_source_id);
          WHEN 'blog_posts' THEN
            INSERT INTO public.entity_canonical_bindings (
              entity_id,
              blog_post_id
            ) VALUES (v_entity_id, v_source_id);
          WHEN 'sources' THEN
            INSERT INTO public.entity_canonical_bindings (
              entity_id,
              source_id
            ) VALUES (v_entity_id, v_source_id);
        END CASE;

        v_inserted := v_inserted + 1;
      ELSE
        IF NOT EXISTS (
          SELECT 1
          FROM public.entities
          WHERE id = v_entity_id
            AND entity_type = v_entity_type
        ) THEN
          RAISE EXCEPTION
            'Binding for source % references a missing or mismatched entity',
            v_source_id;
        END IF;

        UPDATE public.entities
        SET name = v_name,
            slug = v_slug,
            description = v_description,
            status = v_status
        WHERE id = v_entity_id
          AND (
            name IS DISTINCT FROM v_name
            OR slug IS DISTINCT FROM v_slug
            OR description IS DISTINCT FROM v_description
            OR status IS DISTINCT FROM v_status
          );

        GET DIAGNOSTICS v_row_count = ROW_COUNT;
        IF v_row_count = 1 THEN
          v_updated := v_updated + 1;
        ELSE
          v_reconciled := v_reconciled + 1;
        END IF;
      END IF;

      v_processed := v_processed + 1;
      v_entity_id := NULL;
    END LOOP;

    v_result := jsonb_build_object(
      'success', true,
      'phase', p_phase,
      'skipped_completed', false,
      'processed', v_processed,
      'inserted', v_inserted,
      'updated', v_updated,
      'reconciled', v_reconciled,
      'plan_checksum', p_plan_checksum
    );

    UPDATE public.graph_migration_checkpoints
    SET cursor = jsonb_build_object(
          'plan_checksum', p_plan_checksum,
          'completed_at', now()
        ),
        processed_count = v_processed,
        inserted_count = v_inserted,
        updated_count = v_updated,
        conflict_count = 0,
        unresolved_count = 0,
        status = 'completed',
        last_error = NULL
    WHERE run_id = p_run_id
      AND phase = p_phase;

    UPDATE public.graph_migration_runs
    SET report = report || jsonb_build_object(
          'phase_results',
          COALESCE(report->'phase_results', '{}'::jsonb)
            || jsonb_build_object(p_phase, v_result)
        ),
        error_message = NULL
    WHERE id = p_run_id;

    RETURN v_result;
  EXCEPTION
    WHEN OTHERS THEN
      v_error := SQLSTATE || ': ' || SQLERRM;

      UPDATE public.graph_migration_checkpoints
      SET cursor = jsonb_build_object('plan_checksum', p_plan_checksum),
          processed_count = 0,
          inserted_count = 0,
          updated_count = 0,
          conflict_count = 0,
          unresolved_count = 0,
          status = 'failed',
          last_error = v_error
      WHERE run_id = p_run_id
        AND phase = p_phase;

      UPDATE public.graph_migration_runs
      SET status = 'failed',
          error_message = v_error,
          report = report || jsonb_build_object(
            'failed_phase', p_phase,
            'failed_at', now()
          )
      WHERE id = p_run_id;

      RETURN jsonb_build_object(
        'success', false,
        'phase', p_phase,
        'error', v_error,
        'plan_checksum', p_plan_checksum
      );
  END;
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_graph_entity_backfill_run(
  p_run_id UUID,
  p_status TEXT,
  p_reconciliation JSONB,
  p_error_message TEXT DEFAULT NULL
)
RETURNS public.graph_migration_runs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_completed_phases INTEGER;
  v_run public.graph_migration_runs%ROWTYPE;
BEGIN
  IF p_status NOT IN ('completed', 'blocked', 'failed') THEN
    RAISE EXCEPTION 'Unsupported final entity-backfill status: %', p_status;
  END IF;

  SELECT *
  INTO v_run
  FROM public.graph_migration_runs
  WHERE id = p_run_id
  FOR UPDATE;

  IF NOT FOUND
     OR v_run.migration_version <> 'stage-6-entity-backfill-v1'
     OR v_run.mode <> 'apply' THEN
    RAISE EXCEPTION 'Run % is not an entity-backfill apply run', p_run_id;
  END IF;

  IF p_status = 'completed' THEN
    SELECT count(*)
    INTO v_completed_phases
    FROM public.graph_migration_checkpoints
    WHERE run_id = p_run_id
      AND phase IN (
        'materials',
        'articles',
        'guides',
        'blog_posts',
        'sources'
      )
      AND status = 'completed';

    IF v_completed_phases <> 5 THEN
      RAISE EXCEPTION
        'Run % has only % of 5 completed phases',
        p_run_id,
        v_completed_phases;
    END IF;
  END IF;

  UPDATE public.graph_migration_runs
  SET status = p_status,
      completed_at = CASE
        WHEN p_status IN ('completed', 'blocked', 'failed') THEN now()
        ELSE completed_at
      END,
      report = report || jsonb_build_object(
        'reconciliation',
        COALESCE(p_reconciliation, '{}'::jsonb)
      ),
      error_message = p_error_message
  WHERE id = p_run_id
  RETURNING * INTO v_run;

  RETURN v_run;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_graph_entity_backfill_phase(
  UUID,
  TEXT,
  JSONB,
  TEXT
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_graph_entity_backfill_phase(
  UUID,
  TEXT,
  JSONB,
  TEXT
) TO service_role;

REVOKE ALL ON FUNCTION public.finalize_graph_entity_backfill_run(
  UUID,
  TEXT,
  JSONB,
  TEXT
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_graph_entity_backfill_run(
  UUID,
  TEXT,
  JSONB,
  TEXT
) TO service_role;

COMMIT;
