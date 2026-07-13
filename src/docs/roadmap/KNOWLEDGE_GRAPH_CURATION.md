# Graph Content and Curation Plan

Stage 7 turns the reconciled canonical entity layer into governed knowledge.
It does not enable graph-powered discovery reads; that remains a Stage 10
gate.

## Stage 7 Wrap-Up Progress — July 13, 2026

- The Content Management admin area now keeps one section visible at a time,
  with video links, content mappings, relationship review, and preview tools
  separated into focused panels.
- Admins can add new videos by URL from the dedicated video-link panel, and
  the flow reuses existing videos instead of creating duplicates.
- Stage 7 smoke coverage now includes video-by-URL reuse, duplicate-safe
  manual mappings and material relationships, and read-only material resource
  checks so progress can be verified incrementally.
- The remaining Stage 7 work should stay low-friction for human-reviewed
  inputs and continue to use the existing audit-log system for every mutation.
- Stage 8 planning now follows this wrap-up and centers on evidence-based
  scoring methodology, provenance, and reviewed observation workflows.

## Supersession Note — July 8, 2026

The roadmap now defines Stage 7 completion around two outcomes:

- reviewed educational content linked to materials with admin CRUD/review and
  public material-page presentation
- reviewed material-to-material relationships with admin CRUD/review and
  public material-page presentation

Completed video intake, triage, mapping, publication, and content-review work
in this document remains valid implementation history. Those workstreams are no
longer Stage 7 completion blockers.

Stage 7 no longer requires outbox processing workers, generalized taxonomy
management, Key Insight and scoring-evidence workflows, broad graph discovery
surfaces, or broad audit-system redesign to close. Stage 7 continues to write
transactional audit summaries and outbox records for its own mutations. The
outbox is treated as an inactive durable ledger until an approved downstream
consumer exists.

## Implementation Checkpoint — June 29, 2026

- Edge Function version 286 provides admin-only playlist capability and
  preview endpoints.
- The preview credential is present as a deployment secret; its value is not
  readable by the application or stored in the repository.
- The preview engine is read-only and compares video, video-entity, and
  video-binding counts before and after provider enumeration.
- Seven fixture tests cover URL parsing, duration conversion, duplicate and
  unavailable-item classification, stable checksums, existing-video matching,
  and concurrent-state detection.
- The admin one-time-actions area includes a playlist URL form, summary counts,
  checksum output, an inspectable candidate table, and a safe triage CSV
  download.
- Anonymous requests to both playlist endpoints return HTTP 401.
- The first signed-in production preview reconciled all 370 playlist items as
  366 new candidates and four private candidates, with no duplicates, deleted
  items, unavailable items, or database mutation. See the
  [Playlist Preview Report](./guides/KNOWLEDGE_GRAPH_VIDEO_PLAYLIST_PREVIEW_2026-06-29.md).
- Draft apply and triage persistence remain disabled.

## Implementation Checkpoint — June 30, 2026

- An additive local migration defines private `video_import_batches`,
  `video_import_items`, and `editorial_leads` tables without importing data.
- Provider facts, original worksheet payloads, checksums, and automated topic
  suggestions are immutable; disposition, reviewed topics, material
  identifiers, editorial targets, and notes remain separately editable.
- Anonymous users and contributors cannot read or write the private tables.
  Staff and admins may read, insert, and update but cannot delete preserved
  records through RLS; service-role workers retain explicit recovery access.
- Forty pgTAP assertions cover table and policy sets, role behavior,
  immutability, false-positive suggestion rejection, external playback,
  editorial targets, conversion rules, and non-destructive retention.
- The admin panel can validate a reviewed worksheet entirely in the browser.
  It reports structural errors and review readiness without uploading or
  staging the file.
- Fourteen playlist/worksheet fixture tests pass. An untouched worksheet is
  valid for future staging but remains ineligible for draft apply until its
  available rows receive explicit dispositions.
- Full backups remain compatible with schema 4.0 and advance to schema 4.1
  only when all three video-curation tables are present. Partial table groups
  cause backup refusal rather than silent omission.
- Edge Function version 287 deploys this backward-compatible backup support
  before the database migration; production continues exporting schema 4.0
  until the complete Stage 7 table group is deployed.
- The additive migration is deployed in production. All three private tables
  reconcile at zero rows, production schema lint passes, and the post-migration
  schema-4.1 backup covers all 32 Postgres tables with valid counts and
  checksums. See the
  [Deployment Report](./guides/KNOWLEDGE_GRAPH_VIDEO_TRIAGE_FOUNDATION_DEPLOYMENT_2026-06-30.md)
  and [Runbook](./guides/KNOWLEDGE_GRAPH_VIDEO_TRIAGE_FOUNDATION_RUNBOOK.md).
- A follow-up increment adds a service-role-only transactional worksheet
  staging function and an admin staging endpoint guarded by
  `VIDEO_TRIAGE_PERSISTENCE_ENABLED`. The edge layer rechecks the exact CSV
  checksum, normalized row shape, provenance, classifications, dispositions,
  and editorial targets before invoking the database transaction.
- Exact worksheet reruns return the existing batch. Invalid or duplicate input
  rolls back without partial rows, and staging cannot create videos, video
  entities, mappings, tags, or editorial leads. Seventeen pgTAP assertions and
  four additional staging fixtures cover these boundaries.
- Edge Function version 288 and migration `20260630010000` are deployed in
  production. The private-staging gate is enabled, anonymous Edge and RPC
  access remain denied, draft apply and graph reads remain disabled, and all
  video, graph-content, and triage tables remained empty at deployment
  reconciliation.
- The admin panel provides an explicit, confirmed private-staging action only
  when the worksheet matches the displayed preview and the server gate is
  enabled. First-workbook staging, its idempotent rerun, and the post-stage
  backup remain the completion gate. See the
  [Worksheet Staging Runbook](./guides/KNOWLEDGE_GRAPH_VIDEO_TRIAGE_STAGING_RUNBOOK.md)
  and [Deployment Report](./guides/KNOWLEDGE_GRAPH_VIDEO_TRIAGE_STAGING_DEPLOYMENT_2026-06-30.md).
- Worksheet validation normalizes the spreadsheet-safety apostrophe used for
  valid YouTube IDs beginning with `-`. A regression fixture preserves both
  formula-injection protection and identifier round-tripping; older worksheets
  must still match the currently displayed preview checksum before staging.
- The first production worksheet staged as batch
  `ed633c3b-89c0-45f0-9456-f6a3d0af3c1f` with 371 private candidate rows and
  status `needs_review`. An exact rerun returned the same batch without new
  rows. Production counts show no videos, editorial leads, relationships,
  mappings, or tags. The post-stage schema-4.1 backup validates all 371
  candidate rows and completes the private worksheet-staging deployment gate.
- A follow-up increment adds a paginated private review queue and a
  service-role-only `review_video_triage_item` transaction. Admins can record
  one of the four dispositions, material identifiers, reviewed topics,
  editorial targets, and notes; unavailable sources remain limited to ignore.
  Batch status advances to `ready` only when every available candidate has a
  disposition and returns to `needs_review` if a decision is reopened.
- Twenty-two new pgTAP assertions cover permissions, partial and complete batch
  transitions, reviewer attribution, private-video restrictions, metadata
  clearing, reversible review, and zero content writes. The review database
  function and private Edge routes are deployed and reconciled in production;
  the review panel still needs the normal frontend deployment before operators
  can use it there. See the
  [Review Queue Runbook](./guides/KNOWLEDGE_GRAPH_VIDEO_TRIAGE_REVIEW_RUNBOOK.md)
  and
  [Deployment Report](./guides/KNOWLEDGE_GRAPH_VIDEO_TRIAGE_REVIEW_DEPLOYMENT_2026-07-01.md).

## Implementation Checkpoint — July 1, 2026

- A non-mutating relationship and content-mapping preview is introduced as
  Step 4 of the Implementation Order, initiated separately from the active
  video-triage workstream.
- The preview reads `material_links`, `materials.linked_material_ids`,
  `articles.legacy_material_kv_id`, and `guides.material_id` to identify
  candidate graph relationships and content mappings from existing authoritative
  data.
- No entity_relationships, content_entities, or other graph records are created.
  Counts are verified before and after each preview call; a mismatch would be a
  contract violation.
- Conservative semantics only: `related_to` for material→material pairs,
  `discusses` for content→material pairs. Stronger semantics require human
  review and are not suggested by the preview.
- Unresolvable candidates (missing material record, missing canonical entity
  binding) are returned with `resolution: "awaiting_review"` and a
  human-readable note. They are never silently dropped or labeled as "no
  relationship exists."
- Candidates where an equivalent graph record already exists are returned with
  `resolution: "already_mapped"` so reviewers can identify redundant work.
- A `sample_limit` parameter caps the candidate sample (1–200, default 50) to
  keep response sizes practical; the `summary` block covers the full scanned
  population.
- Ten automated Stage 7 acceptance tests cover non-mutation, determinism,
  conservative semantics, quarantine framing, resolution fixtures, sample
  limits, and summary consistency.
- Additional reviewed-manifest unit coverage and 21 pgTAP assertions cover
  explicit selection, authorization, atomic rollback, audit/outbox
  reconciliation, and exact-rerun idempotency.
- The new admin-only route `GET /graph/content-mappings/preview` is defined in
  `src/supabase/functions/server/content-mapping-preview.ts` and
  registered in `index.tsx`. The frontend utility is
  `src/utils/contentMappingPreview.ts`.
- Graph reads remain disabled. Quarantine and reviewed apply implementations
  now exist locally but require the additive Stage 7 database migration and a
  normal backend/frontend deployment. The apply environment gate remains off
  unless an operator deliberately opens an approved apply window.

## Transactional Review Hardening — July 1, 2026

- Merely resolving both entity IDs does not approve a knowledge claim. An
  administrator must select each visible resolved candidate; only those stable
  candidate keys enter the approved manifest.
- The server reruns the complete analysis and rejects stale checksums, unknown
  keys, duplicate keys, unresolved candidates, and self-referential mappings.
- `quarantine_content_mapping_candidates` persists the complete unresolved
  issue set atomically and returns the existing completed run for an exact
  checksum rerun.
- `apply_content_mapping_candidates` commits pending-review graph rows,
  idempotent outbox events, a reconciled migration report, and the existing
  `audit_log` summary in one PostgreSQL transaction. Any failure rolls the
  entire operation back.
- The apply UI is intentionally bounded by the reviewed sample: unseen
  candidates are never included implicitly. Resolved candidates sort first so
  later review batches become visible after earlier batches are applied and a
  fresh preview is run.
- The migration and Edge routes were deployed to production on July 2, 2026
  during the Stage 7 video-triage apply release. The production apply gate
  remains closed. A closed-gate production preview, checksum capture,
  post-deployment backup reconciliation, and browser acceptance remain pending
  before any reviewed content-mapping apply window may open;
  `CONTENT_MAPPING_APPLY_ENABLED` must remain false until then.
  Follow the
  [Content-Mapping Review Runbook](./guides/KNOWLEDGE_GRAPH_CONTENT_MAPPING_REVIEW_RUNBOOK.md).

## Manual Curation Workflow — July 5, 2026

- Content Management now provides a direct manual mapping form as the normal
  day-to-day curation path. An admin chooses canonical content, a canonical
  material, and a governed content role without running a migration preview or
  opening the migration apply gate.
- Each save creates one `pending_review` content mapping, an idempotent graph
  outbox event, and an existing-format audit record in one database
  transaction. Exact duplicate saves return the existing mapping.
- Evidence mappings require an explicit governed evidence use. Other mappings
  may optionally record lifecycle focus.
- The checksum-bound preview, quarantine, and apply workflow remains available
  for bulk migration of legacy relationships; it is not required for manual
  curation.
- Reviewed video material identifiers can be previewed and promoted in bulk to
  initial `primary_subject` mappings. The action creates only missing
  `pending_review` records, skips exact existing mappings, and reports
  unresolved identifiers for manual cleanup.
- A material compatibility trigger now creates and synchronizes canonical
  material entities/bindings for authoritative material writes. Its migration
  reconciles materials created after the Stage 6 backfill, preventing valid
  reviewed slugs from appearing unresolved merely because a binding was absent.
- Content Management includes a review queue for pending mappings. Admins can
  search and filter mappings, approve them to `active`, or reject them to
  `archived`. The 25-item review page supports selecting and approving the
  visible pending mappings in bulk to reduce repetitive input. Each decision
  records reviewer metadata, an idempotent outbox update, and an audit entry in
  one database transaction.

## Entry State

- 228 canonical entities and 228 bindings reconcile in production.
- Relationship, tag, content-mapping, video, and outbox tables are empty.
- Domain tables remain authoritative.
- Anonymous graph mutations are denied.
- `discusses` remains a discovery relationship and does not imply evidence.

## Implementation Order

1. Build a non-mutating YouTube playlist preview with pagination,
   normalization, duplicate detection, unavailable-item reporting, and durable
   import provenance.
2. Add four-way playlist triage: material video, editorial lead, both, or
   ignore. Preserve triage decisions so an idempotent rerun does not recreate
   dismissed candidates. Transactional private worksheet staging is deployed;
   completing dispositions remains active work, and the private review queue
   backend is deployed for reviewed decision capture.
3. Create accepted videos as drafts through a transactional video, entity, and
   canonical-binding workflow. Add reviewed material mappings separately.
4. **[Deployed — production reconciliation pending]** Build non-mutating relationship and
   content-mapping previews for `material_links`,
   `materials.linked_material_ids`, article material links, and guide material
   links. The preview endpoint, ten acceptance tests, and admin UI panel in
   Content Management are deployed; production preview counts and checksum
   still need to be recorded.
5. **[Deployed — use only after preview review]** Preserve ambiguous records as immutable migration issues.
   `buildContentMappingQuarantine` writes all `awaiting_review` candidates
   to `graph_migration_issues` via a new `graph_migration_runs` entry.
   Admin panel offers a confirmed quarantine action after a preview run.
   Route: `POST /graph/content-mappings/quarantine`.
6. **[Active]** Add reviewed relationship, tag, entity, and video curation APIs
   and admin interfaces. Manual content-to-material creation and approval or
   rejection are implemented; bulk migration review remains checksum-bound,
   and the other curation domains remain planned.
7. Preserve transactional compatibility writes with idempotent outbox entries
   for Stage 7 relationship and content-mapping mutations. Treat the outbox as
   an inactive durable ledger until a downstream consumer is approved.
8. Preserve summary audit compatibility for Stage 7 relationship and
   content-mapping mutations.
9. Defer generalized taxonomy administration to Stage 10.
10. Defer Key Insight and scoring-evidence review workflows to Stage 8.

## YouTube Playlist Intake

The initial operator source is an unlisted, link-accessible playlist of about
370 videos. Its URL may be prefilled in the admin-only interface for operator
convenience, but it must be treated as publicly discoverable frontend
configuration rather than a secret. A YouTube API credential must be supplied
through a deployment secret and must never be stored in the repository,
browser, import report, or audit payload.

Playlist import begins as a preview and performs no database writes. The
preview must:

- enumerate every accessible playlist item across all result pages
- normalize supported YouTube URL forms to a stable video ID
- identify duplicates within the playlist and against existing videos
- preserve source playlist ID, playlist position, fetch timestamp, and raw
  provider metadata as import provenance
- distinguish unavailable, private, deleted, malformed, and fetch-failed items
- produce deterministic counts and a checksum suitable for reviewed apply
- permit individual and bulk triage before any draft is created

Removing a video from the source playlist must never automatically delete or
archive a WasteDB record. A later rescan reports the difference for review.

### Triage Outcomes

Each playlist candidate receives one explicit disposition:

- **Material video**: create a governed video draft and place it in the
  material-mapping queue.
- **Editorial lead**: retain it as a private mission-aligned writing candidate
  without adding it to the public video catalog or material graph.
- **Both**: create the video draft and an independently governed editorial
  lead.
- **Ignore**: retain only the import decision and minimum provenance needed to
  keep the candidate from reappearing on an unchanged rerun.

No title, description, playlist membership, automated classification, or
material suggestion is itself approval, endorsement, or evidentiary support.

### Material Video Workflow

Applying an approved material-video candidate transactionally creates one
`videos` row, one `video` entity, and one canonical binding. New videos remain
`draft`; no playlist import may publish them automatically.

After the initial playlist received complete human review and its material
mappings were separately approved, the reviewed publication migration promotes
only applied `material_video` and `both` records to published videos and active
canonical entities. Ignored, editorial-only, unavailable, unreviewed, and
unapplied records remain excluded. Publication preserves reviewer metadata and
writes video/entity outbox events plus one audit entry per published video.

Published videos linked through active content mappings appear as video cards
inside the existing Recommended Learning section on material pages. This is a
narrow Stage 7 content-resource read; it does not enable Knowledge Feed,
Related Entities, Discovery Paths, or the general Stage 10 graph-read cutover.

Material associations use reviewed `content_entities` mappings:

- `primary_subject` when the material is the video's principal subject
- `mentioned` when the material is meaningfully but incidentally discussed
- `evidence` only after an editor verifies the specific evidentiary use

Lifecycle focus, difficulty, summary, takeaways, transcript, and additional
material mappings may be added later. Their absence must not block safe draft
intake.

### Topic Classification

Topic classification is independent from playlist disposition and material
mapping. A candidate may be a material video, editorial lead, or both while
also receiving reviewed topic tags.

The first required video topic is:

- slug: `3d_printing`
- label: `3D printing`
- tag type: `topic`
- intended use: substantive coverage of additive manufacturing processes,
  feedstocks, print waste, repair, reuse, or recovery systems
- when not to use: incidental mentions, generic manufacturing footage, or a
  material video with no meaningful additive-manufacturing context

Automated title, description, or transcript matching may suggest this topic,
but only a reviewed decision creates the governed tag. The topic does not by
itself imply a material relationship, evidentiary support, or editorial
disposition.

Content Management can preview and apply topic values already recorded in
`reviewed_topic_tags`. Because these values were explicitly approved during
triage, apply adds mechanically normalized missing topic vocabulary and creates
active `entity_tags` with reviewer provenance, idempotent outbox events, and an
audit summary rather than requiring the same editorial decision a second time.
Comma-combined values are split, but semantic aliases are not guessed or
merged. Automated `suggested_topic_tags` are never read by this apply path.

## Editorial Lead Workflow

Mission-relevant videos that are broader than a specific material belong in a
separate editorial queue rather than being forced into a graph relationship.
An editorial lead preserves:

- source URL and stable provider/video ID
- source title, channel, thumbnail, and available description
- editor notes and the reason it may fit WasteDB's educational mission
- suggested target types: `article`, `blog_post`, and/or `guide`
- optional material suggestions and mission/topic tags
- assignee, review timestamps, and status
- the resulting canonical content entity when the lead is converted

The workflow states are `candidate`, `needs_review`, `planned`, `converted`,
and `dismissed`. Conversion links the lead to the resulting article, blog post,
or guide; it does not silently create or publish that content. Editorial leads
remain private to authorized contributors, editors, and admins.

## Initial Automated Contracts

- Canonical entities and bindings remain available as the curation baseline.
- The governed `discusses` description stays explicitly evidence-neutral.
- Material graph sections remain in their honest pre-cutover state.
- The server reports playlist-preview readiness without exposing its provider
  credential or enabling draft apply, triage persistence, or graph reads.
- Full playlist preview is complete, deterministic, non-mutating, and covered
  by fixture regression tests plus recorded production reconciliation.
- Playlist candidates export to a spreadsheet-injection-safe worksheet with
  provenance, issues, suggested `3d_printing` tags, and blank human-review
  fields; suggestions do not constitute approval.
- Reviewed worksheets are parsed and validated locally before staging;
  inaccurate suggestions may be rejected without altering provider facts.
- Validated staging is separately gated, transactional, and idempotent for an
  exact worksheet checksum. It persists private review records only and leaves
  all content and graph tables unchanged.

## Planned Video Acceptance Contracts

- Reimport does not duplicate videos, entities, bindings, triage decisions, or
  editorial leads.
- Applying a material-video candidate creates a draft video, entity, and
  canonical binding atomically, without publishing it.
- Material mappings remain pending review and `evidence` requires explicit
  editorial approval.
- Governed topic suggestions, including `3d_printing`, remain pending review
  and independent from material and editorial classifications.
- Editorial leads remain private, preserve their source and disposition, and
  may convert to an article, blog post, or guide without becoming graph claims.
- Ignored and unavailable candidates remain explainable without entering the
  public video catalog.

## Stop Conditions

Do not enable graph reads or apply relationship/content population when:

- canonical entity reconciliation no longer passes
- a source reference is ambiguous or unresolved
- a relationship would imply unsupported evidence or causality
- playlist enumeration is incomplete or its reviewed checksum has changed
- a rerun would duplicate or silently delete a prior video or triage decision
- an editorial lead would become public content or a graph claim implicitly
- review, audit, authorization, or rollback behavior is incomplete
- Stage 7 relationship and content-mapping acceptance tests do not pass
