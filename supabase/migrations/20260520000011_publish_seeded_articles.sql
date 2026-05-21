-- Step 9b: Publish all KV-seeded articles
-- The KV store had no draft/publish workflow — all articles were live.
-- The seeding migration preserved the KV `status` field (which stored "draft"
-- for all articles because the field was never meaningfully used).
-- This migration corrects that by publishing all currently-draft articles.
--
-- Safe to re-run: only affects draft rows, no-ops on already-published rows.

UPDATE articles
SET status = 'published', updated_at = NOW()
WHERE status = 'draft';
