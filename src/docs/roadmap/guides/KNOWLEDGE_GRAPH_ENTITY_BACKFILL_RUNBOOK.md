# Stage 6 Entity Backfill Dry-Run Runbook

This runbook covers the preview and reconciliation contract for canonical
entities. It does not authorize an entity backfill apply operation.

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
7. Do not implement or run apply mode until issue resolution, persistence,
   checkpoint, resume, and rollback behavior have separate tests and approval.

## Stop Conditions

Do not proceed to apply when:

- the endpoint reports a graph mutation or concurrent graph snapshot change
- any conflict, unresolved row, or orphan binding remains
- a repeated dry run changes without an explained source change
- source counts do not reconcile with processed classifications
- prospective entity and binding insert counts differ
- the schema-version 4.0 recovery artifact is unavailable
