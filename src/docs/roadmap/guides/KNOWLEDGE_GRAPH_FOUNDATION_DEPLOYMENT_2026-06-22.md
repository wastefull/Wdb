# Knowledge Graph Foundation Deployment Report

Deployment date: June 22, 2026

Target: Supabase project `bdvfwjmaufjeqmxphmtv`

## Scope

The production deployment applied:

- `20260618000000_ensure_legacy_kv_store.sql`
- `20260619000000_create_knowledge_graph_foundation.sql`

The deployment was additive. It did not run a graph backfill, enable graph
reads, enable graph writes, alter authoritative domain data, or remove legacy
storage.

Edge Function version 275, deployed on June 19, 2026, supplied the
schema-version 3.0 and 4.0 backup contract before the database migration.

## Pre-Migration Gate

The final dry run contained only the two reviewed migrations listed above.

A schema-version 3.0 full-site backup was created during a paused application
window and validated with no issues:

- filename:
  `wastedb-bdvfwjmaufjeqmxphmtv-schema-v30-2026-06-22T17-06-17-585Z.json`
- location class: operator-only temporary storage outside the repository
- permissions: `0600`
- size: 17,709,251 bytes
- SHA-256:
  `8eb1b8c41259b971e6a9450156d474b841cb38736d58364988f130cf1b9e5363`
- records: 2,465 KV, 1,590 Postgres, and 8 Auth metadata records; 4,063
  total

The maintenance pause ran from `2026-06-22T17:06:18.028Z` through
`2026-06-22T17:06:24.370Z`, and the prior disabled state was restored.

A provider-level storage backup was not required for these migrations because
they did not read, write, rename, or remove storage objects or buckets.

## Migration Result

Both migrations committed successfully in order. The legacy KV prerequisite
recognized the existing compatibility table, and the foundation migration
created the governed graph schema, evidence linkage columns, indexes, triggers,
and RLS policies.

Production migration history records both versions as applied.

## Post-Migration Reconciliation

A schema-version 4.0 full-site backup was created and validated with no issues:

- filename:
  `wastedb-bdvfwjmaufjeqmxphmtv-schema-v40-2026-06-22T17-08-16-073Z.json`
- location class: operator-only temporary storage outside the repository
- permissions: `0600`
- size: 17,728,639 bytes
- SHA-256:
  `dfdbae5027d46fcc90b99a11be4a4cb63cdc80d7886757b53491a4a58cb17990`
- records: 2,465 KV, 1,651 Postgres, and 8 Auth metadata records; 4,124
  total

All 12 authoritative domain tables retained identical row counts and
SHA-256 section checksums. Auth metadata also retained an identical checksum.

The only 61 new rows were approved governed-vocabulary seeds:

| Table | Rows |
| --- | ---: |
| `entity_types` | 13 |
| `relationship_types` | 14 |
| `tag_types` | 10 |
| `content_roles` | 8 |
| `lifecycle_focuses` | 10 |
| `evidence_uses` | 6 |

The following graph content and operation tables contained zero rows:

- `videos`
- `entities`
- `entity_canonical_bindings`
- `entity_relationships`
- `tags`
- `entity_tags`
- `content_entities`
- `graph_migration_runs`
- `graph_migration_checkpoints`
- `graph_migration_issues`
- `graph_sync_outbox`

## Verification

- Production database lint passed for the `public` and `private` schemas.
- The 64-assertion production pgTAP suite passed, including exact policy sets,
  RLS enablement, vocabulary governance, evidence linkage, and anonymous,
  contributor, staff/curator, admin, and service-role behavior.
- All four public Stage 6 roadmap checks passed: graph table access, governed
  vocabulary seeds, evidence linkage columns, and anonymous-write denial across
  eight knowledge-shaping surfaces.
- The Edge Function health check returned `ok`.
- Maintenance mode was disabled after verification.

The pgTAP file now selects the `postgres` role and the `extensions` search path
inside its rollback transaction. This makes linked-project execution portable
without changing persistent production grants.

## Retention and Next Step

The two JSON backups and validation reports remain outside the repository with
operator-only permissions. They must be moved to approved archival storage or
securely removed after the Stage 6 retention window.

The non-mutating dry-run and reconciliation contract for the first entity
backfill was completed after this foundation deployment. Its implementation
guide and production evidence are:
[Entity Backfill Dry Run](./KNOWLEDGE_GRAPH_ENTITY_BACKFILL_RUNBOOK.md).
The next slice is transactional apply, checkpoint, resume, issue persistence,
and post-apply reconciliation tooling. Graph reads, compatibility writes, and
destructive cleanup remain disabled.
