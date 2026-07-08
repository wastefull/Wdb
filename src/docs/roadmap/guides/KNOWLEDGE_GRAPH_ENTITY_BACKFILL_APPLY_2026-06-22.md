# Entity Backfill Apply Report

Execution date: June 22, 2026

Supersession note (July 8, 2026): This report is preserved as historical
deployment evidence. Its recorded execution facts are unchanged. Future-stage
references in this file should be interpreted under the current roadmap:
general discovery read cutover now occurs in Stage 10.

Target: Supabase project `bdvfwjmaufjeqmxphmtv`

Run ID: `dffc4bac-968d-4782-9445-31ddc0741e92`

## Result

The operator-approved entity backfill completed successfully using the guarded,
transactional apply workflow:

- status: `completed`
- completed at: `2026-06-22T19:14:49.902881Z`
- canonical entities: 228
- canonical bindings: 228
- completed phase checkpoints: 5
- migration issues: 0
- error message: none

Post-apply reconciliation classified all 228 canonical rows as reconciled with:

- 0 inserts
- 0 updates
- 0 conflicts
- 0 unresolved rows
- 0 orphan bindings
- 0 prospective writes

The entity and binding counts match, and no unbound canonical entity remains.

## Scope Boundary

The apply populated canonical entities for materials, articles, and guides. It
did not populate:

- entity relationships
- tags or entity tags
- content-to-subject mappings
- videos
- sync-outbox events

Those are governed Stage 7 concerns. Graph-powered material reads remain
disabled until Stage 10.

The apply-window flag was temporary; normal production operation keeps entity
apply and resume disabled.

## Closeout Verification

Stage 6 closeout was reverified on June 29, 2026:

- all 88 graph-foundation and entity-apply pgTAP assertions passed
- all five public Stage 6 production contracts passed
- correction coverage preserves immutable original payloads and accepts an
  identical reviewed resolution idempotently
- Edge Function version 283 exposes the latest apply-run summary only to
  authenticated admins; an anonymous request returns HTTP 401
- production health returns HTTP 200 and maintenance mode remains disabled

The protected run summary backs the roadmap quarantine, correction, and
rollback-state checks without weakening migration-table RLS.
