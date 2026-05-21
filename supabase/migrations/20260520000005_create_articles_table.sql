-- Step 4: Create articles table
-- Mirrors the Article interface in src/types/article.ts.
-- Articles belong to a material and cover one sustainability_category.
-- No FK to materials yet (material_id stored as TEXT legacy KV id) — FK added in Step 10.
-- content is stored as JSONB (Tiptap JSON), not TEXT.

CREATE TABLE IF NOT EXISTS articles (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Owning material (legacy KV string ID during migration; UUID FK added in Step 10)
  legacy_material_kv_id   TEXT NOT NULL,

  title                   TEXT NOT NULL,
  slug                    TEXT NOT NULL,

  -- Uniqueness: one slug per material
  UNIQUE (legacy_material_kv_id, slug),

  -- Classification
  sustainability_category TEXT NOT NULL
                            CHECK (sustainability_category IN ('compostability', 'recyclability', 'reusability')),
  article_type            TEXT NOT NULL
                            CHECK (article_type IN ('DIY', 'Industrial', 'Experimental')),

  -- Rich text body (Tiptap JSON)
  content                 JSONB,

  -- Optional hero image
  cover_image_url         TEXT,

  -- Publication state
  status                  TEXT NOT NULL DEFAULT 'published'
                            CHECK (status IN ('draft', 'published', 'archived')),

  -- Version counter (incremented on each edit)
  version                 INTEGER NOT NULL DEFAULT 1,

  -- Attribution (user UUIDs — no FK constraint until Step 10)
  created_by              UUID,
  edited_by               UUID,
  writer_name             TEXT,
  editor_name             TEXT,

  -- Legacy field from KV era (ISO string stored alongside created_at)
  date_added              TEXT,

  -- Timestamps
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on row changes
CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS articles_legacy_material_kv_id_idx ON articles (legacy_material_kv_id);
CREATE INDEX IF NOT EXISTS articles_sustainability_category_idx ON articles (sustainability_category);
CREATE INDEX IF NOT EXISTS articles_status_idx ON articles (status);
CREATE INDEX IF NOT EXISTS articles_created_by_idx ON articles (created_by);

-- ========== Row Level Security ==========
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Public: read published articles
CREATE POLICY "articles_public_read"
  ON articles FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- Staff/Admin: read all (including drafts and archived)
CREATE POLICY "articles_staff_read_all"
  ON articles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('staff', 'admin')
    )
  );

-- Staff/Admin: insert
CREATE POLICY "articles_staff_insert"
  ON articles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('staff', 'admin')
    )
  );

-- Staff/Admin: update
CREATE POLICY "articles_staff_update"
  ON articles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('staff', 'admin')
    )
  );

-- Staff/Admin: delete
CREATE POLICY "articles_staff_delete"
  ON articles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('staff', 'admin')
    )
  );

-- Service role: full access (bypasses RLS)
CREATE POLICY "articles_service_role_all"
  ON articles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
