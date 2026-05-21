# Materials Relational Schema Plan

**Updated:** May 21, 2026  
**Status:** In Progress

---

## Implementation Progress

| Step | Description                                                                         | Status     | Migration File                                        |
| ---- | ----------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------- |
| 1    | Create `user_profiles` table                                                        | ✅ Done    | `20260520000002_create_user_profiles_table.sql`       |
| 2    | Create `material_categories` table                                                  | ✅ Done    | `20260520000003_create_material_categories_table.sql` |
| 3    | Create `materials` table                                                            | ✅ Done    | `20260520000004_create_materials_table.sql`           |
| 4    | Create `articles` table                                                             | ✅ Done    | `20260520000005_create_articles_table.sql`            |
| 5    | Create `sources` table                                                              | ✅ Done    | `20260520000006_create_sources_table.sql`             |
| 6    | Create `material_sources` junction table                                            | ✅ Done    | `20260520000007_create_material_sources_table.sql`    |
| 7    | Create `material_links` junction table                                              | ✅ Done    | `20260520000008_create_material_links_table.sql`      |
| 8    | Seed `user_profiles` from KV (one-time script)                                      | ✅ Done    | `20260520000009_seed_user_profiles.sql`               |
| 9    | Seed `materials` + `articles` + `sources` from KV (one-time script)                 | ✅ Done    | `20260520000010_seed_materials_articles_sources.sql`  |
| 10   | Add FK constraints to `guides` (`material_id → uuid`, `created_by → user_profiles`) | ✅ Done    | `20260520000012_add_fk_guides.sql`                    |
| 11   | Add FK constraint to `blog_posts` (`created_by → user_profiles`)                    | ✅ Done    | `20260520000013_add_fk_blog_posts.sql`                |
| 12   | Switch contribution routes to Postgres                                              | ✅ Done    | —                                                     |
| 13   | Switch materials read routes to Postgres                                            | ✅ Done    | —                                                     |
| 14   | Switch materials write routes to Postgres                                           | ✅ Done    | —                                                     |
| 15   | Create `evidence_points` table and migrate MIU data from KV to Postgres             | ✅ Done    | `20260521000000_create_evidence_points_table.sql`     |
| 16   | Audit trail verification — add missing `createAuditLog` calls to all write routes   | ✅ Done    | —                                                     |
| 17   | Migrate `audit_log` from KV to Postgres — unbounded, indexed, queryable             | ✅ Done    | `20260521000001_create_audit_log_table.sql`           |
| 18   | Switch `user_profile` write paths to Postgres — eliminate KV dual-write             | ✅ Done    | —                                                     |
| 19   | Consolidate roles into `user_profiles` — add `role` column, remove `user_role:*`    | ✅ Done    | `20260521000002_add_role_to_user_profiles.sql`        |
| 20   | Drop migrated KV namespaces (deferred — see note below)                             | ⏸ Deferred | —                                                     |

> Steps 1–19 are complete. Step 20 (KV drop) is deferred — `session:*` and several other namespaces are still actively written and have no Postgres equivalent yet. Only `audit:*` is safe to delete today.

---

## Current State (as of May 21, 2026)

**Previously:** Materials lived as monolithic JSON blobs in `kv_store_17cae920`, each containing core scores, scientific parameters, embedded `sources[]`, embedded `articles.{compostability|recyclability|reusability}[]`, and Wikimedia metadata.

**Now:** All content lives in Postgres. `GET /materials` reads from the `materials` table (with joined `material_categories`, `articles`, and `material_sources` → `sources`). All write routes (`POST`, `PUT`, `DELETE`, batch) write to Postgres and no longer touch KV. The `evidence_points` table holds MIU/scientific evidence data. KV is now unused for material or evidence data — the only remaining KV usage is for sessions, roles, rate limits, and legacy standalone `article:*` / `source:*` blobs (not yet migrated).

### Step 16: Audit trail gaps closed (May 21, 2026)

An audit of all write routes found the following gaps, all now fixed:

| Route                            | Risk                                                      | Fix                                                |
| -------------------------------- | --------------------------------------------------------- | -------------------------------------------------- |
| `DELETE /materials` (delete-all) | **High** — wiped all materials silently                   | Added `createAuditLog` with full `before` snapshot |
| `POST /articles`                 | Medium — no record of article creation                    | Added `createAuditLog` with `create` action        |
| `PUT /articles/:id`              | Medium — no record of article edits                       | Added `createAuditLog` with `before`/`after` diff  |
| `DELETE /articles/:id`           | Medium — no record of article deletions                   | Added `createAuditLog` with `before` snapshot      |
| `POST /sources/batch`            | Medium — silent bulk-sync of entire source library        | Added `createAuditLog` with count + preview        |
| `POST /materials/batch`          | Low — routine small-batch saves (≤5 item Δ) were unlogged | Removed the conditional; all batch saves now log   |

Note: `POST /articles`, `PUT /articles/:id`, `DELETE /articles/:id`, and `POST /sources/batch` still write to KV (they predate the Postgres migration). Audit logging is now in place regardless. Full migration of these routes is a future step.

### Step 17: Migrate audit_log from KV to Postgres

**Problem:** `kv.getByPrefix("audit:")` is hard-capped at 1000 entries. Once the audit log exceeded this limit, new writes were invisible to the read/stats/filter endpoints. Emails confirmed writes were succeeding, but the cap prevented them from appearing in queries.

**Solution:**

- Migration `20260521000001_create_audit_log_table.sql` creates `public.audit_log` with proper indexes (`timestamp DESC`, `entity_type`, `entity_id`, `action`, `user_id`) and service-role-only RLS.
- `createAuditLog` now inserts directly to Postgres instead of calling `kv.set`. `sendAuditEmailNotification` behavior is unchanged.
- `GET /audit/logs` uses Postgres SELECT with the same filter params (`entityType`, `entityId`, `userId`, `action`, `startDate`, `endDate`, `limit`, `offset`) and returns the same `{ logs, total, offset, limit }` shape with camelCase fields.
- `GET /audit/logs/:id` uses Postgres `.eq("id", id)`.
- `GET /audit/stats` uses Postgres for `total` count and in-memory aggregation for `byEntityType`, `byAction`, `byUser`, `recentActivity`.
- `POST /admin/audit/seed-from-kv` reads all `audit:*` KV entries and inserts them into Postgres. Skips entries already present by `id`. **Does NOT call `createAuditLog` or `sendAuditEmailNotification`** — no emails triggered during the seed.
- Frontend: `seedAuditLogFromKV()` added to `src/utils/api.tsx`; "Seed Audit Log from KV" action added to `OneTimeActionsPanel`.

**Status: ✅ Complete. 1308 KV entries migrated (308 were beyond the old 1000-row cap). All audit writes now go directly to Postgres.**

We chose **Option B — separate `articles` table** (over keeping articles embedded in material blobs). The `articles` table was created in Step 4 and seeded in Step 9.

**Rationale:** The embedded approach was a KV-era compromise. Moving to Postgres makes the join cost negligible, while the benefits are significant:

- Each article is a first-class row with its own lifecycle, author, timestamps, and RLS
- Independent querying (unreviewed queue, author feeds, full-text search)
- Update one article = update one row, not re-serialize a 50 KB blob
- Natural FK to `materials.id` with controlled cascade
- Consistent with `guides` (same pattern, same infrastructure)

---

## Step 13 Route Changes

The following route was switched from a KV scan to Postgres reads on May 21, 2026:

| Route            | Before                                                              | After                                                                                           |
| ---------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `GET /materials` | `kv.getEntriesByPrefix("material:")` + `normalizeMaterialFromEntry` | Postgres `materials` + joined `material_categories`, `articles`, `material_sources` → `sources` |

**Field mapping** (KV camelCase → Postgres snake_case → response camelCase):

- `id` ← `legacy_kv_id` (KV string ID preserved for backward compatibility)
- `category` ← `material_categories.name` looked up via `category_id`; falls back to raw `category_id`
- `isHub` ← `is_hub`, `linkedMaterialIds` ← `linked_material_ids`
- `Y_value` … `C_RU_value` ← `y_value` … `c_ru_value` (cast `NUMERIC` → `Number`)
- `CR_practical_CI95` … `RU_theoretical_CI95` ← JSONB columns (passed through as-is)
- `articles` ← all published rows from `articles` grouped by `legacy_material_kv_id` + `sustainability_category`
- `sources` ← `material_sources` with embedded `sources` join (weight, parameters preserved)

**KV write routes are unchanged** — `POST /materials`, `PUT /materials/:id`, `DELETE /materials/:id`, and `POST /materials/batch` still write to KV. That changed in Step 14.

---

## Step 14 Route Changes

The following routes were switched from KV writes to Postgres on May 21, 2026:

| Route                   | Before                                       | After                                                             |
| ----------------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| `POST /materials`       | `kv.set("material:${id}", material)`         | `materials.upsert(row, { onConflict: "legacy_kv_id" })` + sources |
| `POST /materials/batch` | `kv.mdel(oldKeys)` + `kv.mset(keys, values)` | Postgres upsert per material, delete removed materials            |
| `PUT /materials/:id`    | `kv.get` + `kv.set`                          | `materials.update(row).eq("legacy_kv_id", id)`                    |
| `DELETE /materials/:id` | `kv.del("material:${id}")`                   | Delete from `material_sources`, `articles`, `materials` by KV ID  |
| `DELETE /materials`     | `kv.getByPrefix` + `kv.mdel`                 | Delete all rows from `material_sources`, `articles`, `materials`  |

**Helpers added:**

- `materialToPostgresRow(material)` — maps the Material interface (camelCase) to a Postgres row (snake_case). Handles numeric coercion, UUID validation, and status enum validation (defaults to `"published"`).
- `upsertMaterialSources(supabase, kvId, sources)` — deletes existing `material_sources` for the material, then re-inserts each source after deduplicating against the `sources` table by DOI (primary) or title+year (fallback), inserting new source rows as needed.

**Key decisions:**

- `on_behalf_of` is now validated against the `user_profiles` Postgres table (previously KV `user_role:` and `user_profile:` keys).
- `created_at` and `created_by` from existing Postgres rows are preserved on re-save — the incoming material cannot overwrite them.
- The batch route does **not** delete articles for removed materials (articles are now independent content). The single-material DELETE does cascade-delete related articles.
- The batch route's `deleted` count in the response refers to materials removed from Postgres (not in the new array).
- KV is now completely unused for material data.

---

## Step 12 Route Changes

The following routes were switched from full `kv.getByPrefix("material:")` scans to Postgres queries on May 21, 2026:

| Route                                     | Before                                               | After                                                           |
| ----------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------- |
| `GET /profile/:id/contributions/stats`    | Full KV scan, filter by `created_by`                 | `COUNT` queries on `materials`, `articles`, `guides`            |
| `GET /profile/:id/contributions/activity` | Full KV scan + date filter                           | `SELECT created_at` from Postgres with date range               |
| `GET /profile/:id/contributions/recent`   | Full KV scan + nested article iteration              | `SELECT` ordered by `created_at DESC` on each table             |
| `GET /admin/stats`                        | Full KV scan + `user_profile:` prefix scan           | `COUNT` on all 4 Postgres tables                                |
| `GET /leaderboard`                        | Full KV scan + per-user `kv.get("user_profile:...")` | Bulk `SELECT created_by` + single `user_profiles` `.in()` query |

> **MIU (evidence point) counts** remain KV-based in all routes — no `evidence` Postgres table exists yet.

### Performance improvement

Each KV route did a full `kv.getByPrefix("material:")` prefix scan — deserializing every material blob (~50 KB each) into memory on every request. With Postgres, each of these is now a single indexed query:

| Route                     | KV: operations per call                                            | Postgres: operations per call                                   |
| ------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------- |
| `/contributions/stats`    | Deserialize all ~N material blobs, filter by `created_by`          | 3 indexed `COUNT` queries                                       |
| `/contributions/activity` | Deserialize all ~N blobs, iterate nested articles with date filter | 3 range scans on indexed `created_at`                           |
| `/contributions/recent`   | Deserialize all ~N blobs, flatten and sort nested articles         | 3 index seeks ordered by `created_at DESC`                      |
| `/admin/stats`            | Deserialize all ~N material blobs + all M user_profile blobs       | 4 `COUNT` queries                                               |
| `/leaderboard`            | Deserialize all ~N material blobs + 1 `kv.get` per leader          | 3 `SELECT created_by` + 1 batched `user_profiles` `.in()` fetch |

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

## Steps 18–19 Plan

### Step 18: Switch `user_profile` write paths to Postgres

The `user_profiles` table already exists and most reads already come from Postgres. The remaining KV dual-writes are in:

- `POST /auth/signup` — `kv.set("user_profile:${id}", initialProfile)`
- Magic link callback — `kv.set("user_profile:${id}", ...)`
- OAuth callback — reads then maybe sets `user_profile:*`
- `PUT /users/:id` — `kv.set("user_profile:${id}", updatedProfile)`
- Profile GET — falls back to `kv.get("user_profile:${id}")` if Postgres returns nothing

**Work:** Switch each of these to `user_profiles.upsert()`. Remove KV fallback reads once the table is confirmed populated. Existing `user_profiles` Postgres table schema is from Step 1 — no new migration needed. Add a "Seed user_profiles from KV" one-time action if any gaps are found.

### Step 19: Consolidate roles into `user_profiles`

`user_role:*` is read on every authenticated request (inside `verifyAdmin` and throughout the auth flow) and is currently a plain string in KV. The `user_profiles` table already has context about each user — role belongs there.

**Work:**

1. Add `role TEXT NOT NULL DEFAULT 'user'` column to `user_profiles` (migration)
2. Backfill from `user_role:*` KV entries (one-time admin action or inline migration script)
3. Switch `verifyAdmin`, role GET/SET, sign-up, and magic link to read/write `user_profiles.role`
4. Remove all `kv.get/set("user_role:*")` calls

**Benefit:** Eliminates one KV round-trip per authenticated request. Role is now a proper column — queryable, FK-joinable, auditable.

### Step 20: Drop migrated KV namespaces (deferred)

Safe to delete today: `audit:*`

Blocked until Steps 18–19 complete: `user_profile:*`, `user_role:*`

Blocked until sessions are evaluated: `session:*`, `magic_token:*`, `failed_attempts:*`, `user_last_signin:*`, `auth_email_alias:*`, `recent_signups:*`

Blocked until migrated: `whitepaper:*`, `site_settings:*`, `role_permissions:*`, `site:maintenance_mode`

Still dual-writing (routes not yet switched): `article:*`, `source:*`

---

## What Would Help Next

To finalize the schema before writing migration SQL:

- **A sample material blob** from the KV store (full JSON, not summarized) — to verify all field names match the TypeScript types exactly, especially any with articles
- **Current source records** — a few raw KV source objects to confirm the `sources` table column set is complete
- **Counts**: how many materials, articles per material, and sources are in the KV store currently (the backup shows ~1,494 KV records total across all namespaces)
- **RLS requirements**: who should be able to read/write materials, articles, and sources? (public read, staff write, admin delete?)
- **Full-text search needs**: is search on material name + description sufficient, or do article contents need to be searchable too?
- **MIU/evidence migration**: evidence points are currently nested inside material blobs — should they become a separate `evidence` table too, or is that a phase 2 concern?
