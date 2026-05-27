-- Backfill audit_log rows from kv_store_17cae920 audit:* entries.
--
-- Why:
-- - If /admin/audit/seed-from-kv was never run after migration, the Postgres
--   audit_log table can be empty even though legacy KV audit data exists.
--
-- Safety:
-- - Idempotent via ON CONFLICT (id) DO NOTHING
-- - Accepts both camelCase and snake_case KV shapes

INSERT INTO public.audit_log (
  id,
  timestamp,
  user_id,
  user_email,
  entity_type,
  entity_id,
  action,
  before,
  after,
  changes,
  ip_address,
  user_agent
)
SELECT
  COALESCE(NULLIF(value->>'id', ''), key) AS id,
  COALESCE(
    CASE
      WHEN NULLIF(value->>'timestamp', '') ~ '^\d{4}-\d{2}-\d{2}T'
      THEN (value->>'timestamp')::timestamptz
      ELSE NULL
    END,
    CASE
      WHEN NULLIF(value->>'created_at', '') ~ '^\d{4}-\d{2}-\d{2}T'
      THEN (value->>'created_at')::timestamptz
      ELSE NULL
    END,
    NOW()
  ) AS timestamp,
  NULLIF(COALESCE(value->>'userId', value->>'user_id'), '') AS user_id,
  NULLIF(COALESCE(value->>'userEmail', value->>'user_email'), '') AS user_email,
  NULLIF(COALESCE(value->>'entityType', value->>'entity_type'), '') AS entity_type,
  NULLIF(COALESCE(value->>'entityId', value->>'entity_id'), '') AS entity_id,
  NULLIF(value->>'action', '') AS action,
  value->'before' AS before,
  value->'after' AS after,
  COALESCE(value->'changes', '[]'::jsonb) AS changes,
  NULLIF(COALESCE(value->>'ipAddress', value->>'ip_address'), '') AS ip_address,
  NULLIF(COALESCE(value->>'userAgent', value->>'user_agent'), '') AS user_agent
FROM kv_store_17cae920
WHERE key LIKE 'audit:%'
  AND value IS NOT NULL
  AND NULLIF(COALESCE(value->>'id', key), '') IS NOT NULL
  AND NULLIF(value->>'action', '') IS NOT NULL
ON CONFLICT (id) DO NOTHING;
