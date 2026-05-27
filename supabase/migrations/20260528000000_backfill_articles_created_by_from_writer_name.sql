-- Backfill articles.created_by from the KV store article-level author_id field.
--
-- Root cause: the initial KV → Postgres seed (20260520000010) populated
-- articles.created_by from art->>'created_by', but KV articles use the field
-- name 'author_id', not 'created_by'. Most articles therefore had created_by
-- seeded as NULL. Profile contribution queries (WHERE created_by = userId)
-- therefore returned 0 rows for real authors such as Kaden and Vimala.
--
-- Fix: for each KV article, read COALESCE(author_id, created_by) and update
-- the matching Postgres row (matched by legacy_material_kv_id + slug +
-- sustainability_category). Run one UPDATE per category to avoid JSONB || NULL
-- issues.
--
-- Safe to re-run: only touches rows where the KV source has a valid UUID.

DO $$
DECLARE
  cat text;
BEGIN
  FOREACH cat IN ARRAY ARRAY['compostability', 'recyclability', 'reusability']
  LOOP
    UPDATE articles a
    SET created_by = (
      COALESCE(art->>'author_id', art->>'created_by')
    )::uuid
    FROM kv_store_17cae920 kv,
         jsonb_array_elements(kv.value->'articles'->cat) AS art
    WHERE kv.key LIKE 'material:%'
      AND kv.value->>'id' = a.legacy_material_kv_id
      AND a.sustainability_category = cat
      -- match by stored slug, or title-derived slug (same logic as seed migration)
      AND COALESCE(
            NULLIF(art->>'slug', ''),
            lower(regexp_replace(COALESCE(art->>'title', 'untitled'), '[^a-z0-9]+', '-', 'gi'))
          ) = a.slug
      -- only update when source has a valid UUID in author_id or created_by
      AND COALESCE(art->>'author_id', art->>'created_by') ~
            '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  END LOOP;
END;
$$;
