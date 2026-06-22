# Stage 6 Entity Backfill Runbook

This runbook covers preview, guarded apply tooling, resume, and reconciliation
for canonical entities. It does not authorize production execution.

Production evidence:
[June 22, 2026 Dry-Run Report](./KNOWLEDGE_GRAPH_ENTITY_BACKFILL_DRY_RUN_2026-06-22.md)

## Scope

The dry run maps:

- `materials` to `material` entities
- `articles` to `article` entities
- `guides` to `guide` entities
- `blog_posts` to `blog_post` entities
- `sources` to `source` entities

Each eventual entity receives one `entity_canonical_bindings` row. Domain tables
remain authoritative.

## Endpoint

An authenticated admin calls:

```text
POST /graph/migrations/entity-backfill/dry-run
```

Optional body:

```json
{
  "sample_limit": 25
}
```

The sample limit is clamped to 1-100. Counts, checksums, and blocking-issue
totals always cover the complete dataset; the limit affects examples only.

## Non-Mutation Contract

The endpoint reads domain rows, entities, and canonical bindings with the
service role. It does not write:

- entities or canonical bindings
- migration runs, checkpoints, or issues
- outbox events
- audit rows
- domain data

It reads graph entities and bindings again before returning. If their counts or
checksums changed during execution, the endpoint rejects the report.

## Classification

Every source row receives one classification:

| Classification | Meaning |
| --- | --- |
| `insert` | An entity and canonical binding can be created without a known collision. |
| `update` | A binding exists, but one or more mapped entity fields differ. |
| `reconciled` | The binding and mapped fields already match. |
| `conflict` | Automatic apply could attach or overwrite the wrong graph entity. |
| `unresolved` | Required source data or a supported status mapping is missing. |

Blocking issues are conflicts, unresolved rows, and orphan canonical bindings.
`ready_to_apply` is true only when their combined count is zero.

## Compatibility Rules

- `published` maps to graph status `active`.
- `draft`, `pending_review`, and `archived` retain their meaning.
- Source entities are active.
- Empty optional material slugs become null.
- Article, guide, and blog-post slugs are required.
- Slug collision checks are case-insensitive within each entity type.
- Source entity descriptions remain null during the initial backfill. Authors,
  year, DOI, and URL remain authoritative in `sources`.

## Review Procedure

1. Confirm the production schema-version 4.0 backup remains retained.
2. Run the admin dry-run endpoint.
3. Save the complete JSON report outside the repository.
4. Record its report checksum and source-table checksums.
5. Review all conflicts and unresolved rows.
6. Repeat the dry run without source changes and confirm the report checksum is
   unchanged.
7. Confirm apply functions, issue persistence, checkpoints, resume, and
   rollback behavior pass their separate tests.

## Guarded Apply Tooling

Migration `20260622000000_create_entity_backfill_apply_functions.sql` adds:

- a service-role-only transactional phase function
- one checkpoint per canonical source table
- phase-level rollback with a persisted failed checkpoint
- safe completed-phase skipping when plan checksums match
- run finalization that requires all five completed phases
- a partial unique index preventing concurrent active entity-backfill runs

The Edge Function adds admin-only apply, resume, capability, and run-detail
endpoints. Apply and resume are unavailable unless the server environment
contains:

```text
GRAPH_MIGRATION_APPLY_ENABLED=true
```

The normal production value is absent or false. Enabling the flag is a
separately approved migration-window action.

Apply additionally requires:

- exact confirmation text returned by the capability endpoint
- the reviewed dry-run report checksum
- a schema-version 4.0 recovery artifact SHA-256 and location
- a fresh dry run with no blocking issues

Each phase writes entities and canonical bindings in one database transaction.
A failed phase rolls back its graph writes, marks its checkpoint and run failed,
and can later be resumed. Resume verifies that every source and mapped-plan
checksum still matches the original reviewed report.

After all phases, the system runs the preview again. Completion requires every
canonical row to classify as reconciled, with no inserts, updates, conflicts,
unresolved rows, prospective writes, or orphan bindings.

## Stop Conditions

Do not proceed to apply when:

- `GRAPH_MIGRATION_APPLY_ENABLED` is not explicitly enabled for an approved
  window
- the endpoint reports a graph mutation or concurrent graph snapshot change
- any conflict, unresolved row, or orphan binding remains
- a repeated dry run changes without an explained source change
- source counts do not reconcile with processed classifications
- prospective entity and binding insert counts differ
- the schema-version 4.0 recovery artifact is unavailable
- the transactional apply pgTAP suite or capability-gate test fails
