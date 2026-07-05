# Current Data Model

The schema source of truth is `supabase/migrations/`. This document is a
maintained orientation guide, not a replacement for migration SQL.

## Authoritative Postgres Tables

| Table | Purpose |
| --- | --- |
| `user_profiles` | User profile, role, and display preferences |
| `material_categories` | Material category taxonomy |
| `materials` | Material identity, public scores, and scientific fields |
| `articles` | Material-related long-form content |
| `sources` | Reusable source and citation records |
| `material_sources` | Material-to-source links and weights |
| `material_links` | Legacy material-to-material relationship links |
| `evidence_points` | MIU evidence, values, context, and provenance |
| `audit_log` | Restricted mutation audit history |
| `guides` | Community and editorial guides |
| `blog_posts` | Blog and changelog content |
| `changelog_entries` | Structured changelog entries |

## Remaining KV Responsibilities

`kv_store_17cae920` remains for sessions and legacy operational namespaces.
It was originally provisioned outside migration history; the replay guard and
forward prerequisite migration now make clean local reconstruction
deterministic.
Its presence does not mean materials, evidence, or audit history should be read
from KV. Before removing any namespace, inventory active reads and writes,
create a verified backup, migrate additively, reconcile, and retain a manual
recovery path.

## Additive Graph Layer

Stage 6 added graph tables for entities, relationships, normalized tags,
content-to-subject mappings, videos, migration observability, and compatibility
outbox events. Domain tables remain authoritative.

`content_entities` stores reviewed content-to-subject associations. Its
`content_entity_id` references canonical article, guide, blog-post, or video
entities; `subject_entity_id` references the subject entity, currently a
canonical material in the manual admin workflow. Governed `role`, optional
`lifecycle_focus`, optional `evidence_use`, and review `status` describe the
association. New manual mappings remain `pending_review`.

Stage 7 adds private, pre-publication workflow tables:

| Table | Purpose |
| --- | --- |
| `video_import_batches` | Immutable playlist/worksheet provenance and validation lifecycle |
| `video_import_items` | Provider candidates, suggestions, reviewed triage, and eventual draft linkage |
| `editorial_leads` | Private article, blog-post, and guide opportunities sourced from reviewed media |

These tables do not enable graph reads or publish videos. Suggested topics are
stored separately from reviewed topics so false positives can be rejected
without rewriting source provenance. The service-role-only
`stage_video_triage_worksheet` function inserts a validated batch and all of
its candidate rows in one transaction; an exact worksheet rerun returns the
existing batch, and the function has no authority to create public content or
graph records. The service-role-only `review_video_triage_item` function
updates one candidate's editable human-review fields and aggregate batch status
atomically while leaving immutable provider provenance untouched. See
[ADR 001: Knowledge Graph Foundation](./ADR_001_KNOWLEDGE_GRAPH_FOUNDATION.md)
and [Knowledge Graph Migration](../roadmap/KNOWLEDGE_GRAPH_MIGRATION.md).

The service-role-only `create_manual_content_mapping` function is the atomic
day-to-day curation write path. It validates an admin reviewer and governed
vocabulary, inserts one pending mapping, and writes its graph outbox event and
audit record in the same transaction. The Edge Function exposes this only
through authenticated admin routes; browser clients cannot invoke the database
function directly.

Materials maintain their graph identity through the
`materials_sync_canonical_binding` compatibility trigger. It creates a missing
canonical material entity/binding after authoritative material insertion and
synchronizes name, slug, description, and lifecycle status on later edits. The
installing migration also reconciles materials created after the original
Stage 6 entity backfill.

## Data-Loss Prevention

- Never drop legacy columns or tables in the initial graph migration.
- Preserve raw legacy payloads for unresolved records.
- Use idempotent backfills and unique constraints.
- Reconcile counts, identifiers, links, and checksums before read cutover.
- Require a separately approved migration for destructive cleanup.
