-- Add category column to guides table
ALTER TABLE guides
ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('composting', 'recycling', 'art', 'repair'));

-- Create index on category for efficient filtering
CREATE INDEX IF NOT EXISTS idx_guides_category ON guides(category);
