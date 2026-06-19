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

## Planned Graph Layer

Stage 6 plans additive graph tables for entities, relationships, normalized
tags, content-to-subject mappings, and videos. Domain tables will remain
authoritative. See
[ADR 001: Knowledge Graph Foundation](./ADR_001_KNOWLEDGE_GRAPH_FOUNDATION.md)
and [Knowledge Graph Migration](../roadmap/KNOWLEDGE_GRAPH_MIGRATION.md).

## Data-Loss Prevention

- Never drop legacy columns or tables in the initial graph migration.
- Preserve raw legacy payloads for unresolved records.
- Use idempotent backfills and unique constraints.
- Reconcile counts, identifiers, links, and checksums before read cutover.
- Require a separately approved migration for destructive cleanup.
