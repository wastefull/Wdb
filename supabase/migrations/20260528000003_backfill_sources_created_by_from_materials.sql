-- Backfill sources.created_by from linked materials when attribution is
-- unambiguous.
--
-- Why:
-- - During KV -> Postgres migration, sources are deduplicated globally and often
--   land with created_by NULL.
-- - This does not currently break public reads, but it is missing provenance
--   metadata and can affect ownership/admin tooling later.
--
-- Safety:
-- - Only fills sources.created_by when exactly one distinct non-null material
--   creator is linked to that source.
-- - Leaves ambiguous (multi-creator) sources untouched.
-- - Idempotent: updates only rows with created_by IS NULL.

WITH candidate_creator AS (
  SELECT
    ms.source_id,
    (ARRAY_AGG(DISTINCT m.created_by))[1] AS created_by,
    COUNT(DISTINCT m.created_by) AS creator_count
  FROM material_sources ms
  JOIN materials m
    ON m.legacy_kv_id = ms.legacy_material_kv_id
  WHERE m.created_by IS NOT NULL
  GROUP BY ms.source_id
  HAVING COUNT(DISTINCT m.created_by) = 1
)
UPDATE sources s
SET created_by = c.created_by
FROM candidate_creator c
WHERE s.id = c.source_id
  AND s.created_by IS NULL;
