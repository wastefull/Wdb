# Graph Content and Curation Plan

Stage 7 turns the reconciled canonical entity layer into governed knowledge.
It does not enable graph-powered discovery reads; that remains a Stage 8 gate.

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
  checksum output, and an inspectable candidate table.
- Anonymous requests to both playlist endpoints return HTTP 401.
- The first signed-in production preview reconciled all 370 playlist items as
  366 new candidates and four private candidates, with no duplicates, deleted
  items, unavailable items, or database mutation. See the
  [Playlist Preview Report](./guides/KNOWLEDGE_GRAPH_VIDEO_PLAYLIST_PREVIEW_2026-06-29.md).
- Draft apply and triage persistence remain disabled.

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
   dismissed candidates.
3. Create accepted videos as drafts through a transactional video, entity, and
   canonical-binding workflow. Add reviewed material mappings separately.
4. Build non-mutating relationship and content-mapping previews for
   `material_links`, `materials.linked_material_ids`, article material links,
   and guide material links.
5. Preserve ambiguous records as immutable migration issues; prefer
   `related_to` and `discusses` over stronger inferred semantics.
6. Add reviewed relationship, tag, entity, and video curation APIs and admin
   interfaces.
7. Add scoped Key Insight review fields and supporting-evidence linkage.
8. Add transactional compatibility writes and idempotent outbox processing.
9. Preserve summary audit compatibility for every graph mutation.
10. Complete keyboard, screen-reader, high-contrast, dark-mode, responsive,
    and reduced-motion browser acceptance before closing Stage 7.

## YouTube Playlist Intake

The initial operator source is an unlisted, link-accessible playlist of about
370 videos. The playlist URL is runtime input and must not be embedded in
public source code. A YouTube API credential must be supplied through a
deployment secret and must never be stored in the repository, browser, import
report, or audit payload.

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
- full Stage 5-7 browser accessibility acceptance has not passed
