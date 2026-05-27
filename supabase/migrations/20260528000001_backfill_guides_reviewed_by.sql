-- Backfill guide reviewer metadata for already-published guides.
--
-- Why this exists:
-- - Existing guides were auto-published but reviewed_by/reviewed_at were never set.
-- - This made reviewer counts appear as 0 even for production content.
--
-- Policy:
-- - For published guides with NULL reviewed_by, treat publication as self-review
--   by the guide creator (created_by) at published_at (fallback updated_at/created_at).
--
-- Safe to re-run: only updates rows where reviewed_by IS NULL.

UPDATE guides
SET
  reviewed_by = created_by,
  reviewed_at = COALESCE(published_at, updated_at, created_at, NOW())
WHERE status = 'published'
  AND reviewed_by IS NULL
  AND created_by IS NOT NULL;
