-- Create material_categories table
-- Formalizes the dynamic category system currently managed via KV blobs
-- inside material objects (category string + categoryId slug).
--
-- This table is purely additive. KV store is untouched.

CREATE TABLE IF NOT EXISTS material_categories (
  -- Stable slug PK, e.g. 'paper-cardboard', 'plastics'
  -- Matches the existing MaterialCategoryDef.id field in the TypeScript types
  id TEXT PRIMARY KEY,

  name       TEXT    NOT NULL,       -- Display name, e.g. 'Paper & Cardboard'
  aliases    TEXT[]  NOT NULL DEFAULT '{}', -- Previous display names for legacy matching
  deleted    BOOLEAN NOT NULL DEFAULT false, -- Soft delete; never hard-delete categories

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for active categories (most common query)
CREATE INDEX idx_material_categories_active ON material_categories(deleted) WHERE deleted = false;

-- Auto-update updated_at
CREATE TRIGGER update_material_categories_updated_at
  BEFORE UPDATE ON material_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE material_categories ENABLE ROW LEVEL SECURITY;

-- Public can read all non-deleted categories
CREATE POLICY "Public can read active categories"
  ON material_categories FOR SELECT
  USING (deleted = false);

-- Staff and admin can read deleted categories too (for admin panel)
CREATE POLICY "Staff can read all categories"
  ON material_categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles p
      WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin')
    )
  );

-- Only staff and admin can insert/update/delete
CREATE POLICY "Staff can manage categories"
  ON material_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles p
      WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles p
      WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin')
    )
  );

-- Service role bypass
CREATE POLICY "Service role has full access"
  ON material_categories FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Seed initial categories from the MATERIAL_CATEGORIES constant
-- (matches src/types/material.ts MATERIAL_CATEGORIES array)
-- ============================================================
INSERT INTO material_categories (id, name) VALUES
  ('plastics',                 'Plastics'),
  ('metals',                   'Metals'),
  ('glass',                    'Glass'),
  ('paper-cardboard',          'Paper & Cardboard'),
  ('fabrics-textiles',         'Fabrics & Textiles'),
  ('electronics-batteries',    'Electronics & Batteries'),
  ('building-materials',       'Building Materials'),
  ('organic-natural-waste',    'Organic/Natural Waste'),
  ('elements',                 'Elements')
ON CONFLICT (id) DO NOTHING;
