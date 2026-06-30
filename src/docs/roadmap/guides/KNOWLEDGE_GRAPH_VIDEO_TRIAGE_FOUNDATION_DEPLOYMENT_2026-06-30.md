# Video Triage Foundation Deployment Report

Deployment date: June 30, 2026

Target: Supabase project `bdvfwjmaufjeqmxphmtv`

Migration: `20260630000000_create_video_triage_foundation.sql`

Edge Function prerequisite: `make-server-17cae920`, version 287

## Recovery Artifacts

Pre-migration schema-4.0 backup:

- records: 4,655
- SHA-256:
  `ca7ed4b177507829ff938ab22d0c265ec38c46244a2cf32acacad68b8d2d677d`
- all manifest counts and checksums reconciled
- the operator confirmed no users or writes were active between export and the
  maintenance window

Maintenance mode was enabled at `2026-06-30T17:45:01.984Z` and remained active
through migration, reconciliation, and the post-migration export.
It was disabled after successful handback and independently verified off at
`2026-06-30T18:17:28Z`; the production health endpoint returned HTTP 200.

Post-migration schema-4.1 backup:

- records: 4,657
- SHA-256:
  `c3a5178b05cbcc0f7eb5b8c69bf1b41b7722aafbdc79efec2e0f58e6c57dea0b`
- 32 Postgres tables represented in the manifest
- all manifest counts and checksums reconciled
- `video_import_batches`: 0 rows
- `video_import_items`: 0 rows
- `editorial_leads`: 0 rows

The two-record difference is explained by one restricted audit-log record and
one operational KV record. No domain, graph, video, or triage row count changed.

## Migration Result

The single pending migration applied successfully in one transaction. It
created:

- private video import batch provenance
- immutable provider-candidate rows with separate editable review fields
- private editorial leads
- source-provenance immutability triggers
- updated-at triggers, constraints, and supporting indexes
- explicit staff/admin and service-role RLS policies without public or
  contributor access

The migration imported no playlist, video, entity, binding, mapping, tag, or
editorial-lead data.

## Reconciliation

- local and remote migration histories match through `20260630000000`
- production schema lint reports no errors
- all three private tables exist with zero estimated and manifest rows
- anonymous PostgREST reads return empty arrays for every private table
- existing videos remain at 0
- existing canonical entities remain at 228
- existing canonical bindings remain at 228
- the public Stage 7 baseline and pre-cutover contracts continue to pass
- all 128 local graph/triage pgTAP assertions and 14 worksheet fixture tests
  pass

## Scope Boundary

This deployment enables private persistence and recovery foundations only.
Worksheet staging, triage persistence endpoints, draft video apply, material
mappings, topic approval, editorial-lead conversion, and graph reads remain
disabled until their separate acceptance gates pass.
