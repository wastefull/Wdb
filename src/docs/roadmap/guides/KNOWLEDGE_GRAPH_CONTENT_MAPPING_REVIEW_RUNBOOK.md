# Knowledge Graph Content-Mapping Runbook

## Scope

This runbook covers both Stage 7 content-mapping paths:

- **Manual curation:** the normal admin workflow for creating one deliberate
  pending-review mapping. It does not use the bulk apply gate.
- **Bulk migration:** advanced preview, quarantine, and checksum-bound apply
  tooling for reconciling legacy records.

Neither path enables graph-powered reads or activates pending graph records.

## Manual Curation

Use **Content Management > Create Content Mapping** for normal curation. Choose
canonical content, a canonical material, and a governed role. Lifecycle focus
is optional. Evidence requires an explicit governed evidence use.

The service-role-only `create_manual_content_mapping` function atomically
creates the pending mapping, outbox event, and audit record. Exact duplicates
return the existing mapping. The authenticated Edge route remains admin-only,
and the database function is not executable by `anon` or `authenticated`.

### Manual Workflow Deployment

1. Apply `20260705000000_create_manual_content_mapping_function.sql`.
2. Run `supabase/tests/manual_content_mapping.test.sql` with the complete pgTAP
   suite.
3. Deploy the Edge Function and frontend.
4. Sign in as an admin and verify canonical options load.
5. Create a disposable pending-review fixture mapping, confirm one outbox and
   audit record, and reconcile the post-deployment backup.
6. Retain or archive the fixture only through a separately reviewed action; do
   not manually delete production graph rows as cleanup.

`CONTENT_MAPPING_APPLY_ENABLED` may remain false throughout manual deployment
and use.

### Reuse Reviewed Video Links

After video triage draft apply, run **Preview reviewed links** in Content
Management. It reads only reviewed `material_video` and `both` candidates that
have an applied video and canonical video binding. Material identifiers resolve
against canonical UUIDs, legacy IDs, slugs, or exact names.

The confirmed action creates missing `primary_subject` mappings with
`pending_review` status, writes one outbox event per new mapping, writes a
summary audit record, and skips existing mappings. Unresolved or ambiguous
identifiers are reported and never guessed. Apply
`20260705010000_create_reviewed_video_mapping_apply.sql` and run the complete
pgTAP suite before using this action in production.

Also apply `20260705020000_sync_material_canonical_bindings.sql`. It reconciles
materials created after the Stage 6 backfill and installs the compatibility
trigger that maintains canonical material identity on future material writes.
Without it, valid reviewed slugs may appear as unmatched because the material
row exists but its canonical binding does not.

Apply `20260705030000_normalize_reviewed_material_identifiers.sql` when triage
uses normalized names but admin-created materials retain UUID legacy IDs and
slugs. It resolves normalized names and aliases only when the match is unique.

## Bulk Migration Safety Contract

- Keep `CONTENT_MAPPING_APPLY_ENABLED=false` during migration deployment and
  verification.
- Enable maintenance mode and download a fresh full recovery artifact before
  applying the migration.
- Record the backup record count and SHA-256 in the deployment report.
- Apply `20260701000000_create_content_mapping_review_functions.sql` before the
  backend/frontend deployment.
- Run `supabase/tests/content_mapping_review.test.sql` and the Stage 7 browser
  acceptance suite before considering an apply window.
- A preview resolves identifiers but approves nothing. Only checked candidate
  keys may enter an apply manifest.
- Graph rows, outbox events, migration reconciliation, and audit summary must
  commit together or roll back together.

## Bulk Migration Deployment Sequence

1. Confirm no other operator is writing data and enable maintenance mode.
2. Download and record a fresh full backup and SHA-256.
3. Apply pending database migrations.
4. Run the knowledge-graph foundation and content-mapping pgTAP suites.
5. Deploy the backend and frontend with the apply gate still disabled.
6. Run the admin preview and verify deterministic counts and checksum.
7. Exercise quarantine only when unresolved candidates should be persisted.
8. Download a post-deployment full backup and reconcile counts/checksums.
9. Disable maintenance mode after verification.

## Bulk Approved Apply Window

Opening an apply window is a separate operator decision:

1. Start from a fresh preview and inspect the visible resolved candidates.
2. Select only candidates that have actually been reviewed.
3. Enable `CONTENT_MAPPING_APPLY_ENABLED=true` briefly.
4. Apply the selected manifest once and record its analysis checksum, manifest
   checksum, migration run ID, inserted/skipped counts, and outbox counts.
5. Re-run the preview and verify applied rows now report `already_mapped`.
6. Set `CONTENT_MAPPING_APPLY_ENABLED=false` immediately after the window.

Do not open the gate if review, backup, rollback, audit, or reconciliation
evidence is incomplete.

## Rollback

Do not manually delete graph rows during the deployment window. If the
transaction fails, PostgreSQL rolls back all graph, outbox, migration-run, and
audit writes. If a completed reviewed manifest must later be reversed, create a
separate approved compensating migration with explicit record IDs and backup
evidence.
