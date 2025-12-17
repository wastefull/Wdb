-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL, -- Markdown content
  category TEXT NOT NULL CHECK (category IN ('News', 'Tutorial', 'Case Study', 'Research', 'Community', 'Product Update')),
  
  -- Media
  cover_image_url TEXT,
  images TEXT[], -- Array of image URLs
  
  -- Metadata
  tags TEXT[],
  reading_time_minutes INTEGER,
  
  -- Author & Publishing
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT, -- Denormalized
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  
  -- Engagement
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  
  -- SEO
  meta_description TEXT,
  meta_keywords TEXT[]
);

-- Create indexes
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_category ON blog_posts(category);
CREATE INDEX idx_blog_posts_created_by ON blog_posts(created_by);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_created_at ON blog_posts(created_at DESC);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at DESC) WHERE status = 'published';

-- Create updated_at trigger
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can view published posts
CREATE POLICY "Public blog posts are viewable by everyone"
  ON blog_posts FOR SELECT
  USING (status = 'published');

-- Authenticated users can view their own posts (any status)
CREATE POLICY "Users can view their own blog posts"
  ON blog_posts FOR SELECT
  USING (auth.uid() = created_by);

-- Authenticated users can create posts
CREATE POLICY "Authenticated users can create blog posts"
  ON blog_posts FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Users can update their own posts
CREATE POLICY "Users can update their own blog posts"
  ON blog_posts FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Users can delete their own posts
CREATE POLICY "Users can delete their own blog posts"
  ON blog_posts FOR DELETE
  USING (auth.uid() = created_by);

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_blog_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-generate slug on insert if not provided
CREATE OR REPLACE FUNCTION set_blog_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_blog_slug(NEW.title);
    
    -- Ensure uniqueness by appending a number if needed
    WHILE EXISTS (SELECT 1 FROM blog_posts WHERE slug = NEW.slug AND id != NEW.id) LOOP
      NEW.slug := NEW.slug || '-' || floor(random() * 1000)::text;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_posts_set_slug
  BEFORE INSERT OR UPDATE OF title ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION set_blog_slug();

-- Function to calculate reading time (simple: ~200 words per minute)
CREATE OR REPLACE FUNCTION calculate_reading_time()
RETURNS TRIGGER AS $$
BEGIN
  NEW.reading_time_minutes := GREATEST(1, CEIL(array_length(regexp_split_to_array(NEW.content, '\s+'), 1) / 200.0));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_posts_calculate_reading_time
  BEFORE INSERT OR UPDATE OF content ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION calculate_reading_time();
