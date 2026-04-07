-- Create changelog_entries table
CREATE TABLE IF NOT EXISTS changelog_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date DATE NOT NULL UNIQUE,
  items TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_changelog_entries_entry_date ON changelog_entries(entry_date DESC);
CREATE INDEX idx_changelog_entries_created_at ON changelog_entries(created_at DESC);

-- Create updated_at trigger
CREATE TRIGGER update_changelog_entries_updated_at
  BEFORE UPDATE ON changelog_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE changelog_entries ENABLE ROW LEVEL SECURITY;

-- Anyone can view changelog entries
CREATE POLICY "Public changelog entries are viewable by everyone"
  ON changelog_entries FOR SELECT
  USING (true);