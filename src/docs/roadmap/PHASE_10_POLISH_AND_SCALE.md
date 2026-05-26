# Phase 10: Data Migration — KV Store → Postgres

**Status:** ✅ COMPLETE  
**Completed:** May 21, 2026  
**Migration window:** May 20–21, 2026  
**Updated:** May 23, 2026

---

## Overview

Phase 10 was originally scoped as "Polish, Scale & Community Growth." After completing the Curation Lab (Phase 9.2, partial), the team pivoted: before scaling evidence curation, the Supabase KV Store needed to be replaced with a proper relational Postgres schema to ensure data integrity, query flexibility, and RLS-based access control.

**Result:** All core data now lives in Postgres with foreign-key integrity, row-level security, and full seeded history.

---

## Tables Migrated

| Table | Description |
|---|---|
| `user_profiles` | User accounts with roles (admin, curator, viewer) |
| `material_categories` | Category taxonomy (composting, recycling, reuse, etc.) |
| `materials` | Core material records with all scientific fields |
| `articles` | Long-form material articles (informal explainers) |
| `sources` | Bibliographic source library (DOI, title, authors, year) |
| `material_sources` | Many-to-many: materials ↔ sources |
| `material_links` | External resource links per material |
| `evidence_points` | MIU evidence records (parameters, values, snippets, locators) |
| `audit_log` | All mutations with actor ID, action, timestamp |

---

## Infrastructure

- **Row-Level Security (RLS)** on all tables with three access tiers:
  - Anon: read-only public access to published materials
  - Authenticated: curators can insert/update evidence_points
  - Admin: full access including user management and audit_log
- **Migration scripts** in `supabase/migrations/` (dated 20260520–20260521)
- **Seeded data** for all existing materials, categories, and sources
- **Foreign-key integrity** enforced across all relationships

---

## What Changed

Previously, materials, evidence points, and aggregations were stored in Supabase's KV Store (as JSON blobs). This worked for early development but created:

- No referential integrity between entities
- Limited query capability (no JOINs, no aggregations)
- No row-level access control per record
- Difficulty scaling to more curators and materials

Postgres resolves all of these.

---

## Next Stage

With the relational foundation in place, [Stage 5: Scale](./PROJECT_STATUS.md) focuses on:
- Aggregation engine with weighted statistics and confidence intervals
- Evidence curation for 30+ materials
- Public evidence traceability tab on material detail pages
- Community curator onboarding
