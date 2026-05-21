-- Step 7: Create material_links junction table
-- Stores hub→spoke relationships between materials (linkedMaterialIds on Material interface).
-- Both sides use legacy KV string IDs during migration; UUID FKs added in Step 10.

CREATE TABLE IF NOT EXISTS material_links (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Hub material (the one with isHub=true)
  legacy_hub_kv_id            TEXT NOT NULL,

  -- Linked (spoke) material
  legacy_linked_kv_id         TEXT NOT NULL,

  -- Timestamps
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- No duplicate links
  UNIQUE (legacy_hub_kv_id, legacy_linked_kv_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS material_links_hub_idx ON material_links (legacy_hub_kv_id);
CREATE INDEX IF NOT EXISTS material_links_linked_idx ON material_links (legacy_linked_kv_id);

-- ========== Row Level Security ==========
ALTER TABLE material_links ENABLE ROW LEVEL SECURITY;

-- Public: read all
CREATE POLICY "material_links_public_read"
  ON material_links FOR SELECT
  TO anon, authenticated
  USING (true);

-- Staff/Admin: insert
CREATE POLICY "material_links_staff_insert"
  ON material_links FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('staff', 'admin')
    )
  );

-- Staff/Admin: update
CREATE POLICY "material_links_staff_update"
  ON material_links FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('staff', 'admin')
    )
  );

-- Staff/Admin: delete
CREATE POLICY "material_links_staff_delete"
  ON material_links FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('staff', 'admin')
    )
  );

-- Service role: full access
CREATE POLICY "material_links_service_role_all"
  ON material_links FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
