-- Step 15: Create evidence_points table (MIU — Minimally Interpretable Units)
--
-- Design follows src/docs/MIU_SCHEMA_PLAN.md.
--
-- Key design decisions:
--   1. Fields required by the spec (snippet, source_ref, value_raw, units,
--      parameter, dimension, locator) are NOT NULL for new entries, but are
--      nullable for legacy KV-migrated entries (is_legacy = true).
--      The CONSTRAINT required_unless_legacy enforces this.
--   2. legacy_kv_raw JSONB preserves the original KV evidence object verbatim
--      so no data is ever discarded.
--   3. material_legacy_kv_id TEXT allows cross-referencing to the old KV string
--      ID even if the materials.id UUID lookup fails at seed time.
--   4. material_id references materials(id) ON DELETE CASCADE — when a material
--      is deleted, its evidence is also removed.
--   5. curator_id is nullable (evidence may have been entered before user
--      profiles existed in Postgres).
--
-- Parameter → dimension mapping:
--   CR (Recyclability): Y, D, C, M, E
--   CC (Compostability): B, N, T, H
--   RU (Reusability):   L, R, U, C_RU

CREATE TABLE IF NOT EXISTS public.evidence_points (
  -- Primary key
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Material linkage (at least one must be non-null; see constraint below)
  material_id             UUID REFERENCES public.materials(id) ON DELETE CASCADE,
  material_legacy_kv_id   TEXT,           -- KV string ID, preserved for backward compat

  -- Source linkage (nullable for legacy entries)
  source_ref              TEXT,            -- Library Source id
  source_type             TEXT,            -- 'peer_reviewed', 'government', 'industrial', 'ngo', 'internal', 'preprint'
  source_weight           NUMERIC,         -- Cached default weight from source at extraction time

  -- Parameter specification (nullable for legacy entries)
  parameter               TEXT,            -- Y, D, C, M, E, B, N, T, H, L, R, U, C_RU
  dimension               TEXT,            -- CR, CC, RU (derived from parameter)

  -- Value data (nullable for legacy entries)
  value_raw               NUMERIC,         -- Original value as extracted
  units                   TEXT,            -- e.g., '%', 'kg CO2e/kg', 'cycles', 'years'
  value_norm              NUMERIC,         -- Normalized to 0–1 (null for categorical/E parameter)
  transform_version       TEXT NOT NULL DEFAULT 'v1.0',

  -- Source locator (at least one required for non-legacy entries)
  page                    INTEGER,
  figure                  TEXT,
  table_ref               TEXT,
  paragraph               TEXT,

  -- Verbatim evidence (nullable for legacy entries)
  snippet                 TEXT,            -- Exact quote from source
  screenshot_url          TEXT,            -- Optional cropped image from PDF

  -- Context tags (for filtering during aggregation)
  process                 TEXT,            -- e.g., 'mechanical_recycling', 'industrial_composting'
  stream                  TEXT,            -- e.g., 'post_consumer', 'post_industrial', 'mixed'
  region                  TEXT,            -- e.g., 'north_america', 'europe', 'global'
  scale                   TEXT,            -- e.g., 'laboratory', 'pilot', 'industrial'
  cycles                  INTEGER,         -- Reuse cycles (for RU)
  contamination_percent   NUMERIC,
  temperature_c           NUMERIC,         -- Temperature (for CC)
  time_minutes            NUMERIC,         -- Duration (for CC)

  -- Derived values
  is_derived              BOOLEAN NOT NULL DEFAULT false,
  derived_formula         TEXT,
  assumptions             TEXT,

  -- Quality metadata
  method_completeness     TEXT,            -- 'complete', 'partial', 'unclear'
  sample_size             INTEGER,
  confidence_notes        TEXT,

  -- Legal
  conflict_of_interest    TEXT,

  -- Evidence type
  evidence_type           TEXT DEFAULT 'positive',  -- 'positive', 'negative', 'limit', 'threshold'

  -- Restriction flags
  restricted_content      BOOLEAN NOT NULL DEFAULT false,

  -- Curation metadata
  curator_id              UUID,            -- references user_profiles(id) — no FK constraint yet
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  codebook_version        TEXT NOT NULL DEFAULT 'v0',

  -- Validation
  validation_status       TEXT DEFAULT 'pending',  -- 'pending', 'validated', 'flagged', 'duplicate'
  validated_by            UUID,
  validated_at            TIMESTAMPTZ,

  -- Audit
  extraction_session_id   TEXT,

  -- Legacy KV migration fields
  is_legacy               BOOLEAN NOT NULL DEFAULT false,
  legacy_kv_raw           JSONB,           -- Original KV evidence object (verbatim, for audit trail)

  -- ── Constraints ──────────────────────────────────────────────────────────

  -- At least one material reference is required
  CONSTRAINT material_ref_required
    CHECK (material_id IS NOT NULL OR material_legacy_kv_id IS NOT NULL),

  -- Parameter enum (null allowed for legacy entries)
  CONSTRAINT valid_parameter
    CHECK (parameter IS NULL OR parameter IN ('Y', 'D', 'C', 'M', 'E', 'B', 'N', 'T', 'H', 'L', 'R', 'U', 'C_RU')),

  -- Dimension enum (null allowed for legacy entries)
  CONSTRAINT valid_dimension
    CHECK (dimension IS NULL OR dimension IN ('CR', 'CC', 'RU')),

  -- Source type enum
  CONSTRAINT valid_source_type
    CHECK (source_type IS NULL OR source_type IN ('peer_reviewed', 'government', 'industrial', 'ngo', 'internal', 'preprint')),

  -- Method completeness enum
  CONSTRAINT valid_method
    CHECK (method_completeness IS NULL OR method_completeness IN ('complete', 'partial', 'unclear')),

  -- Validation status enum
  CONSTRAINT valid_validation
    CHECK (validation_status IS NULL OR validation_status IN ('pending', 'validated', 'flagged', 'duplicate')),

  -- Evidence type enum
  CONSTRAINT valid_evidence_type
    CHECK (evidence_type IS NULL OR evidence_type IN ('positive', 'negative', 'limit', 'threshold')),

  -- Non-legacy entries must satisfy all required fields + locator rule
  CONSTRAINT required_unless_legacy
    CHECK (
      is_legacy
      OR (
        snippet      IS NOT NULL
        AND source_ref   IS NOT NULL
        AND value_raw    IS NOT NULL
        AND units        IS NOT NULL
        AND parameter    IS NOT NULL
        AND dimension    IS NOT NULL
        AND (page IS NOT NULL OR figure IS NOT NULL OR table_ref IS NOT NULL OR paragraph IS NOT NULL)
      )
    ),

  -- Derived entries must have a formula
  CONSTRAINT derived_requires_formula
    CHECK (NOT is_derived OR derived_formula IS NOT NULL)
);

-- ── Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS ep_material_id
  ON public.evidence_points (material_id);

CREATE INDEX IF NOT EXISTS ep_material_kv_id
  ON public.evidence_points (material_legacy_kv_id);

CREATE INDEX IF NOT EXISTS ep_material_param
  ON public.evidence_points (material_id, parameter);

CREATE INDEX IF NOT EXISTS ep_source_ref
  ON public.evidence_points (source_ref);

CREATE INDEX IF NOT EXISTS ep_dimension
  ON public.evidence_points (dimension);

CREATE INDEX IF NOT EXISTS ep_curator
  ON public.evidence_points (curator_id);

CREATE INDEX IF NOT EXISTS ep_created
  ON public.evidence_points (created_at DESC);

CREATE INDEX IF NOT EXISTS ep_validation
  ON public.evidence_points (validation_status);

CREATE INDEX IF NOT EXISTS ep_is_legacy
  ON public.evidence_points (is_legacy);

-- Full-text search on snippet (partial — only non-null snippets)
CREATE INDEX IF NOT EXISTS ep_snippet_fts
  ON public.evidence_points
  USING gin(to_tsvector('english', snippet))
  WHERE snippet IS NOT NULL;

-- ── RLS ───────────────────────────────────────────────────────────────────

ALTER TABLE public.evidence_points ENABLE ROW LEVEL SECURITY;

-- Public can read all non-restricted evidence (science is transparent)
CREATE POLICY "Public can read non-restricted evidence"
  ON public.evidence_points FOR SELECT
  USING (NOT restricted_content);

-- Curators can insert their own evidence
CREATE POLICY "Authenticated users can insert evidence"
  ON public.evidence_points FOR INSERT
  TO authenticated
  WITH CHECK (curator_id = auth.uid());

-- Curators can update their own pending evidence
CREATE POLICY "Curators can update own pending evidence"
  ON public.evidence_points FOR UPDATE
  TO authenticated
  USING (curator_id = auth.uid() AND validation_status = 'pending')
  WITH CHECK (curator_id = auth.uid());

-- Service role full access (Edge Functions with service key)
CREATE POLICY "Service role has full access"
  ON public.evidence_points FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
