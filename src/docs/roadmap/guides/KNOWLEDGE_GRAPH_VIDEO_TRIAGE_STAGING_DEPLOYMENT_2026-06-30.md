# Video Triage Worksheet Staging Deployment Report

Deployment date: June 30, 2026

Target: Supabase project `bdvfwjmaufjeqmxphmtv`

Migration: `20260630010000_create_video_triage_staging_function.sql`

Edge Function: `make-server-17cae920`, version 288

## Recovery Artifact

Pre-deployment schema-4.1 backup:

- file: `wastedb-full-backup-2026-06-30-3.json`
- records: 4,658
- SHA-256:
  `e5ad3022fe247c4adcf68ffa227a3a168ba6ef3bca1d976820d1c20ea918a32c`
- export window: `2026-06-30T22:24:53.501Z` through
  `2026-06-30T22:24:57.884Z`
- 32 Postgres tables and 45 manifest sections represented
- all 45 manifest counts and checksums reconciled locally
- `video_import_batches`: 0 rows
- `video_import_items`: 0 rows
- `editorial_leads`: 0 rows

Maintenance mode began at `2026-06-30T22:24:45.568Z` and remained active
through deployment and reconciliation.

## Deployment Result

- The Edge Function was deployed through Supabase's server-side bundler because
  the local Docker bundler does not follow the repository's symlinked function
  directory. Gateway JWT verification remained enabled.
- Edge version 288 returned HTTP 200 from the health endpoint before database
  migration.
- The single pending migration applied successfully and local and remote
  histories now match through `20260630010000`.
- The production `public` and `private` schemas lint without errors.
- `stage_video_triage_worksheet` is executable only by the service role. A
  fully shaped anonymous PostgREST call is denied with SQLSTATE `42501`.
- The `VIDEO_TRIAGE_PERSISTENCE_ENABLED` server gate was enabled after schema,
  permission, count, and health reconciliation passed.
- Anonymous calls to the Edge staging route remain HTTP 401.
- Draft video apply and graph reads remain hard-coded disabled.

## Reconciliation Before First Staging

Production estimated counts remained:

- `video_import_batches`: 0
- `video_import_items`: 0
- `editorial_leads`: 0
- `videos`: 0
- video relationships, mappings, and tags: 0
- canonical entities: 228
- canonical bindings: 228

Local acceptance remains green: 145 graph/video pgTAP assertions, 19
playlist/worksheet fixtures, TypeScript, production build, documentation
checks, and application-schema lint.

## First-Worksheet Result

The operator ran a fresh 371-candidate preview and validated its worksheet with
zero errors or warnings. The first staging action returned:

- batch ID: `ed633c3b-89c0-45f0-9456-f6a3d0af3c1f`
- batch status: `needs_review`
- candidate rows: 371
- reviewed rows: 0
- available rows awaiting review: 366

Restaging the exact worksheet returned `created=false`, the same batch ID, the
same 371-row count, and the message `This exact worksheet is already staged.`
Production statistics then reconciled to one import batch and 371 import items.
Videos, editorial leads, relationships, mappings, and tags remained empty;
canonical entities and bindings remained 228 each. Production health returned
HTTP 200 and maintenance remained enabled.

## Post-Stage Recovery Artifact

Post-stage schema-4.1 backup:

- file: `wastedb-full-backup-2026-06-30-5.json`
- records: 5,033
- SHA-256:
  `3862d174acbb16daa5e8c40b8f328d2b2635e70884ef7bdd278c67092cec500c`
- export window: `2026-06-30T23:15:35.861Z` through
  `2026-06-30T23:15:39.295Z`
- all 45 manifest counts and checksums reconciled
- `video_import_batches`: 1
- `video_import_items`: 371
- `editorial_leads`: 0
- `videos`: 0
- entities and canonical bindings: 228 each
- relationships, mappings, and entity tags: 0

All 371 item rows have unique source row numbers from 2 through 372 and belong
to batch `ed633c3b-89c0-45f0-9456-f6a3d0af3c1f`. The classification split is
366 `new` and five `private`; all dispositions remain intentionally blank for
later review.

The 375-record increase from the pre-deployment artifact consists of 371 import
items, one import batch, and three restricted audit records. The audit delta is
explained by two full-backup export summaries and the batch-creation summary.
No domain or graph-content count changed.

The recovery and reconciliation gates are complete. Maintenance mode was
disabled and independently verified off at `2026-06-30T23:24:19Z`; the
production health endpoint returned HTTP 200 after handback.
