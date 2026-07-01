# Video Triage Review Queue Deployment Report

Deployment date: July 1, 2026

Target: Supabase project `bdvfwjmaufjeqmxphmtv`

Migration: `20260630020000_create_video_triage_review_function.sql`

Edge Function: `make-server-17cae920`, version 290

## Recovery Baseline

This was a function/API-only deployment that does not create videos, graph
records, mappings, tags, editorial leads, or public content. The operator
confirmed they were the sole active user and that no product data changed since
the validated post-staging recovery artifact. Under the proportional exception
documented in the runbook, that artifact was reused as the pre-deployment
baseline:

- file: `wastedb-full-backup-2026-06-30-5.json`
- records: 5,033
- SHA-256:
  `3862d174acbb16daa5e8c40b8f328d2b2635e70884ef7bdd278c67092cec500c`
- all 45 manifest counts and checksums previously reconciled
- `video_import_batches`: 1
- `video_import_items`: 371
- `editorial_leads`: 0
- `videos`: 0
- entities and canonical bindings: 228 each
- relationships, mappings, and entity tags: 0

Maintenance mode was not re-enabled for this narrow deployment. Post-deployment
backup comparison was still required, and any unexplained data difference would
have restored the fresh-backup and paused-writes requirement.

## Deployment Result

- The single pending migration applied successfully and local and remote
  histories now match through `20260630020000`.
- The Edge Function was deployed through Supabase's server-side bundler because
  the local Docker bundler does not follow the repository's symlinked function
  directory. Gateway JWT verification remained enabled.
- Edge version 290 returned HTTP 200 from the health endpoint.
- The production `public` and `private` schemas lint without errors.
- `review_video_triage_item` is executable only by the service role. A fully
  shaped anonymous PostgREST call is denied with SQLSTATE `42501`.
- Anonymous Edge calls to the private review batch route remain HTTP 401.
- Draft video apply and graph reads remain disabled.

## Reconciliation

Production estimated counts after deployment remained:

- `video_import_batches`: 1
- `video_import_items`: 371
- `editorial_leads`: 0
- `videos`: 0
- video relationships, mappings, and tags: 0
- canonical entities: 228
- canonical bindings: 228

The deployed review function can update private review metadata and aggregate
batch status, but it cannot create videos, entities, mappings, tags, editorial
leads, or public records.

Local acceptance remained green before deployment: 167 graph/video pgTAP
assertions, 19 playlist/worksheet fixtures, TypeScript, production build,
documentation checks, git whitespace checks, and application-schema lint.

## Post-Deployment Recovery Artifact

Post-deployment schema-4.1 backup:

- file: `wastedb-full-backup-2026-07-01.json`
- records: 5,034
- SHA-256:
  `ce1abd76002730c89906a72daa8c27034d3a0073ad5fb78a90f27ec54aa786c6`
- export window: `2026-07-01T16:41:16.303Z` through
  `2026-07-01T16:41:20.066Z`
- all 45 manifest counts and checksums reconciled
- `video_import_batches`: 1
- `video_import_items`: 371
- `editorial_leads`: 0
- `videos`: 0
- entities and canonical bindings: 228 each
- relationships, mappings, and entity tags: 0

Compared with the approved baseline, total backup records increased by one.
The only row-count delta is `postgres.audit_log`, from 1,387 to 1,388. The only
checksum deltas are `postgres.audit_log` and `kv_all_entries`; the KV aggregate
change is restricted to operational state: API rate-limit counters changed and
the prior maintenance-mode entry was absent after maintenance was disabled.

No domain, graph, video, triage, mapping, tag, entity, canonical-binding,
editorial-lead, or auth counts changed. The backend review queue deployment is
reconciled. Candidate dispositions remain active human-review work, and the
frontend review panel still requires the normal application deployment path
before operators can use it in production.
