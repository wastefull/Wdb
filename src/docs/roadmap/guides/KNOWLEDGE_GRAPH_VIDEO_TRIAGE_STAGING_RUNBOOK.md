# Video Triage Worksheet Staging Runbook

Use this runbook to deploy the additive Stage 7 worksheet-staging increment.
It persists validated private triage records only. It does not stage the
operator's CSV during deployment and cannot create or publish videos, graph
records, mappings, tags, or editorial leads.

## Deployment Scope

- migration: `20260630010000_create_video_triage_staging_function.sql`
- database function: `stage_video_triage_worksheet`
- Edge route: `POST /graph/videos/playlist/triage/stage`
- safety gate: `VIDEO_TRIAGE_PERSISTENCE_ENABLED`
- UI: confirmed `Stage private triage records` action

## Preconditions

1. Confirm the Stage 7 triage foundation migration and schema-4.1 backup remain
   reconciled.
2. Confirm all graph and video pgTAP assertions, playlist and worksheet fixture
   tests, TypeScript, documentation checks, production build, and database lint
   pass.
3. Keep `VIDEO_TRIAGE_PERSISTENCE_ENABLED` unset or false.
4. Pause application writes and create and validate a fresh full-site backup.
5. Record the backup path, SHA-256, schema version, manifest counts, and
   maintenance-window start.
6. Confirm draft apply and graph reads are disabled.

## Deploy While Staging Is Disabled

1. Deploy the Edge Function with the staging gate disabled.
2. Apply only `20260630010000_create_video_triage_staging_function.sql`.
3. Verify anonymous and authenticated clients cannot execute the function.
4. Run the production-safe Stage 7 contracts and schema lint.
5. Confirm the capability response still reports draft apply and graph reads
   as false.

## Enable Private Staging

1. Set `VIDEO_TRIAGE_PERSISTENCE_ENABLED=true` as a deployment secret or
   environment setting; never expose it in browser configuration.
2. Confirm the admin capability response reports triage persistence enabled
   while draft apply and graph reads remain false.
3. Confirm anonymous requests to the staging route return HTTP 401 and a
   non-admin authenticated request returns HTTP 403.
4. Do not stage a worksheet until the operator separately confirms its
   filename, preview checksum, worksheet checksum, row count, and displayed
   playlist match.

## First Worksheet Reconciliation

After the operator confirms staging:

1. Record the returned batch ID, status, row count, reviewed count, and
   unreviewed available count.
2. Require one batch row and exactly one candidate row per validated CSV row.
3. Restage the exact worksheet and require the same batch ID with
   `created=false` and unchanged counts.
4. Confirm provider facts and original payloads cannot be edited.
5. Confirm `videos`, video entities, canonical bindings, content mappings,
   entity tags, and editorial leads are unchanged.
6. Export and validate a new schema-4.1 backup containing the staged records.
7. Record the operation's summary audit event and disable the staging gate if
   no further worksheets should be accepted.

## Stop Conditions

Stop, leave draft apply disabled, and preserve diagnostics if:

- CSV bytes no longer match the locally validated checksum
- playlist ID or preview checksum differs from the displayed preview
- an exact rerun creates another batch or candidate
- a failed request leaves partial rows
- an untrusted role can call the function or inspect private records
- staging changes any video, graph, mapping, tag, or editorial-lead count
- backup validation, health, lint, or canonical reconciliation regresses

Recovery remains additive. Do not delete or rewrite preserved staging records
to conceal an error; use a reviewed corrective migration or archive workflow.
