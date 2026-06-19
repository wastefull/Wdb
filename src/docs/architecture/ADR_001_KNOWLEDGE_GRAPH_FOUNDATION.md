# ADR 001: Knowledge Graph Foundation

- Status: Accepted for Stage 6 implementation
- Date: June 18, 2026
- Scope: Graph schema, canonical bindings, vocabularies, RLS, migration
  recovery, compatibility writes, and backup formats

## Context

WasteDB needs an additive graph layer without weakening the relational
integrity of its authoritative domain tables. The current application uses
Postgres RLS, service-role Edge Functions, schema-version 3.0 full-site
backups, legacy merge recovery, and explicit preservation of unresolved
payloads.

The graph must support both domain-backed entities, such as materials and
articles, and graph-native entities, such as processes, policies, products,
impacts, organizations, technologies, and remediation strategies.

## Decisions

### 1. Use explicit foreign keys in a canonical-binding table

Do not use `canonical_table` plus `canonical_id`. Postgres cannot enforce that
such a polymorphic pair points to a real row.

Keep graph identity in `entities` and add
`entity_canonical_bindings` for domain-backed entities. The binding table will
contain one nullable foreign key per supported authoritative table:

- `material_id`
- `article_id`
- `guide_id`
- `blog_post_id`
- `source_id`
- `video_id`

Each binding has exactly one non-null domain reference. `entity_id` is the
primary key, and every domain reference is independently unique. Graph-native
entities have no binding row.

This design adds columns when a new authoritative domain type is introduced,
but that explicit migration is preferable to silent referential-integrity
loss.

### 2. Use governed lookup tables, not Postgres enums, for graph vocabularies

Use lookup tables for:

- entity types
- relationship types
- tag types
- content roles
- lifecycle focuses
- evidence uses

Graph vocabularies are expected to evolve through curation. Supabase recommends
enums only for small, fixed sets that are unlikely to change, and notes that
removing enum values is unsafe. Stable implementation states may continue to
use text checks where the existing schema already follows that convention.

Reference:
[Managing Enums in Postgres](https://supabase.com/docs/guides/database/postgres/enums)

### 3. Match existing RLS behavior and optimize policy helpers

All graph tables in the exposed `public` schema must enable RLS.

Initial policy model:

- active, reviewed graph data is publicly readable
- authenticated contributors may create permitted draft/proposed records
- owners may update their own unreviewed records where applicable
- staff and admins may review and mutate governed graph data
- service-role operations remain server-only

Create role-check helpers in a non-exposed `private` schema as
`security definer` functions with a fixed `search_path`. RLS policies should
call stable helpers through `select`, and policy filter columns must be
indexed. Service keys must never reach browser code.

Reference:
[Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)

### 4. Preserve unresolved records in migration issue tables

Create:

- `graph_migration_runs`
- `graph_migration_checkpoints`
- `graph_migration_issues`

Every issue stores:

- migration version and run ID
- source table and source identifier
- issue category and reason
- original payload as JSONB
- candidate matches and diagnostic metadata
- resolution status
- resolver, resolution timestamp, and resolution notes

The original payload is immutable. A skipped or unresolved row never counts as
success. Manual corrections create resolution metadata and are safe to rerun.

### 5. Avoid application-layer double writes

Domain tables remain authoritative. Do not issue two unrelated client or Edge
Function writes and call that dual-write compatibility.

For deterministic mirrors, use idempotent database functions or triggers that
upsert entity and binding rows in the same transaction as the domain write.
For work that cannot complete synchronously, write an event to a
`graph_sync_outbox` table in that same transaction. Workers claim events with
checkpoints and idempotency keys.

Supabase Queues or Cron may later process outbox work, but the correctness of
the migration must not depend on an optional platform integration. The
portable Postgres outbox remains the source of truth.

References:

- [Supabase Queues](https://supabase.com/docs/guides/queues)
- [Supabase Cron](https://supabase.com/docs/guides/cron)

### 6. Introduce full-site backup schema version 4.0

Schema version 3.0 remains the pre-graph full-site format.

Schema version 4.0 adds:

- graph vocabulary tables
- entities and canonical bindings
- relationships, tags, and content mappings
- videos
- migration runs, checkpoints, issues, and sync outbox records

Compatibility contract:

- the validator recognizes both 3.0 and 4.0
- 3.0 recovery restores domain data, then reruns the idempotent graph backfill
- 4.0 recovery restores domain tables before graph tables and reconciles both
- legacy backup version 1.1 remains merge-only compatibility input
- automatic destructive relational restore remains unsupported
- credentials, sessions, secrets, and storage binaries retain their documented
  manual/provider recovery requirements

### 7. Adopt selected Supabase/Postgres capabilities conservatively

Use:

- `pgTAP` for schema, constraint, function, and RLS tests
- `pg_jsonschema` when structured relationship metadata needs enforceable JSON
  shape validation
- built-in full-text search and normal indexes before adding specialized search
  infrastructure

Defer:

- `pgvector` until Stage 8 demonstrates a semantic-search requirement
- Database Webhooks for migration correctness
- Queues and Cron as required infrastructure

The Free plan currently uses Nano compute with up to 0.5 GB memory and a
recommended 500 MB database size. Backfills must therefore be bounded,
checkpointed, resumable, and tested with conservative batch sizes.
Migration preconditions must confirm each optional extension is available and
enabled in the target project rather than assuming plan-wide availability.

References:

- [pgTAP](https://supabase.com/docs/guides/database/extensions/pgtap)
- [pg_jsonschema](https://supabase.com/docs/guides/database/extensions/pg_jsonschema)
- [Compute and Disk](https://supabase.com/docs/guides/platform/compute-and-disk)
- [Supabase billing and Free-plan quotas](https://supabase.com/docs/guides/platform/billing-on-supabase)

## Consequences

- Domain integrity is enforced by real foreign keys.
- Graph-native entities remain possible without fake canonical records.
- Adding a new domain-backed entity type requires a reviewed schema migration.
- Vocabularies can evolve through governed data changes.
- Graph synchronization remains observable and recoverable.
- Backup consumers must be updated before graph tables are deployed.
- Stage 6 migration SQL must include pgTAP coverage and reconciliation queries.

## Implementation Order

1. Update backup export and validation for schema 4.0 compatibility.
2. Add vocabulary, entity, video, migration-support, and outbox tables.
3. Add canonical bindings, relationships, tags, and content mappings.
4. Add RLS policies and pgTAP tests.
5. Implement dry-run and idempotent backfill tooling.
6. Reconcile before enabling any graph read or compatibility-write path.
