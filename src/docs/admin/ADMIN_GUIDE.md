# Admin Guide

The Admin Dashboard groups moderation, database, testing, and operational
tools. Admin mode controls privileged content-editing behavior; authentication
and role checks still apply on the server.

## Core Areas

- **Moderation:** review submissions, takedown requests, audit logs, and data
  retention.
- **Admin:** manage users, roles, categories, assets, maintenance mode, content,
  and one-time actions.
- **Database:** manage materials, sources, whitepapers, evidence, and curation.
- **Testing:** run transform tests, chart checks, and roadmap regression tests.

## Roadmap Workflow

The roadmap is the operational source of truth:

1. Open Admin > Testing > Roadmap.
2. Select the active stage.
3. Use deliverables and planned acceptance tests to define implementation.
4. Attach executable tests as behavior becomes available.
5. Run stage regressions before marking work complete.

Completed legacy Phase 9.x and 10.0 tests are displayed under current Stages
2-4 while retaining their legacy identifiers for traceability.

## Content Management

Open **Admin Dashboard > Content Management** for playlist intake, private video
triage, and graph content curation.

Private Video Triage includes a full-batch filter for video titles, YouTube
IDs, channels, reviewed material identifiers, topic tags, and review notes. Use
it to locate and correct a reviewed decision without paging through the batch.

Use **Reviewed Video Topics** in Content Management to preview and apply only
topic tags explicitly approved during triage. Automated suggestions are
excluded. Missing topic vocabulary is created from those reviewed values with
mechanical slug normalization; similarly named concepts are not silently
merged.

The reviewed-video publication migration publishes only applied triage records
with a `material_video` or `both` disposition. Published linked videos appear
under **Recommended Learning > Video resources** on the corresponding material
pages. Ignored and editorial-only candidates remain excluded.

The normal content-mapping workflow is:

1. Open **Create Content Mapping**.
2. Search for canonical content and choose one item.
3. Search for and choose the subject material.
4. Choose the governed connection and optional lifecycle focus.
5. For an Evidence connection, choose the specific verified evidence use.
6. Create the mapping.

The mapping is saved as `pending_review`; this action does not publish content
or enable graph reads. An exact duplicate returns the existing mapping. The
collapsed legacy migration tools are only for bulk import reconciliation and
are not required for ordinary curation.

## Safety

Before data migrations or bulk operations, follow
[Operations](./OPERATIONS.md). Do not use one-time actions without reading
their description and confirming a verified backup exists.
