# Entity Backfill Dry-Run Report

Execution date: June 22, 2026

Target: Supabase project `bdvfwjmaufjeqmxphmtv`

Edge Function: `make-server-17cae920`, version 277

## Implementation

The deployment added:

- an admin-only
  `POST /graph/migrations/entity-backfill/dry-run` endpoint
- a reusable, non-mutating entity mapping and reconciliation engine
- a typed application API contract
- a Stage 6 roadmap acceptance test

The endpoint does not create graph entities, canonical bindings, migration
runs, issues, checkpoints, outbox events, audit rows, or domain rows.

The active Edge Function passed its health check. An anonymous endpoint request
returned HTTP 401, confirming that the preview is not publicly callable.

## Production Preview

The reconciliation engine was executed twice against production with the same
source and graph state. Both runs produced this report checksum:

`a61a04f83dc09b5f98e68304e1edd5d39e8e7ca19b13408710f9c1dc352e8699`

The preview classified 228 canonical rows:

| Source table | Processed | Inserts | Updates | Reconciled | Conflicts | Unresolved |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `materials` | 213 | 213 | 0 | 0 | 0 | 0 |
| `articles` | 8 | 8 | 0 | 0 | 0 | 0 |
| `guides` | 7 | 7 | 0 | 0 | 0 | 0 |
| `blog_posts` | 0 | 0 | 0 | 0 | 0 | 0 |
| `sources` | 0 | 0 | 0 | 0 | 0 | 0 |
| **Total** | **228** | **228** | **0** | **0** | **0** | **0** |

Prospective apply writes:

- 228 entity inserts
- 228 canonical-binding inserts
- 0 entity updates
- 456 total writes

The report found zero blocking issues and zero orphan bindings.

## Non-Mutation Evidence

Before and after each preview:

- `entities`: 0 rows
- `entity_canonical_bindings`: 0 rows
- entities checksum:
  `4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945`
- bindings checksum:
  `4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945`

The retained operator-only report is:

`entity-backfill-dry-run-2026-06-22T17-34-34-676Z.json`

It is stored outside the repository under
`/private/tmp/wastedb-stage6-reports` with mode `0600`.

## Decision

The current canonical dataset is eligible for apply-tool implementation: the
preview is deterministic, counts reconcile, and no source rows require manual
resolution.

This report does not authorize apply. The next implementation must add:

- persisted migration runs and immutable issue payloads
- transactional entity and binding writes
- checkpoints and resume behavior
- repeated-apply idempotency tests
- post-apply reconciliation and rollback limits
- explicit operator approval before production execution
