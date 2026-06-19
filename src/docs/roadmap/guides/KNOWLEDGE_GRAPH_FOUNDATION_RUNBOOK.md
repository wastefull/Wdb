# Stage 6 Knowledge Graph Foundation Runbook

Use this runbook to validate and deploy the Stage 6 prerequisite and foundation
migrations:

- `20260618000000_ensure_legacy_kv_store.sql`
- `20260619000000_create_knowledge_graph_foundation.sql`

Both are additive: domain tables remain authoritative, no graph backfill runs,
and no read or write cutover occurs.

## Preconditions

Do not apply the migration until all of these conditions are recorded in the
migration report:

1. Pause application writes for the backup window.
2. Generate a full-site schema-version 3.0 backup and pass it through
   `POST /backup/validate`.
3. Verify row counts and checksums. Retain the exported JSON outside the
   repository in an operator-only location, restrict its file permissions, and
   record its checksum and location.
4. Verify a provider-level storage backup when storage objects could be
   affected.
5. Confirm that the target has no partial graph schema. The full-site exporter
   must either find none of the graph tables or all of them.

The production export requires the operator to be present to approve the
maintenance window. If export, validation, or restricted storage fails, restore
the prior maintenance state, remove any incomplete artifact, and do not apply
migrations. After migration verification, securely archive or remove the
temporary backup according to the retention plan.

## Local Validation

Start from a clean local Supabase stack and replay the complete migration
history:

```sh
supabase db reset --local --no-seed
supabase db lint --local --schema public,private --fail-on error
supabase test db
npm run docs:check
npx tsc --noEmit
npm run build
```

The 64-assertion pgTAP suite in
`supabase/tests/knowledge_graph_foundation.test.sql` verifies the tables,
the legacy KV replay prerequisite, evidence linkage, critical indexes,
governed vocabulary seeds, exact policy sets for every graph table, and the
role/capability matrix for anonymous, authenticated contributor, staff/curator,
admin, and service-role actors.

Lint is intentionally scoped to project-owned schemas. Linting the
`extensions` schema reports false errors from pgTAP's temporary test objects
and legacy compatibility functions rather than WasteDB schema defects.

## Deployment

1. Deploy the backup endpoint changes before the database migration so the
   first post-migration export can produce schema version 4.0.
2. Review the remote migration plan without applying it:

   ```sh
   supabase db push --dry-run
   ```

3. Keep application writes paused and apply the reviewed migration:

   ```sh
   supabase db push
   ```

4. Generate and validate a schema-version 4.0 full-site backup.
   Apply the same restricted-storage, permission, checksum, and retention
   requirements used for the pre-migration backup.
5. Run the Stage 6 roadmap tests. The graph schema, vocabulary, evidence
   linkage, anonymous-write denial, and backup-v4 checks must pass.
6. Resume writes only after the migration, backup, and schema checks pass.

## Reconciliation

This foundation migration creates no graph content, so the expected initial
state is:

- governed vocabulary tables contain their seeded slugs
- graph content and migration-operation tables contain zero rows
- existing domain-table counts and checksums match their pre-migration values
- existing evidence rows are unchanged, with new linkage columns null
- the schema-version 4.0 manifest contains every graph table, including empty
  tables, with row counts and checksums

Any unexplained graph rows or domain-data changes block completion.

## Rollback Limits

The migration runs in one transaction, so an error before `COMMIT` rolls back
the whole migration. After commit, do not automatically drop graph objects.

Because the migration is additive and creates no backfill or cutover, the safe
recovery path is to:

1. leave the new tables and nullable evidence columns in place
2. keep domain reads and writes authoritative
3. repair forward with a reviewed additive migration
4. restore from the verified schema-version 3.0 backup only if domain data was
   unexpectedly changed

Dropping graph tables, policies, functions, or evidence columns requires a
separate approved destructive migration after confirming that no graph-era
rows, outbox events, or audit dependencies exist.

## Stop Conditions

Stop deployment and preserve diagnostics if:

- the pre-migration backup does not validate
- the backup cannot be stored outside the repository with operator-only access
- the recorded backup checksum does not match
- only some graph tables exist
- local pgTAP or database lint checks fail
- domain counts or checksums change
- the post-migration export is not schema version 4.0
- any required Stage 6 roadmap test fails

Do not begin graph backfill or enable graph reads as part of this runbook.
