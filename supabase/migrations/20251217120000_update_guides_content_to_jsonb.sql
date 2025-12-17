-- Migration: Update guides table to use JSONB for structured content
-- This enables rich text editor support with nested sections, tips, warnings, etc.

-- Step 1: Add new JSONB column
ALTER TABLE guides
ADD COLUMN content_json JSONB;

-- Step 2: Migrate existing TEXT content to JSONB (wrap in simple paragraph structure)
-- For existing guides with markdown content, we'll preserve it in a basic Tiptap format
UPDATE guides
SET content_json = jsonb_build_object(
  'type', 'doc',
  'content', jsonb_build_array(
    jsonb_build_object(
      'type', 'paragraph',
      'content', jsonb_build_array(
        jsonb_build_object(
          'type', 'text',
          'text', content
        )
      )
    )
  )
)
WHERE content IS NOT NULL AND content != '';

-- Step 3: Set default for new guides (empty Tiptap document)
UPDATE guides
SET content_json = jsonb_build_object(
  'type', 'doc',
  'content', jsonb_build_array()
)
WHERE content_json IS NULL;

-- Step 4: Drop old TEXT column
ALTER TABLE guides
DROP COLUMN content;

-- Step 5: Rename JSONB column to content
ALTER TABLE guides
RENAME COLUMN content_json TO content;

-- Step 6: Add NOT NULL constraint
ALTER TABLE guides
ALTER COLUMN content SET NOT NULL;

-- Step 7: Set default value for new records
ALTER TABLE guides
ALTER COLUMN content SET DEFAULT '{"type": "doc", "content": []}'::jsonb;

-- Step 8: Add check constraint to ensure valid Tiptap structure
ALTER TABLE guides
ADD CONSTRAINT guides_content_valid_structure
CHECK (
  content ? 'type' AND
  content ? 'content' AND
  content->>'type' = 'doc' AND
  jsonb_typeof(content->'content') = 'array'
);

-- Add comment explaining the structure
COMMENT ON COLUMN guides.content IS 'Tiptap JSON content structure with type=doc and content array of nodes (sections, tips, warnings, paragraphs, etc.)';
