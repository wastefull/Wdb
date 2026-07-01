# Video Triage Review Queue Runbook

Use this runbook to deploy the Stage 7 private candidate-review increment. It
adds no public reads and cannot create videos, graph records, mappings, tags,
or editorial leads.

## Deployment Scope

- migration: `20260630020000_create_video_triage_review_function.sql`
- database function: `review_video_triage_item`
- Edge reads: private batch list and paginated candidate list
- Edge mutation: one transactional candidate-review update
- admin UI: `Private Video Triage`
- existing gate: `VIDEO_TRIAGE_PERSISTENCE_ENABLED`

## Preconditions

1. Confirm batch `ed633c3b-89c0-45f0-9456-f6a3d0af3c1f` still contains 371
   candidates and has status `needs_review`.
2. Confirm the post-staging schema-4.1 recovery artifact remains valid.
3. Confirm all graph/video pgTAP assertions, playlist fixtures, TypeScript,
   documentation checks, production build, and application-schema lint pass.
4. Establish a validated schema-4.1 baseline. A fresh backup is required when
   writes may have occurred. For a function-only deployment, an existing
   validated artifact may be reused when the sole operator explicitly confirms
   no intervening writes and live batch/content counts still reconcile.
5. Keep draft apply and graph reads disabled.

## Deploy and Reconcile

1. Deploy the Edge Function while the existing review gate remains available
   only to authenticated admins.
2. Apply only the review-function migration.
3. Confirm anonymous and ordinary authenticated callers cannot list or mutate
   private triage records or execute the database function directly.
4. Confirm the admin queue reports one batch and 371 candidates before any
   review test.
5. Review one low-risk fixture candidate, confirm its private fields and batch
   counts, then reopen it and require the original `needs_review` state.
6. Confirm all video, graph-content, mapping, tag, and editorial-lead counts are
   unchanged.
7. Export and validate a post-deployment schema-4.1 backup. Compare every
   section count and checksum with the approved baseline; explain restricted
   operational audit differences and require all domain, graph, and triage data
   sections to remain unchanged.

## Stop Conditions

Stop and preserve diagnostics if:

- a review update changes immutable provider facts
- an unavailable candidate accepts a disposition other than ignore
- a failed review leaves item and batch states inconsistent
- reopening a decision does not restore `needs_review`
- an untrusted role reads or changes private review records
- any review creates content or graph data
- backup, health, lint, or canonical reconciliation regresses
