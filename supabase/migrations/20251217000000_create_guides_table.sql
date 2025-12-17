-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create guides table
CREATE TABLE IF NOT EXISTS guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  content TEXT NOT NULL, -- Markdown content
  method TEXT NOT NULL CHECK (method IN ('DIY', 'Industrial', 'Experimental')),
  material_id TEXT, -- Store material ID as text (references KV store, not DB)
  material_name TEXT, -- Denormalized
  
  -- Media
  cover_image_url TEXT,
  images TEXT[], -- Array of image URLs
  
  -- Metadata
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  estimated_time TEXT,
  required_materials TEXT[],
  tags TEXT[],
  
  -- Author & Publishing
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT, -- Denormalized
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'pending_review', 'archived')),
  
  -- Moderation (for future approval workflow)
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  -- Engagement
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  
  -- SEO
  meta_description TEXT,
  meta_keywords TEXT[]
);

-- Create indexes
CREATE INDEX idx_guides_status ON guides(status);
CREATE INDEX idx_guides_method ON guides(method);
CREATE INDEX idx_guides_material_id ON guides(material_id);
CREATE INDEX idx_guides_created_by ON guides(created_by);
CREATE INDEX idx_guides_slug ON guides(slug);
CREATE INDEX idx_guides_created_at ON guides(created_at DESC);
CREATE INDEX idx_guides_published_at ON guides(published_at DESC) WHERE status = 'published';

-- Create updated_at trigger
CREATE TRIGGER update_guides_updated_at
  BEFORE UPDATE ON guides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;

-- Anyone can view published guides
CREATE POLICY "Public guides are viewable by everyone"
  ON guides FOR SELECT
  USING (status = 'published');

-- Authenticated users can view their own guides (any status)
CREATE POLICY "Users can view their own guides"
  ON guides FOR SELECT
  USING (auth.uid() = created_by);

-- Authenticated users can create guides
CREATE POLICY "Authenticated users can create guides"
  ON guides FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Users can update their own guides
CREATE POLICY "Users can update their own guides"
  ON guides FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Users can delete their own guides
CREATE POLICY "Users can delete their own guides"
  ON guides FOR DELETE
  USING (auth.uid() = created_by);

-- Admins can do anything (for future moderation)
-- Note: This assumes a user_roles table exists with role = 'admin'
-- Uncomment when ready to implement admin approval workflow
-- CREATE POLICY "Admins can manage all guides"
--   ON guides FOR ALL
--   USING (
--     EXISTS (
--       SELECT 1 FROM user_roles
--       WHERE user_id = auth.uid() AND role = 'admin'
--     )
--   );

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_guide_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-generate slug on insert if not provided
CREATE OR REPLACE FUNCTION set_guide_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_guide_slug(NEW.title);
    
    -- Ensure uniqueness by appending a number if needed
    WHILE EXISTS (SELECT 1 FROM guides WHERE slug = NEW.slug AND id != NEW.id) LOOP
      NEW.slug := NEW.slug || '-' || floor(random() * 1000)::text;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER guides_set_slug
  BEFORE INSERT OR UPDATE OF title ON guides
  FOR EACH ROW
  EXECUTE FUNCTION set_guide_slug();
