-- Step 5: Create sources table
-- Mirrors the Source interface in src/types/material.ts.
-- Sources are reusable citation records that can be linked to multiple materials
-- via the material_sources junction table (Step 6).

CREATE TABLE IF NOT EXISTS sources (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  title           TEXT NOT NULL,
  authors         TEXT,
  year            SMALLINT CHECK (year BETWEEN 1800 AND 2100),
  doi             TEXT,
  url             TEXT,

  -- PDF upload reference (filename in Supabase Storage)
  pdf_file_name   TEXT,

  -- Attribution
  created_by      UUID,   -- references user_profiles(id) — FK added in Step 10

  -- Timestamps
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on row changes
CREATE TRIGGER sources_updated_at
  BEFORE UPDATE ON sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS sources_doi_idx ON sources (doi) WHERE doi IS NOT NULL;
CREATE INDEX IF NOT EXISTS sources_created_by_idx ON sources (created_by);

-- ========== Row Level Security ==========
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;

-- Public: read all sources (citations are public information)
CREATE POLICY "sources_public_read"
  ON sources FOR SELECT
  TO anon, authenticated
  USING (true);

-- Staff/Admin: insert
CREATE POLICY "sources_staff_insert"
  ON sources FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('staff', 'admin')
    )
  );

-- Staff/Admin: update
CREATE POLICY "sources_staff_update"
  ON sources FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('staff', 'admin')
    )
  );

-- Staff/Admin: delete
CREATE POLICY "sources_staff_delete"
  ON sources FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('staff', 'admin')
    )
  );

-- Service role: full access
CREATE POLICY "sources_service_role_all"
  ON sources FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
