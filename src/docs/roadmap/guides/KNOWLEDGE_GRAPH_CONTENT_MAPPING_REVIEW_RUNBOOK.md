# Knowledge Graph Content-Mapping Review Runbook

## Scope

This runbook deploys the Stage 7 transactional quarantine and reviewed apply
foundation. It does not enable graph-powered reads, activate pending graph
records, or turn on the apply gate automatically.

## Safety Contract

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

## Deployment Sequence

1. Confirm no other operator is writing data and enable maintenance mode.
2. Download and record a fresh full backup and SHA-256.
3. Apply pending database migrations.
4. Run the knowledge-graph foundation and content-mapping pgTAP suites.
5. Deploy the backend and frontend with the apply gate still disabled.
6. Run the admin preview and verify deterministic counts and checksum.
7. Exercise quarantine only when unresolved candidates should be persisted.
8. Download a post-deployment full backup and reconcile counts/checksums.
9. Disable maintenance mode after verification.

## Approved Apply Window

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
