# Operations, Backup, Restore, and Audit

This document is the current operational recovery guide. Data preservation
takes priority over convenience.

## Backup Formats

### Full-site backup, schema version 3.0

Admin > Database > Materials > Full Site Backup calls
`GET /backup/full-export`.

The export contains:

- every current Postgres domain table
- Supabase Auth user metadata for identity and attribution reconciliation
- a raw snapshot of every KV key and original payload, including unknown
  namespaces
- categorized KV compatibility projections for legacy recovery tooling
- transform definitions
- a manifest with table names, row counts, SHA-256 checksums, schema version,
  and export timestamp

Both Postgres tables and the raw KV snapshot are fetched in deterministic,
paginated batches so the export does not silently stop at an API row limit.
Manifest keys are namespaced as `postgres.*` and `kv.*`; the raw snapshot is
recorded as `kv_all_entries`, and Auth metadata as `auth_users`.

The HTTP export is not a transactional database snapshot. Pause application
writes before creating the migration backup, keep them paused until export
validation completes, and record the pause window in the migration report.

Validate a downloaded full backup with `POST /backup/validate` before relying
on it.

### Legacy KV backup

`POST /backup/export`, `POST /backup/import`, and legacy validation remain
available for backward compatibility. Import supports merge mode only and does
not delete existing records.

Legacy import is not a full relational restore. Do not use it to restore a
schema-version 3.0 full-site backup. It accepts both historical `users` and
current `user_profiles` payloads. Restored `user_roles` are preserved in the
legacy KV namespace and then applied to Postgres with the idempotent admin
role-seed action. Unsupported or invalid records are returned as
`unresolved_records` for manual recovery, and the import is not marked complete
until that list is empty.

## Before Any Migration

1. Pause application writes and record the pause start.
2. Download a full-site backup.
3. Validate the backup and retain the validation result.
4. Record source row counts and migration version.
5. Run the migration in dry-run mode when available.
6. Resolve or explicitly quarantine ambiguous records.
7. Run the migration.
8. Reconcile row counts, identifiers, relationships, and checksums.
9. Keep legacy reads and backups until the completion gate is approved.

## Full-Site Manual Recovery

Automatic relational restore is intentionally disabled because table ordering,
foreign keys, identity records, and merge conflicts require review.

For manual recovery:

1. Preserve the original backup file unchanged.
2. Validate its checksums with `POST /backup/validate`.
3. Restore into a separate recovery project first.
4. Import Postgres tables in this order:
   `user_profiles`, `material_categories`, `materials`, `sources`, `articles`,
   `guides`, `blog_posts`, `changelog_entries`, `material_sources`,
   `material_links`, `evidence_points`, then `audit_log`.
5. Use upserts only where the primary-key and conflict policy have been
   reviewed. Never truncate production tables as part of recovery.
6. Reconcile `auth_users` with the recovery project's Auth users before
   restoring `user_profiles`. Preserve original user IDs wherever supported;
   never silently remap attribution.
7. Import raw `kv_all_entries` with reviewed key-aware tooling. Use categorized
   `kv_data` only for compatibility with the legacy merge importer.
8. Reconcile manifest counts and checksums.
9. Record conflicts and unresolved records in a recovery report; preserve their
   original JSON payloads.
10. Switch traffic only after acceptance tests and reconciliation pass.

If direct import is not possible, retain the record in a quarantine/review
dataset and document the manual mapping required. Silent omission is not an
acceptable recovery outcome.

## Audit Log Compatibility

Current audit list, detail, statistics, and filtering endpoints read from
Postgres `audit_log`. New migrations must preserve these response shapes where
possible. Migration summaries should create one audit event per operation,
not one notification email per migrated row.

Stage 9 will split revision history, restricted admin audit, and security
telemetry. Historical audit rows must remain accounted for and recoverable.

## Known Compatibility Limits

- Full-site JSON backups comprehensively cover application tables, raw KV, and
  Auth metadata, but require reviewed manual relational recovery.
- Auth user metadata is exported, but credentials, active sessions, and
  external-provider secrets cannot be restored from the JSON backup. Recreate
  or recover identities through supported Supabase procedures, then reconcile
  IDs before restoring attribution.
- Storage object binaries are not embedded in the JSON backup. Before any
  migration that could affect storage, create a separate provider-level storage
  backup and object inventory, verify it, and record its location in the
  migration report.
- Legacy KV import remains merge-only and cannot restore Postgres domain
  tables.
- Legacy role restore requires the reviewed admin role-seed action after import.
- Destructive restore and automatic replacement are intentionally unsupported.
