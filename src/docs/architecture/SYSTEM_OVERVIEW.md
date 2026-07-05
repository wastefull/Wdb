# System Overview

WasteDB is a React application backed by a Supabase Edge Function, Supabase
Auth, Postgres, Storage, and a remaining compatibility KV store.

## Application Layers

- **Client:** React views, admin tools, content workflows, visualizations, and
  the roadmap/test interface.
- **API:** Hono application in `src/supabase/functions/server/index.tsx`.
- **Relational data:** authoritative domain tables in Postgres.
- **Compatibility KV:** sessions and legacy operational namespaces that have
  not yet received relational replacements.
- **Storage:** uploaded source PDFs and application assets.

## Current Sources of Truth

- Roadmap and acceptance gates: `src/config/roadmap.ts`
- Database schema history: `supabase/migrations/`
- Current domain data: Postgres tables listed in
  [Data Model](./DATA_MODEL.md)
- Remaining compatibility records: `kv_store_17cae920`
- Methodology: `src/whitepapers/`

## Compatibility Principle

Domain tables remain authoritative during the knowledge-graph program. Graph
tables will be an additive discovery index, not a replacement for detailed
material, article, guide, source, or evidence records.

Every migration must preserve original data, attribution, evidence, audit
history, and restorable backups. Unknown or ambiguous records must be retained
for manual review rather than silently discarded.

## Graph Mutation Boundary

Graph writes are exposed through authenticated Edge routes and governed
database transactions rather than direct browser table access. For normal
content-to-material curation, the admin Content Management interface calls the
service-role-only `create_manual_content_mapping` transaction. It creates one
pending-review mapping together with its outbox event and audit record.

The checksum-bound content-mapping preview, quarantine, and apply endpoints are
separate bulk migration tools. Their apply gate is not part of ordinary manual
curation and remains closed outside an approved migration window.
