-- Step 17: Migrate audit log from KV to Postgres
-- Replaces kv.getByPrefix("audit:") scan (hard-capped at 1000 entries)
-- with an unbounded, indexed, queryable Postgres table.
--
-- Field names are snake_case here; the edge function maps to/from
-- the existing camelCase AuditLogEntry interface transparently.

CREATE TABLE IF NOT EXISTS public.audit_log (
  id            TEXT        PRIMARY KEY,           -- keeps "audit:timestamp:uuid" format
  timestamp     TIMESTAMPTZ NOT NULL,
  user_id       TEXT,
  user_email    TEXT,
  entity_type   TEXT,
  entity_id     TEXT,
  action        TEXT        NOT NULL,
  before        JSONB,
  after         JSONB,
  changes       JSONB       NOT NULL DEFAULT '[]'::JSONB,
  ip_address    TEXT,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for the filter/sort patterns used by GET /audit/logs
CREATE INDEX idx_audit_log_timestamp    ON public.audit_log (timestamp DESC);
CREATE INDEX idx_audit_log_entity_type  ON public.audit_log (entity_type);
CREATE INDEX idx_audit_log_entity_id    ON public.audit_log (entity_id);
CREATE INDEX idx_audit_log_action       ON public.audit_log (action);
CREATE INDEX idx_audit_log_user_id      ON public.audit_log (user_id);

-- RLS: all reads/writes go through the edge function with service role key,
-- so only the service role needs table access.  No public read.
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access" ON public.audit_log
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
