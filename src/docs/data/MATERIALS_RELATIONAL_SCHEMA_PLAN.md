# Materials Relational Schema Plan

**Updated:** May 20, 2026  
**Status:** In Progress

---

## Implementation Progress

| Step | Description                                                                         | Status         | Migration File                                        |
| ---- | ----------------------------------------------------------------------------------- | -------------- | ----------------------------------------------------- |
| 1    | Create `user_profiles` table                                                        | ✅ Done        | `20260520000002_create_user_profiles_table.sql`       |
| 2    | Create `material_categories` table                                                  | ✅ Done        | `20260520000003_create_material_categories_table.sql` |
| 3    | Create `materials` table                                                            | ✅ Done        | `20260520000004_create_materials_table.sql`           |
| 4    | Create `articles` table                                                             | ✅ Done        | `20260520000005_create_articles_table.sql`            |
| 5    | Create `sources` table                                                              | ✅ Done        | `20260520000006_create_sources_table.sql`             |
| 6    | Create `material_sources` junction table                                            | ✅ Done        | `20260520000007_create_material_sources_table.sql`    |
| 7    | Create `material_links` junction table                                              | ✅ Done        | `20260520000008_create_material_links_table.sql`      |
| 8    | Seed `user_profiles` from KV (one-time script)                                      | ✅ Done        | `20260520000009_seed_user_profiles.sql`               |
| 9    | Seed `materials` + `articles` + `sources` from KV (one-time script)                 | ✅ Done        | `20260520000010_seed_materials_articles_sources.sql`  |
| 10   | Add FK constraints to `guides` (`material_id → uuid`, `created_by → user_profiles`) | ✅ Done        | `20260520000012_add_fk_guides.sql`                    |
| 11   | Add FK constraint to `blog_posts` (`created_by → user_profiles`)                    | ✅ Done        | `20260520000013_add_fk_blog_posts.sql`                |
| 12   | Switch contribution routes to Postgres                                              | ⬜ Not started | —                                                     |
| 13   | Switch materials read routes to Postgres                                            | ⬜ Not started | —                                                     |
| 14   | Switch materials write routes to Postgres                                           | ⬜ Not started | —                                                     |
| 15   | Drop KV namespaces (irreversible — requires explicit team approval)                 | ⬜ Not started | —                                                     |

> Steps 1–7 are purely additive (new tables only). The KV store is untouched and the live site is unaffected until Step 12.

---

## Current State

Materials live as monolithic JSON blobs in `kv_store_17cae920`. Each blob contains:

- Core identification and sustainability scores
- Scientific parameter values and confidence intervals
- `sources[]` — embedded citation objects
- `articles.{compostability|recyclability|reusability}[]` — embedded rich-text articles
- `wiki` — Wikimedia enrichment metadata

The `guides` table in Postgres already has `material_id` (text) and `material_name` (text) pointing back to KV materials. This is the only existing relational link.

---

## Articles: Embedded vs. Separate Table

### Option A: Keep articles embedded in materials (current approach)

**Pros**

- Single read returns everything for a material page — no joins
- Works naturally with a KV or document store

**Cons**

- Cannot query across articles independently (e.g., "latest published articles", "all articles by author X", "unreviewed articles queue")
- Updating one article requires rewriting the entire material blob — expensive, error-prone, hard to audit
- No referential integrity — a deleted material silently orphans all its articles
- Cannot paginate or full-text search articles without scanning every material
- Articles cannot be associated with more than one category or material without duplication
- Difficult to apply separate RLS policies to articles vs. materials
- The KV blob grows unboundedly as articles accumulate — backup and restore complexity scales with it
- Already partially denormalized: the type definition marks `articles` as legacy and the field is optional

### Option B: Separate `articles` table (recommended)

**Pros**

- Each article is a first-class row with its own lifecycle (draft → published → archived), author, timestamps, and RLS
- A material page load is one `SELECT` + one `JOIN` — negligible overhead in Postgres
- Independent querying: unreviewed queue, author attribution, category feeds, full-text search (pg_trgm / pgvector)
- Update one article = update one row, not re-serialize a 50 KB blob
- Natural FK to `materials.id` — delete cascades can be controlled explicitly
- Consistent with how `guides` already works (separate table with `material_id`)
- Enables articles and guides to share infrastructure (review queue, status workflow, audit trail)

**Cons**

- Material page load requires a join (trivially handled by Supabase's `select("*, articles(*)")`)
- Slightly more complex initial migration

**Verdict: Separate table.** The embedded approach was a KV-era compromise. Moving to Postgres makes the cost of a join effectively zero, while the benefits — independent querying, referential integrity, RLS, audit trails — are significant. The type definition already anticipates this; `articles` is marked as a legacy field.

---

## Proposed Schema

### `materials`

| Column                                        | Type                                        | Notes                                                                                                             |
| --------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `id`                                          | `uuid` PK                                   | Replace KV string IDs (e.g. `1766171968045mo810ba66`) with UUIDs; store old ID as `legacy_kv_id` during migration |
| `legacy_kv_id`                                | `text` UNIQUE NULLABLE                      | Migration bridge; drop after all FK references are updated                                                        |
| `name`                                        | `text` NOT NULL                             |                                                                                                                   |
| `slug`                                        | `text` UNIQUE NOT NULL                      | Permalink-safe; derived from name                                                                                 |
| `aliases`                                     | `text[]`                                    |                                                                                                                   |
| `category_id`                                 | `text` REFERENCES `material_categories(id)` | Stable slug FK                                                                                                    |
| `description`                                 | `text`                                      |                                                                                                                   |
| `is_hub`                                      | `boolean` DEFAULT false                     |                                                                                                                   |
| `compostability`                              | `smallint`                                  | 0–100 public score                                                                                                |
| `recyclability`                               | `smallint`                                  | 0–100 public score                                                                                                |
| `reusability`                                 | `smallint`                                  | 0–100 public score                                                                                                |
| `y_value` … `e_value`                         | `numeric(6,4)`                              | Recyclability parameters (0–1)                                                                                    |
| `cr_practical_mean`                           | `numeric(6,4)`                              |                                                                                                                   |
| `cr_theoretical_mean`                         | `numeric(6,4)`                              |                                                                                                                   |
| `cr_practical_ci95`                           | `jsonb`                                     | `{lower, upper}`                                                                                                  |
| `cr_theoretical_ci95`                         | `jsonb`                                     |                                                                                                                   |
| `b_value` … `h_value`                         | `numeric(6,4)`                              | Compostability parameters                                                                                         |
| `cc_practical_mean`                           | `numeric(6,4)`                              |                                                                                                                   |
| `cc_theoretical_mean`                         | `numeric(6,4)`                              |                                                                                                                   |
| `cc_practical_ci95`                           | `jsonb`                                     |                                                                                                                   |
| `cc_theoretical_ci95`                         | `jsonb`                                     |                                                                                                                   |
| `l_value`, `r_value`, `u_value`, `c_ru_value` | `numeric(6,4)`                              | Reusability parameters                                                                                            |
| `ru_practical_mean`                           | `numeric(6,4)`                              |                                                                                                                   |
| `ru_theoretical_mean`                         | `numeric(6,4)`                              |                                                                                                                   |
| `ru_practical_ci95`                           | `jsonb`                                     |                                                                                                                   |
| `ru_theoretical_ci95`                         | `jsonb`                                     |                                                                                                                   |
| `confidence_level`                            | `text`                                      | `'High' \| 'Medium' \| 'Low'`                                                                                     |
| `whitepaper_version`                          | `text`                                      | e.g. `elements-v1`                                                                                                |
| `calculation_timestamp`                       | `timestamptz`                               |                                                                                                                   |
| `method_version`                              | `text`                                      | e.g. `CR-v1`                                                                                                      |
| `wiki`                                        | `jsonb` NULLABLE                            | Wikimedia enrichment; semi-structured, keep as jsonb                                                              |
| `status`                                      | `text` DEFAULT `'published'`                | `draft \| published \| archived`                                                                                  |
| `created_by`                                  | `uuid` REFERENCES `auth.users`              |                                                                                                                   |
| `created_at`                                  | `timestamptz` DEFAULT `now()`               |                                                                                                                   |
| `updated_at`                                  | `timestamptz` DEFAULT `now()`               |                                                                                                                   |

> **Scientific parameters as flat columns vs. jsonb:** Flat columns are recommended here because each parameter has a defined name, is individually queryable, and participates in score calculations. A `parameters jsonb` catch-all would make calculated indexes impossible and schema evolution harder to track.

---

### `material_categories`

| Column       | Type                    | Notes                                      |
| ------------ | ----------------------- | ------------------------------------------ |
| `id`         | `text` PK               | Stable slug, e.g. `paper-cardboard`        |
| `name`       | `text` NOT NULL         | Display name                               |
| `aliases`    | `text[]`                | Previous display names for legacy matching |
| `deleted`    | `boolean` DEFAULT false | Soft delete                                |
| `created_at` | `timestamptz`           |                                            |
| `updated_at` | `timestamptz`           |                                            |

---

### `articles`

| Column                    | Type                                                         | Notes                                                                  |
| ------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `id`                      | `uuid` PK                                                    |                                                                        |
| `material_id`             | `uuid` NOT NULL REFERENCES `materials(id)` ON DELETE CASCADE |                                                                        |
| `title`                   | `text` NOT NULL                                              |                                                                        |
| `slug`                    | `text` NOT NULL                                              | Unique per material: `UNIQUE (material_id, slug)`                      |
| `sustainability_category` | `text` NOT NULL                                              | `compostability \| recyclability \| reusability`                       |
| `article_type`            | `text` NOT NULL                                              | `DIY \| Industrial \| Experimental`                                    |
| `content`                 | `jsonb` NOT NULL                                             | Tiptap JSON — use `jsonb`, not `text`, unlike current `guides.content` |
| `cover_image_url`         | `text`                                                       |                                                                        |
| `status`                  | `text` DEFAULT `'draft'`                                     | `draft \| published \| archived`                                       |
| `version`                 | `integer` DEFAULT 1                                          |                                                                        |
| `created_by`              | `uuid` REFERENCES `auth.users`                               |                                                                        |
| `edited_by`               | `uuid` REFERENCES `auth.users`                               |                                                                        |
| `writer_name`             | `text`                                                       |                                                                        |
| `editor_name`             | `text`                                                       |                                                                        |
| `created_at`              | `timestamptz` DEFAULT `now()`                                |                                                                        |
| `updated_at`              | `timestamptz` DEFAULT `now()`                                |                                                                        |

---

### `sources` (global source library)

Currently a separate KV namespace (`kv:sources`). These are the research papers/documents themselves.

| Column               | Type                           | Notes                    |
| -------------------- | ------------------------------ | ------------------------ |
| `id`                 | `uuid` PK                      |                          |
| `legacy_kv_id`       | `text` UNIQUE NULLABLE         | Migration bridge         |
| `title`              | `text` NOT NULL                |                          |
| `authors`            | `text`                         |                          |
| `year`               | `smallint`                     |                          |
| `doi`                | `text`                         |                          |
| `url`                | `text`                         |                          |
| `pdf_file_name`      | `text`                         | Path in Supabase Storage |
| `manual_oa_override` | `boolean` DEFAULT false        |                          |
| `created_by`         | `uuid` REFERENCES `auth.users` |                          |
| `created_at`         | `timestamptz`                  |                          |
| `updated_at`         | `timestamptz`                  |                          |

---

### `material_sources` (junction)

Replaces the embedded `sources[]` array inside each material. Captures how a source contributed to a specific material's scores.

| Column        | Type                                                | Notes                                                             |
| ------------- | --------------------------------------------------- | ----------------------------------------------------------------- |
| `material_id` | `uuid` REFERENCES `materials(id)` ON DELETE CASCADE |                                                                   |
| `source_id`   | `uuid` REFERENCES `sources(id)` ON DELETE RESTRICT  |                                                                   |
| `weight`      | `numeric(4,3)`                                      | 0–1 aggregation weight                                            |
| `parameters`  | `text[]`                                            | Which parameters this source informed (e.g. `{Y_value, D_value}`) |
| PK            | `(material_id, source_id)`                          |                                                                   |

---

### `material_links` (hub relationships)

Replaces `linkedMaterialIds[]` embedded in hub materials.

| Column               | Type                                                | Notes |
| -------------------- | --------------------------------------------------- | ----- |
| `hub_material_id`    | `uuid` REFERENCES `materials(id)` ON DELETE CASCADE |       |
| `linked_material_id` | `uuid` REFERENCES `materials(id)` ON DELETE CASCADE |       |
| PK                   | `(hub_material_id, linked_material_id)`             |       |

---

### `user_profiles`

Currently split across three KV keys per user:

- `user_profile:${userId}` — name, bio, social_link, avatar_url, display_email, show_on_leaderboard, org_role, created_at, updated_at
- `user_role:${userId}` — a single string: `"user" | "staff" | "admin"`
- `user_last_signin:${userId}` — a Unix timestamp

This split is the root cause of the clunky contribution queries. Because user identity is in KV and content (`created_by` UUIDs) is spread across materials/articles/guides, finding all of a user's work requires full-table KV scans on every profile page load. Consolidating to a Postgres table makes all contribution lookups simple `WHERE created_by = $1` queries with an index.

| Column                | Type                                                    | Notes                                                        |
| --------------------- | ------------------------------------------------------- | ------------------------------------------------------------ |
| `id`                  | `uuid` PK REFERENCES `auth.users(id)` ON DELETE CASCADE | Same UUID as `auth.users` — no surrogate key needed          |
| `email`               | `text` NOT NULL                                         | Denormalized from `auth.users` for convenience               |
| `name`                | `text` NOT NULL                                         | Display name                                                 |
| `bio`                 | `text` DEFAULT `''`                                     |                                                              |
| `social_link`         | `text` DEFAULT `''`                                     |                                                              |
| `avatar_url`          | `text` DEFAULT `''`                                     |                                                              |
| `display_email`       | `text` DEFAULT `''`                                     | Optional public-facing email (may differ from auth email)    |
| `org_role`            | `text` DEFAULT `'Volunteer'`                            | Freeform org title, e.g. "Volunteer", "Researcher"           |
| `role`                | `text` NOT NULL DEFAULT `'user'`                        | `user \| staff \| admin` — replaces `user_role:${id}` KV key |
| `show_on_leaderboard` | `boolean` DEFAULT true`                                 |                                                              |
| `last_signin_at`      | `timestamptz`                                           | Replaces `user_last_signin:${id}` KV key                     |
| `created_at`          | `timestamptz` DEFAULT `now()`                           |                                                              |
| `updated_at`          | `timestamptz` DEFAULT `now()`                           |                                                              |

**RLS policy design:**

- Public can read rows where `show_on_leaderboard = true` (for leaderboard)
- Authenticated user can read/update their own row (`id = auth.uid()`)
- `role` column is only writable by staff/admin (enforce via RLS `USING` + `WITH CHECK` on updates)

**Contribution queries post-migration** become dead simple — no KV scanning:

```sql
-- Stats for profile page
SELECT
  (SELECT COUNT(*) FROM materials WHERE created_by = $1) AS materials,
  (SELECT COUNT(*) FROM articles  WHERE created_by = $1) AS articles,
  (SELECT COUNT(*) FROM guides    WHERE created_by = $1) AS guides;

-- Recent contributions (all types, unified, sorted)
SELECT 'material' AS type, id, name AS title, created_at FROM materials WHERE created_by = $1
UNION ALL
SELECT 'article',          id, title,          created_at FROM articles  WHERE created_by = $1
UNION ALL
SELECT 'guide',            id, title,          created_at FROM guides    WHERE created_by = $1
ORDER BY created_at DESC LIMIT 10;

-- Activity calendar (group by date)
SELECT DATE(created_at) AS date, COUNT(*) FROM (
  SELECT created_at FROM materials WHERE created_by = $1
  UNION ALL SELECT created_at FROM articles WHERE created_by = $1
  UNION ALL SELECT created_at FROM guides   WHERE created_by = $1
) all_contribs
WHERE created_at >= NOW() - INTERVAL '1 year'
GROUP BY DATE(created_at);
```

Compare to the current approach: three separate routes, each doing `kv.getByPrefix("material:")` to scan every material blob in the database.

---

### `guides` (existing — changes needed)

The existing `guides` table works well. Three changes required after this migration:

1. `material_id` is currently `text` — change to `uuid REFERENCES materials(id)` after migration bridge is in place
2. `content` is currently `text` — change to `jsonb` (same improvement as articles)
3. `created_by` is currently `uuid` with no FK — add `REFERENCES user_profiles(id)` once user_profiles exists

The `material_name` and `author_name` denormalized columns can be dropped once FKs are in place (join to get them).

The same `author_name` / `created_by` FK cleanup applies to `blog_posts`.

---

## Relationship Diagram

```
auth.users
    │ 1
    │ 1
user_profiles ─────────────────────────────────────────┐
    │                                                   │
    │ created_by FK on all content tables               │
    ▼                                                   │
material_categories                                     │
    │ 1                                                 │
    │ ∞                                                 │
materials ──────────────── material_links (self-join)   │
    │ 1              1 ∞                                │
    ├── ∞ articles ─────────────────────────────────────┤
    │                                                   │
    └── ∞ material_sources ── 1 sources ────────────────┤
    │                                                   │
    └── ∞ guides ───────────────────────────────────────┤
                                                        │
        blog_posts ─────────────────────────────────────┘
```

---

## Migration Strategy

The migration needs to be non-destructive because the KV store remains live until cutover.

1. **Create `user_profiles` table first** — it is referenced by all other content tables as a FK target; seed it from KV `user_profile:*` + `user_role:*` keys
2. **Create remaining tables** behind a feature flag — no production traffic yet
3. **Add `legacy_kv_id`** columns on `materials` and `sources` as migration bridges
4. **Write a one-time migration script** that reads all KV material blobs and inserts into the relational tables, preserving old IDs in `legacy_kv_id`
5. **Update `guides.material_id`** from old string IDs to new UUIDs using `legacy_kv_id` as the lookup; add FK constraint
6. **Add `created_by` FKs** on guides and blog_posts pointing to `user_profiles(id)`
7. **Switch API routes** to read from Postgres instead of KV — one route at a time, behind a toggle; start with contribution stats (highest pain, clearest win)
8. **Validate with backups** — run a full-site backup before and after each route switch, diff the data
9. **Drop KV material/article/source/user_profile/user_role blobs** once all reads are confirmed correct
10. **Drop `legacy_kv_id`** columns and remaining `kv_store_17cae920` namespace entries in a final cleanup migration - DO NOT DO THIS WITHOUT EXPLICIT PERMISSION FROM THE TEAM, as it is irreversible and would break the ability to roll back to KV if needed.

---

## What Would Help Next

To finalize the schema before writing migration SQL:

- **A sample material blob** from the KV store (full JSON, not summarized) — to verify all field names match the TypeScript types exactly, especially any with articles
- **Current source records** — a few raw KV source objects to confirm the `sources` table column set is complete
- **Counts**: how many materials, articles per material, and sources are in the KV store currently (the backup shows ~1,494 KV records total across all namespaces)
- **RLS requirements**: who should be able to read/write materials, articles, and sources? (public read, staff write, admin delete?)
- **Full-text search needs**: is search on material name + description sufficient, or do article contents need to be searchable too?
- **MIU/evidence migration**: evidence points are currently nested inside material blobs — should they become a separate `evidence` table too, or is that a phase 2 concern?
