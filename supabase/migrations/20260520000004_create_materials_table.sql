-- Step 3: Create materials table
-- Mirrors the Material interface in src/types/material.ts
-- All columns are nullable to allow partial data from the existing KV store.
-- legacy_kv_id bridges old string IDs (e.g. "1766171968045mo810ba66") during cutover.
-- No FK constraints yet — added in Step 10+ to keep this purely additive.

CREATE TABLE IF NOT EXISTS materials (
  -- Core identification
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_kv_id          TEXT UNIQUE,                  -- migration bridge: old KV key ID
  name                  TEXT NOT NULL,
  slug                  TEXT UNIQUE,                  -- URL-safe identifier
  aliases               TEXT[],

  -- Category (references material_categories but no FK yet — added later)
  category_id           TEXT,                         -- slug e.g. "paper-cardboard"

  description           TEXT,
  is_hub                BOOLEAN NOT NULL DEFAULT FALSE,
  linked_material_ids   TEXT[],                       -- legacy KV IDs of related hub materials

  -- Public-facing sustainability scores (0–100 integer scale)
  compostability        SMALLINT CHECK (compostability BETWEEN 0 AND 100),
  recyclability         SMALLINT CHECK (recyclability BETWEEN 0 AND 100),
  reusability           SMALLINT CHECK (reusability BETWEEN 0 AND 100),

  -- ========== RECYCLABILITY (CR-v1) — normalized 0-1 ==========
  y_value               NUMERIC(6,4),   -- Yield
  d_value               NUMERIC(6,4),   -- Degradability
  c_value               NUMERIC(6,4),   -- Contamination tolerance
  m_value               NUMERIC(6,4),   -- Maturity (shared across dimensions)
  e_value               NUMERIC(6,4),   -- Energy demand

  cr_practical_mean     NUMERIC(6,4),
  cr_theoretical_mean   NUMERIC(6,4),
  cr_practical_ci95     JSONB,          -- {lower: number, upper: number}
  cr_theoretical_ci95   JSONB,

  -- ========== COMPOSTABILITY (CC-v1) — normalized 0-1 ==========
  b_value               NUMERIC(6,4),   -- Biodegradation rate constant
  n_value               NUMERIC(6,4),   -- Nutrient balance
  t_value               NUMERIC(6,4),   -- Toxicity / Residue index
  h_value               NUMERIC(6,4),   -- Habitat adaptability

  cc_practical_mean     NUMERIC(6,4),
  cc_theoretical_mean   NUMERIC(6,4),
  cc_practical_ci95     JSONB,
  cc_theoretical_ci95   JSONB,

  -- ========== REUSABILITY (RU-v1) — normalized 0-1 ==========
  l_value               NUMERIC(6,4),   -- Lifetime
  r_value               NUMERIC(6,4),   -- Repairability
  u_value               NUMERIC(6,4),   -- Upgradability
  c_ru_value            NUMERIC(6,4),   -- Contamination susceptibility

  ru_practical_mean     NUMERIC(6,4),
  ru_theoretical_mean   NUMERIC(6,4),
  ru_practical_ci95     JSONB,
  ru_theoretical_ci95   JSONB,

  -- Data quality and provenance
  confidence_level      TEXT CHECK (confidence_level IN ('High', 'Medium', 'Low')),

  -- Versioning and audit trail
  whitepaper_version    TEXT,
  calculation_timestamp TIMESTAMPTZ,
  method_version        TEXT,

  -- Wikimedia enrichment (entire wiki block as JSONB)
  wiki                  JSONB,

  -- Publication status
  status                TEXT NOT NULL DEFAULT 'published'
                          CHECK (status IN ('draft', 'published', 'archived')),

  -- Attribution (user IDs — no FK constraint yet)
  created_by            UUID,           -- references user_profiles(id) — FK added in Step 10
  edited_by             UUID,
  writer_name           TEXT,
  editor_name           TEXT,

  -- Timestamps
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on row changes
CREATE TRIGGER materials_updated_at
  BEFORE UPDATE ON materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS materials_category_id_idx ON materials (category_id);
CREATE INDEX IF NOT EXISTS materials_status_idx ON materials (status);
CREATE INDEX IF NOT EXISTS materials_created_by_idx ON materials (created_by);
CREATE INDEX IF NOT EXISTS materials_legacy_kv_id_idx ON materials (legacy_kv_id);

-- ========== Row Level Security ==========
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- Public: read published materials
CREATE POLICY "materials_public_read"
  ON materials FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- Staff/Admin: read all (including drafts and archived)
CREATE POLICY "materials_staff_read_all"
  ON materials FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('staff', 'admin')
    )
  );

-- Staff/Admin: insert
CREATE POLICY "materials_staff_insert"
  ON materials FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('staff', 'admin')
    )
  );

-- Staff/Admin: update
CREATE POLICY "materials_staff_update"
  ON materials FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('staff', 'admin')
    )
  );

-- Staff/Admin: delete (soft delete via status preferred, but allow hard delete)
CREATE POLICY "materials_staff_delete"
  ON materials FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('staff', 'admin')
    )
  );

-- Service role: full access (bypasses RLS)
CREATE POLICY "materials_service_role_all"
  ON materials FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
