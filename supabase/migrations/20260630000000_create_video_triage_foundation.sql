-- Stage 7: additive video intake, triage, and editorial-lead foundation.
--
-- Safety contract:
-- - This migration imports no playlist or video data.
-- - Provider facts and original CSV rows remain immutable.
-- - Suggested topics never become reviewed topics automatically.
-- - No public graph reads or video publication are enabled.
-- - Import records are archived or superseded rather than destructively
--   cleaned up.

BEGIN;

CREATE TABLE IF NOT EXISTS public.video_import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'youtube' CHECK (provider = 'youtube'),
  source_playlist_id TEXT NOT NULL,
  source_playlist_title TEXT,
  preview_contract_version TEXT NOT NULL,
  source_preview_checksum TEXT NOT NULL CHECK (
    source_preview_checksum ~ '^[0-9a-f]{64}$'
  ),
  worksheet_checksum TEXT NOT NULL CHECK (
    worksheet_checksum ~ '^[0-9a-f]{64}$'
  ),
  source_filename TEXT,
  row_count INTEGER NOT NULL CHECK (row_count >= 0),
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (
    status IN (
      'uploaded',
      'validating',
      'needs_review',
      'ready',
      'applying',
      'completed',
      'failed',
      'archived'
    )
  ),
  validation_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL REFERENCES public.user_profiles(id)
    ON DELETE RESTRICT,
  reviewed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  apply_started_at TIMESTAMPTZ,
  apply_completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, source_playlist_id, worksheet_checksum),
  CONSTRAINT video_import_batch_review_metadata CHECK (
    reviewed_at IS NULL OR reviewed_by IS NOT NULL
  ),
  CONSTRAINT video_import_batch_apply_timestamps CHECK (
    apply_completed_at IS NULL OR apply_started_at IS NOT NULL
  )
);

CREATE TABLE IF NOT EXISTS public.video_import_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.video_import_batches(id)
    ON DELETE RESTRICT,
  source_row_number INTEGER NOT NULL CHECK (source_row_number > 0),
  candidate_key TEXT NOT NULL,
  provider_video_id TEXT,
  provider_url TEXT,
  playlist_positions INTEGER[] NOT NULL,
  title TEXT,
  description TEXT,
  channel_name TEXT,
  duration_seconds INTEGER CHECK (
    duration_seconds IS NULL OR duration_seconds >= 0
  ),
  provider_classification TEXT NOT NULL CHECK (
    provider_classification IN (
      'new',
      'existing',
      'private',
      'deleted',
      'unavailable',
      'malformed'
    )
  ),
  privacy_status TEXT,
  embeddable BOOLEAN,
  external_playback_only BOOLEAN GENERATED ALWAYS AS (
    embeddable IS FALSE
  ) STORED,
  provider_issues TEXT[] NOT NULL DEFAULT '{}'::text[],
  suggested_topic_tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  disposition TEXT CHECK (
    disposition IS NULL
    OR disposition IN (
      'material_video',
      'editorial_lead',
      'both',
      'ignore'
    )
  ),
  material_identifiers TEXT[] NOT NULL DEFAULT '{}'::text[],
  reviewed_topic_tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  editorial_targets TEXT[] NOT NULL DEFAULT '{}'::text[] CHECK (
    editorial_targets <@ ARRAY['article', 'blog_post', 'guide']::text[]
  ),
  review_notes TEXT,
  review_status TEXT NOT NULL DEFAULT 'unreviewed' CHECK (
    review_status IN ('unreviewed', 'reviewed', 'blocked')
  ),
  original_payload JSONB NOT NULL,
  created_by UUID NOT NULL REFERENCES public.user_profiles(id)
    ON DELETE RESTRICT,
  reviewed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  video_id UUID REFERENCES public.videos(id) ON DELETE RESTRICT,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (batch_id, source_row_number),
  UNIQUE (batch_id, candidate_key),
  CONSTRAINT video_import_item_positions_present CHECK (
    cardinality(playlist_positions) > 0
    AND 0 < ALL (playlist_positions)
  ),
  CONSTRAINT video_import_item_review_metadata CHECK (
    review_status <> 'reviewed'
    OR (
      disposition IS NOT NULL
      AND reviewed_by IS NOT NULL
      AND reviewed_at IS NOT NULL
    )
  ),
  CONSTRAINT video_import_item_unavailable_disposition CHECK (
    disposition IS NULL
    OR provider_classification IN ('new', 'existing')
    OR disposition = 'ignore'
  ),
  CONSTRAINT video_import_item_apply_metadata CHECK (
    video_id IS NULL OR applied_at IS NOT NULL
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS video_import_items_batch_provider_video_uidx
  ON public.video_import_items(batch_id, provider_video_id)
  WHERE provider_video_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS video_import_items_batch_status_idx
  ON public.video_import_items(batch_id, review_status);
CREATE INDEX IF NOT EXISTS video_import_items_disposition_idx
  ON public.video_import_items(disposition)
  WHERE disposition IS NOT NULL;
CREATE INDEX IF NOT EXISTS video_import_items_video_idx
  ON public.video_import_items(video_id)
  WHERE video_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.editorial_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_import_item_id UUID NOT NULL UNIQUE
    REFERENCES public.video_import_items(id) ON DELETE RESTRICT,
  source_video_id UUID REFERENCES public.videos(id) ON DELETE SET NULL,
  source_url TEXT,
  provider_video_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  channel_name TEXT,
  rationale TEXT,
  target_types TEXT[] NOT NULL DEFAULT '{}'::text[] CHECK (
    target_types <@ ARRAY['article', 'blog_post', 'guide']::text[]
  ),
  suggested_material_identifiers TEXT[] NOT NULL DEFAULT '{}'::text[],
  suggested_topic_tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  status TEXT NOT NULL DEFAULT 'candidate' CHECK (
    status IN (
      'candidate',
      'needs_review',
      'planned',
      'converted',
      'dismissed'
    )
  ),
  assigned_to UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES public.user_profiles(id)
    ON DELETE RESTRICT,
  reviewed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  converted_entity_id UUID REFERENCES public.entities(id) ON DELETE RESTRICT,
  original_payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT editorial_lead_review_metadata CHECK (
    reviewed_at IS NULL OR reviewed_by IS NOT NULL
  ),
  CONSTRAINT editorial_lead_conversion CHECK (
    (status = 'converted' AND converted_entity_id IS NOT NULL)
    OR (status <> 'converted' AND converted_entity_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS editorial_leads_status_idx
  ON public.editorial_leads(status);
CREATE INDEX IF NOT EXISTS editorial_leads_assigned_to_idx
  ON public.editorial_leads(assigned_to)
  WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS editorial_leads_converted_entity_idx
  ON public.editorial_leads(converted_entity_id)
  WHERE converted_entity_id IS NOT NULL;

CREATE OR REPLACE FUNCTION private.preserve_video_import_batch_source()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF ROW(
    NEW.provider,
    NEW.source_playlist_id,
    NEW.source_playlist_title,
    NEW.preview_contract_version,
    NEW.source_preview_checksum,
    NEW.worksheet_checksum,
    NEW.source_filename,
    NEW.row_count,
    NEW.created_by,
    NEW.created_at
  ) IS DISTINCT FROM ROW(
    OLD.provider,
    OLD.source_playlist_id,
    OLD.source_playlist_title,
    OLD.preview_contract_version,
    OLD.source_preview_checksum,
    OLD.worksheet_checksum,
    OLD.source_filename,
    OLD.row_count,
    OLD.created_by,
    OLD.created_at
  ) THEN
    RAISE EXCEPTION 'video_import_batches source provenance is immutable';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.preserve_video_import_item_source()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF ROW(
    NEW.batch_id,
    NEW.source_row_number,
    NEW.candidate_key,
    NEW.provider_video_id,
    NEW.provider_url,
    NEW.playlist_positions,
    NEW.title,
    NEW.description,
    NEW.channel_name,
    NEW.duration_seconds,
    NEW.provider_classification,
    NEW.privacy_status,
    NEW.embeddable,
    NEW.provider_issues,
    NEW.suggested_topic_tags,
    NEW.original_payload,
    NEW.created_by,
    NEW.created_at
  ) IS DISTINCT FROM ROW(
    OLD.batch_id,
    OLD.source_row_number,
    OLD.candidate_key,
    OLD.provider_video_id,
    OLD.provider_url,
    OLD.playlist_positions,
    OLD.title,
    OLD.description,
    OLD.channel_name,
    OLD.duration_seconds,
    OLD.provider_classification,
    OLD.privacy_status,
    OLD.embeddable,
    OLD.provider_issues,
    OLD.suggested_topic_tags,
    OLD.original_payload,
    OLD.created_by,
    OLD.created_at
  ) THEN
    RAISE EXCEPTION 'video_import_items source provenance is immutable';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.preserve_editorial_lead_source()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF ROW(
    NEW.source_import_item_id,
    NEW.source_url,
    NEW.provider_video_id,
    NEW.title,
    NEW.description,
    NEW.channel_name,
    NEW.original_payload,
    NEW.created_by,
    NEW.created_at
  ) IS DISTINCT FROM ROW(
    OLD.source_import_item_id,
    OLD.source_url,
    OLD.provider_video_id,
    OLD.title,
    OLD.description,
    OLD.channel_name,
    OLD.original_payload,
    OLD.created_by,
    OLD.created_at
  ) THEN
    RAISE EXCEPTION 'editorial_leads source provenance is immutable';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.set_graph_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS video_import_batch_source_immutable
  ON public.video_import_batches;
CREATE TRIGGER video_import_batch_source_immutable
  BEFORE UPDATE ON public.video_import_batches
  FOR EACH ROW EXECUTE FUNCTION private.preserve_video_import_batch_source();

DROP TRIGGER IF EXISTS video_import_item_source_immutable
  ON public.video_import_items;
CREATE TRIGGER video_import_item_source_immutable
  BEFORE UPDATE ON public.video_import_items
  FOR EACH ROW EXECUTE FUNCTION private.preserve_video_import_item_source();

DROP TRIGGER IF EXISTS editorial_lead_source_immutable
  ON public.editorial_leads;
CREATE TRIGGER editorial_lead_source_immutable
  BEFORE UPDATE ON public.editorial_leads
  FOR EACH ROW EXECUTE FUNCTION private.preserve_editorial_lead_source();

DROP TRIGGER IF EXISTS video_import_batches_touch_updated_at
  ON public.video_import_batches;
CREATE TRIGGER video_import_batches_touch_updated_at
  BEFORE UPDATE ON public.video_import_batches
  FOR EACH ROW EXECUTE FUNCTION private.set_graph_updated_at();

DROP TRIGGER IF EXISTS video_import_items_touch_updated_at
  ON public.video_import_items;
CREATE TRIGGER video_import_items_touch_updated_at
  BEFORE UPDATE ON public.video_import_items
  FOR EACH ROW EXECUTE FUNCTION private.set_graph_updated_at();

DROP TRIGGER IF EXISTS editorial_leads_touch_updated_at
  ON public.editorial_leads;
CREATE TRIGGER editorial_leads_touch_updated_at
  BEFORE UPDATE ON public.editorial_leads
  FOR EACH ROW EXECUTE FUNCTION private.set_graph_updated_at();

ALTER TABLE public.video_import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_import_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editorial_leads ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'video_import_batches',
    'video_import_items',
    'editorial_leads'
  ]
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS "video_curation_staff_read" ON public.%I',
      table_name
    );
    EXECUTE format(
      'CREATE POLICY "video_curation_staff_read" ON public.%I
       FOR SELECT TO authenticated
       USING ((SELECT private.is_staff_or_admin()))',
      table_name
    );
    EXECUTE format(
      'DROP POLICY IF EXISTS "video_curation_staff_insert" ON public.%I',
      table_name
    );
    EXECUTE format(
      'CREATE POLICY "video_curation_staff_insert" ON public.%I
       FOR INSERT TO authenticated
       WITH CHECK ((SELECT private.is_staff_or_admin()))',
      table_name
    );
    EXECUTE format(
      'DROP POLICY IF EXISTS "video_curation_staff_update" ON public.%I',
      table_name
    );
    EXECUTE format(
      'CREATE POLICY "video_curation_staff_update" ON public.%I
       FOR UPDATE TO authenticated
       USING ((SELECT private.is_staff_or_admin()))
       WITH CHECK ((SELECT private.is_staff_or_admin()))',
      table_name
    );
    EXECUTE format(
      'DROP POLICY IF EXISTS "video_curation_service_role_all" ON public.%I',
      table_name
    );
    EXECUTE format(
      'CREATE POLICY "video_curation_service_role_all" ON public.%I
       FOR ALL TO service_role USING (true) WITH CHECK (true)',
      table_name
    );
  END LOOP;
END
$$;

COMMIT;
