-- Step 6: Create material_sources junction table
-- Links materials to sources. Carries the per-material-source metadata
-- (weight and parameters) from the Source interface in src/types/material.ts,
-- which belong to the relationship rather than the source record itself.
-- Uses legacy KV IDs during migration; UUID FK added in Step 10.

CREATE TABLE IF NOT EXISTS material_sources (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Material reference (legacy KV string ID until Step 10)
  legacy_material_kv_id TEXT NOT NULL,

  -- Source reference (UUID — sources table already uses UUIDs)
  source_id             UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,

  -- Per-relationship metadata
  weight                NUMERIC(4,3) CHECK (weight BETWEEN 0 AND 1),  -- aggregation weight
  parameters            TEXT[],  -- which params this source contributed, e.g. ['Y_value','D_value']

  -- Timestamps
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One source per material (no duplicates)
  UNIQUE (legacy_material_kv_id, source_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS material_sources_legacy_material_kv_id_idx
  ON material_sources (legacy_material_kv_id);
CREATE INDEX IF NOT EXISTS material_sources_source_id_idx
  ON material_sources (source_id);

-- ========== Row Level Security ==========
ALTER TABLE material_sources ENABLE ROW LEVEL SECURITY;

-- Public: read all (citations are public)
CREATE POLICY "material_sources_public_read"
  ON material_sources FOR SELECT
  TO anon, authenticated
  USING (true);

-- Staff/Admin: insert
CREATE POLICY "material_sources_staff_insert"
  ON material_sources FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('staff', 'admin')
    )
  );

-- Staff/Admin: update
CREATE POLICY "material_sources_staff_update"
  ON material_sources FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('staff', 'admin')
    )
  );

-- Staff/Admin: delete
CREATE POLICY "material_sources_staff_delete"
  ON material_sources FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('staff', 'admin')
    )
  );

-- Service role: full access
CREATE POLICY "material_sources_service_role_all"
  ON material_sources FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
