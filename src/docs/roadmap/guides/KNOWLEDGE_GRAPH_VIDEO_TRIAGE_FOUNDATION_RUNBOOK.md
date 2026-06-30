# Video Triage Foundation Runbook

Use this runbook to deploy the additive Stage 7 private triage schema. This
deployment creates no video, graph, playlist, triage, or editorial-lead rows.

Production evidence:
[June 30, 2026 Deployment Report](./KNOWLEDGE_GRAPH_VIDEO_TRIAGE_FOUNDATION_DEPLOYMENT_2026-06-30.md)

## Deployment Scope

- migration: `20260630000000_create_video_triage_foundation.sql`
- tables: `video_import_batches`, `video_import_items`, `editorial_leads`
- backup transition: schema 4.0 before migration, schema 4.1 after migration
- Edge prerequisite: `make-server-17cae920` version 287 or later

## Preconditions

1. Confirm the worktree contains only reviewed Stage 7 changes.
2. Confirm all 128 graph/triage pgTAP assertions, all playlist/worksheet tests,
   TypeScript, documentation checks, production build, and local database lint
   pass.
3. Pause application writes and record the pause start.
4. Export and validate a full-site schema-4.0 backup.
5. Store the backup outside the repository and record its SHA-256, path, row
   counts, and validation result.
6. Confirm Edge Function health and verify anonymous requests to backup and
   playlist endpoints return HTTP 401.

Stop if the pre-migration backup is absent, invalid, incomplete, or not
operator-readable.

## Apply

1. Review the linked migration list and confirm only the Stage 7 foundation
   migration is pending.
2. Apply the migration through the standard linked Supabase migration command.
3. Do not upload or stage a worksheet during this deployment window.
4. Do not enable draft apply, graph reads, or triage persistence endpoints.

## Reconciliation

Confirm:

- all three tables exist with RLS enabled
- anonymous and contributor reads return no rows and writes are denied
- staff can read, insert, and update but cannot delete preserved records
- service-role recovery access remains explicit
- all three new tables contain zero rows
- existing `videos`, video entities, and video bindings remain unchanged
- the 128-assertion database suite still passes
- production health and playlist preview remain available

## Post-Migration Backup

1. Export a second full-site backup.
2. Require schema version 4.1.
3. Confirm all three private tables appear in the manifest with row counts and
   checksums, even while empty.
4. Validate the backup and retain its checksum beside the pre-migration
   artifact.

## Stop Conditions

Stop and preserve diagnostics if:

- only some of the three tables exist
- backup export omits any private table or remains schema 4.0 after migration
- any new table contains unexpected rows
- any untrusted role can read or mutate private curation records
- provider facts or original payloads can be overwritten
- application health, playlist preview, or existing graph reconciliation
  regresses

Recovery is manual and additive: preserve the database state and both backup
artifacts, diagnose the failed gate, and use a separately reviewed migration
for any corrective or destructive action.
