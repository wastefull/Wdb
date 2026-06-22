# Knowledge Graph Migration and Safety Plan

This document defines the Stage 6 migration design and the safety requirements
that govern Stages 6-10. It is a plan, not permission to run destructive
changes.

## Non-Negotiable Safety Rules

- Domain tables remain authoritative; graph tables are additive.
- No legacy field or table is dropped during the initial migration.
- Create and validate a versioned full-site backup before migration writes;
  store it outside the repository with restricted access and a recorded
  checksum and location.
- Dry runs report inserts, updates, conflicts, unresolved references, and
  prospective removals without mutation.
- Backfills are idempotent, resumable, and safe to rerun.
- Unknown, ambiguous, or invalid records retain their original payloads in a
  review report or quarantine table.
- Reconcile counts, identifiers, relationships, and checksums before switching
  reads or writes.
- Existing backup and audit interfaces remain backward compatible where
  possible. Every incompatibility requires detection, documentation, and a
  manual recovery path.
- Destructive cleanup requires a separately approved migration.

Operational recovery procedures:
[Operations](../admin/OPERATIONS.md)

Stage 6 foundation deployment procedure:
[Knowledge Graph Foundation Runbook](./guides/KNOWLEDGE_GRAPH_FOUNDATION_RUNBOOK.md)

Production foundation deployment:
[June 22, 2026 Deployment Report](./guides/KNOWLEDGE_GRAPH_FOUNDATION_DEPLOYMENT_2026-06-22.md)

## Migration Execution Contract

Every automated or manual migration package must include:

1. A unique version and a statement of source and destination schemas.
2. Preconditions, including a validated backup stored with restricted access
   outside the repository and a required provider-level storage backup when
   storage could be affected.
3. A dry-run report with inserts, updates, conflicts, unresolved references,
   and prospective removals.
4. An idempotent apply operation with checkpoints and resume instructions.
5. A reconciliation report covering row counts, identifiers, relationships,
   checksums, and audit summaries.
6. Rollback instructions and explicit rollback limits.
7. A manual recovery action for every record category that cannot be safely
   automated.

Migration reports must preserve original payloads for unresolved records and
must never treat a skipped record as a successful migration.

## Completion Gates

A migration is not complete until all of the following are true:

- The pre-migration backup is validated and stored outside the repository with
  restricted access; its checksum and location are recorded. Any required
  storage backup is also verified.
- Dry-run conflicts and unresolved records have an owner and recovery path.
- Repeated execution and resume after partial failure produce no duplicates.
- Source and destination counts, identifiers, relationships, and checksums
  reconcile with zero unexplained loss.
- Existing backup, export, restore, audit-list, audit-detail, audit-statistics,
  and filtering interfaces pass their compatibility tests.
- Every incompatibility, irreversible action, and retention implication is
  documented before deployment.

Read or write cutover requires separate approval after these gates pass.
Destructive cleanup always requires a later, separately approved migration.

## Stage 6 Architecture Decisions

The Stage 6 architecture questions are resolved in
[ADR 001: Knowledge Graph Foundation](../architecture/ADR_001_KNOWLEDGE_GRAPH_FOUNDATION.md).

In summary:

1. Use an `entity_canonical_bindings` table with explicit nullable foreign
   keys rather than `canonical_table` plus `canonical_id`.
2. Use governed lookup tables for evolving graph vocabularies rather than
   Postgres enums.
3. Use RLS, pgTAP, and optional JSON Schema validation; keep Queues and Cron
   optional rather than migration dependencies.
4. Preserve unresolved payloads in versioned migration issue tables.
5. Use transactional database sync plus an idempotent outbox, not unrelated
   application-layer double writes.
6. Add graph-era full-site backup schema version 4.0 while preserving 3.0 and
   legacy merge-recovery paths.

## Purpose

This migration aligns WasteDB’s current Postgres schema with the Knowledge Graph and Educational Discovery roadmaps.

The goal is to preserve all existing information while adding a graph/discovery layer that supports:

- Material-to-material relationships

- Articles, guides, videos, and sources as first-class knowledge objects

- Discovery paths across materials, processes, policies, products, and impacts

- Flexible tagging without repeated schema changes

- Future UI features such as Knowledge Feed, Related Entities, and Deep Research views

This is not a full schema replacement. Existing domain tables should remain authoritative for their own detailed data.

⸻

1. Design Principle

Use the following separation:

Domain tables = detailed facts
Entities = graph nodes
Relationships = discovery structure
Tags = adaptive classification
Content relationships = knowledge feed wiring

Examples:

materials = material-specific data
articles = article content
guides = guide content
videos = video content
sources = citation/source data
entities = shared graph index
entity_relationships = graph edges
tags/entity_tags = flexible classification
content_entities = content-to-subject mapping

⸻

1. Tables to Preserve

Keep existing tables:

materials
material_categories
articles
guides
blog_posts
sources
material_sources
evidence_points
user_profiles
audit_log
changelog_entries
kv_store_17cae920

Do not drop old fields during the initial migration.

Legacy fields should remain until graph reads are verified in production.

⸻

1. New Tables

3.0 governed graph vocabularies

Purpose:

Keep evolving entity types, relationship types, tag types, content roles,
lifecycle focuses, and evidence uses in reviewed lookup tables rather than
Postgres enums.

At minimum, create:

entity_types
relationship_types
tag_types
content_roles
lifecycle_focuses
evidence_uses

Each vocabulary table should use a stable text slug as its primary key and
include a label, required description, inactive-by-default flag, approval
metadata, and timestamps. An active value requires an approval timestamp.

### Vocabulary governance workflow

New entity types, relationship types, tag types, content roles, lifecycle
focuses, and evidence-use values require a reviewed change proposal before
production use. The proposal must include:

- stable slug
- display label
- description
- intended use
- at least one concrete example
- proposer
- curator or admin approval

New terms remain inactive until approval. Renaming or retiring a term requires
an impact review covering existing rows, read adapters, exports, and recovery
procedures.

A relationship-type proposal must additionally include:

- forward display label
- inverse display label when applicable
- example source entity
- example target entity
- when not to use the relationship

This review prevents vocabulary sprawl and keeps graph meaning interpretable.

⸻

3.1 entities

Purpose:

Create a universal graph node table for materials, articles, guides, videos, sources, processes, policies, products, environmental impacts, and future entity types.

create table entities (
id uuid primary key default gen_random_uuid(),
entity_type text not null references entity_types(slug),
name text not null,
slug text null,
description text null,
status text not null default 'active',
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
unique (entity_type, slug)
);

Recommended entity_type values:

material
article
guide
blog_post
video
source
process
policy
product
environmental_impact
organization
technology
remediation_strategy

⸻

3.2 entity_relationships

Purpose:

Represent graph edges between any two entities.

create table entity_relationships (
id uuid primary key default gen_random_uuid(),
source_entity_id uuid not null references entities(id) on delete cascade,
target_entity_id uuid not null references entities(id) on delete cascade,
relationship_type text not null references relationship_types(slug),
metadata jsonb not null default '{}',
confidence numeric null,
created_by uuid null references user_profiles(id),
reviewed_by uuid null references user_profiles(id),
reviewed_at timestamptz null,
created_at timestamptz not null default now(),
constraint no_self_relationship
check (source_entity_id <> target_entity_id),
constraint unique_entity_relationship
unique (source_entity_id, target_entity_id, relationship_type)
);

Initial relationship types should remain broad:

discusses
related_to
derived_from
used_in
produced_by
feedstock_for
contains
affects
regulated_by
recycled_by
composted_by
demonstrates
explains
compares_with

Avoid adding many narrow relationship types early. Use metadata and tags for nuance.

The `discusses` relationship only means that one entity meaningfully addresses
another entity. It does not mean that the source supports a score, validates a
claim, agrees with WasteDB’s interpretation, or provides high-quality
evidence.

Evidence support remains governed by structured evidence tables, source
linkage, evidence points, review status, and score-specific metadata. Do not
infer evidentiary strength from a discovery relationship.

⸻

3.3 tags

Purpose:

Normalize current text[] tag fields and support flexible classification.

create table tags (
id uuid primary key default gen_random_uuid(),
slug text not null unique,
label text not null,
tag_type text null references tag_types(slug),
description text null,
created_at timestamptz not null default now()
);

Suggested tag_type values:

difficulty
lifecycle
topic
status
audience
process
risk
policy
format
evidence

⸻

3.4 entity_tags

Purpose:

Attach tags to any graph entity.

create table entity_tags (
entity_id uuid not null references entities(id) on delete cascade,
tag_id uuid not null references tags(id) on delete cascade,
confidence numeric null,
created_by uuid null references user_profiles(id),
created_at timestamptz not null default now(),
primary key (entity_id, tag_id)
);

⸻

3.5 content_entities

Purpose:

Represent how content entities discuss, explain, compare, or provide evidence for subject entities.

create table content_entities (
id uuid primary key default gen_random_uuid(),
content_entity_id uuid not null references entities(id) on delete cascade,
subject_entity_id uuid not null references entities(id) on delete cascade,
role text not null default 'mentioned' references content_roles(slug),
lifecycle_focus text null references lifecycle_focuses(slug),
evidence_use text null references evidence_uses(slug),
created_at timestamptz not null default now(),
constraint no_self_content_entity
check (content_entity_id <> subject_entity_id),
constraint unique_content_entity_role
unique (content_entity_id, subject_entity_id, role)
);

Recommended role values:

primary_subject
secondary_subject
mentioned
comparison
case_study
evidence
demonstrates
explains

Recommended lifecycle_focus values:

production
use
reuse
recycling
composting
degradation
toxicity
policy
market
remediation

Recommended evidence_use values:

recyclability
compostability
reusability
environmental_impact
policy_context
historical_context

⸻

3.6 videos

Purpose:

Make videos first-class knowledge objects.

create table videos (
id uuid primary key default gen_random_uuid(),
title text not null,
slug text unique,
youtube_url text not null,
youtube_id text unique,
description text null,
duration_seconds int null,
channel_name text null,
thumbnail_url text null,
transcript text null,
summary text null,
key_takeaways text[] null,
difficulty_level text null,
status text not null default 'draft',
created_by uuid null references user_profiles(id),
reviewed_by uuid null references user_profiles(id),
reviewed_at timestamptz null,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now()
);

Each video should also receive a corresponding entities row and canonical
binding.

⸻

3.7 entity_canonical_bindings

Purpose:

Connect domain-backed entities to authoritative rows with real foreign keys.
Create this table after the videos table exists, or add the video foreign key
in a later statement in the same migration.

create table entity_canonical_bindings (
entity_id uuid primary key references entities(id) on delete cascade,
material_id uuid unique null references materials(id) on delete restrict,
article_id uuid unique null references articles(id) on delete restrict,
guide_id uuid unique null references guides(id) on delete restrict,
blog_post_id uuid unique null references blog_posts(id) on delete restrict,
source_id uuid unique null references sources(id) on delete restrict,
video_id uuid unique null references videos(id) on delete restrict,
constraint exactly_one_canonical_reference check (
num_nonnulls(
material_id,
article_id,
guide_id,
blog_post_id,
source_id,
video_id
) = 1
)
);

Graph-native entities do not receive a canonical binding.

⸻

1. Evidence Table Adjustments

The current evidence_points table is already strong. Add graph/source linkage fields rather than replacing it.

alter table evidence_points
add column if not exists source_id uuid null references sources(id),
add column if not exists entity_id uuid null references entities(id),
add column if not exists score_category text null;

Recommended score_category values:

recyclability
compostability
reusability

material_id should remain for now.

Eventually, entity_id can support evidence for non-material entities such as processes, policies, products, or remediation strategies.

⸻

1. Backfill Strategy

5.1 Backfill material entities

For every row in materials, create one entities row and one canonical binding:

entity_type = material
name = materials.name
slug = materials.slug
description = materials.description
status = materials.status
entity_canonical_bindings.material_id = materials.id

⸻

5.2 Backfill article entities

For every row in articles, create one entities row and one canonical binding:

entity_type = article
name = articles.title
slug = articles.slug
description = null
status = articles.status
entity_canonical_bindings.article_id = articles.id

⸻

5.3 Backfill guide entities

For every row in guides, create one entities row and one canonical binding:

entity_type = guide
name = guides.title
slug = guides.slug
description = guides.description
status = guides.status
entity_canonical_bindings.guide_id = guides.id

⸻

5.4 Backfill blog post entities

For every row in blog_posts, create one entities row and one canonical binding:

entity_type = blog_post
name = blog_posts.title
slug = blog_posts.slug
description = blog_posts.excerpt
status = blog_posts.status
entity_canonical_bindings.blog_post_id = blog_posts.id

⸻

5.5 Backfill source entities

For every row in sources, create one entities row and one canonical binding:

entity_type = source
name = sources.title
slug = null
description = authors/year/doi/url summary if desired
status = active
entity_canonical_bindings.source_id = sources.id

⸻

1. Relationship Migration

6.1 Migrate material_links

Current table:

material_links
legacy_hub_kv_id
legacy_linked_kv_id

Migration:

1. Resolve legacy_hub_kv_id to materials.legacy_kv_id.

2. Resolve legacy_linked_kv_id to materials.legacy_kv_id.

3. Resolve both materials to their entity rows.

4. Insert into entity_relationships.

Default relationship:

relationship_type = related_to
metadata = { "legacy_source": "material_links" }

Do not over-infer relationship types during migration.

⸻

6.2 Migrate materials.linked_material_ids

Current field:

materials.linked_material_ids text[]

Migration:

1. For each material row, treat the material as the source.

2. Resolve each linked ID to a material row.

3. Insert relationship:

source = current material entity
target = linked material entity
relationship_type = related_to
metadata = { "legacy_source": "materials.linked_material_ids" }

⸻

6.3 Preserve is_hub

Do not migrate is_hub as a permanent graph concept.

For now:

1. Preserve the field on materials.

2. Optionally add an entity tag:

tag = hub
tag_type = status

Long term, hub status should be derived from graph degree or curated discovery importance.

⸻

1. Content Relationship Migration

7.1 Migrate articles.legacy_material_kv_id

Current field:

articles.legacy_material_kv_id

Migration:

1. Resolve articles.legacy_material_kv_id to materials.legacy_kv_id.

2. Resolve article to article entity.

3. Resolve material to material entity.

4. Insert into content_entities.

content_entity = article entity
subject_entity = material entity
role = primary_subject
evidence_use = articles.sustainability_category, if applicable

Also optionally insert into entity_relationships:

article entity → discusses → material entity

⸻

7.2 Migrate guides.material_id

Current fields:

guides.material_id
guides.material_name

Migration priority:

1. Match guides.material_id to materials.id if possible.

2. If not, match to materials.legacy_kv_id.

3. If not, match guides.material_name to materials.name or aliases.

4. If ambiguous, queue for manual review.

Insert:

content_entity = guide entity
subject_entity = material entity
role = primary_subject
lifecycle_focus = guides.method, if applicable

Also optionally insert:

guide entity → discusses → material entity

⸻

1. Tag Migration

8.1 Normalize article tags

From:

articles.tags text[]

To:

tags
entity_tags

Steps:

1. Lowercase and slugify each tag.

2. Insert into tags if missing.

3. Attach to the article entity in entity_tags.

⸻

8.2 Normalize guide tags

From:

guides.tags text[]

Same process as article tags.

⸻

8.3 Normalize blog post tags

From:

blog_posts.tags text[]

Same process as article tags.

⸻

8.4 Material aliases should not become tags

Keep:

materials.aliases
material_categories.aliases

Aliases are search/navigation data, not topical classifications.

⸻

1. Source and Evidence Migration

9.1 Link material_sources to graph entities

Current table:

material_sources
legacy_material_kv_id
source_id
weight
parameters

Migration:

1. Resolve legacy_material_kv_id to material.

2. Resolve material to material entity.

3. Resolve source to source entity.

4. Insert relationship:

source entity → supports_evidence_for → material entity

or, if keeping broad relationship types:

source entity → discusses → material entity
metadata = {
"weight": material_sources.weight,
"parameters": material_sources.parameters,
"legacy_source": "material_sources"
}

Recommendation: use broad discusses initially unless a stricter evidence relationship is clearly needed.

The same evidence-integrity rule applies here: `discusses` supports discovery,
not evidentiary attribution. A material score may cite a source only through
the reviewed evidence and source-linkage workflow.

⸻

9.2 Backfill evidence_points.source_id

Where possible:

1. Match evidence_points.source_ref to:
   - sources.doi

   - sources.url

   - sources.title

   - sources.pdf_file_name

2. Set evidence_points.source_id.

Ambiguous matches should be reviewed manually.

⸻

9.3 Backfill evidence_points.entity_id

For rows with material_id, set:

entity_id = material entity for evidence_points.material_id

For rows with only material_legacy_kv_id, resolve through materials.legacy_kv_id.

⸻

1. Fields to Deprecate Later

Do not drop these in the first migration.

Mark as legacy/deprecated in application code after backfill verification:

materials.linked_material_ids
materials.is_hub
articles.legacy_material_kv_id
guides.material_id
guides.material_name
articles.tags
guides.tags
blog_posts.tags
material_links
material_sources.legacy_material_kv_id
evidence_points.material_legacy_kv_id

Potentially keep material_sources permanently if it remains useful as a structured evidence-specific table.

⸻

1. Graph Authorization and Abuse Resistance

Relationships, tags, metadata, mappings, videos, and vocabularies shape what
WasteDB appears to know. Treat every graph mutation as a knowledge-shaping
operation.

RLS acceptance must cover every graph table and every meaningful actor:

- anonymous
- authenticated user
- contributor
- editor/curator
- admin
- service role

WasteDB currently maps authenticated users and contributors to the
`authenticated` database role for draft/proposal operations. Editors and
curators map to the `staff` profile role, admins map to `admin`, and server-only
workers use `service_role`. If those application roles diverge later, the RLS
matrix and tests must be updated before deployment.

At minimum, test:

- `entities`
- `entity_relationships`
- `entity_tags`
- `tags`
- `content_entities`
- `videos`
- every governed vocabulary table
- migration run, checkpoint, issue/quarantine, and outbox tables

For each actor and table, ask:

> Can this actor create, alter, or delete information that changes what
> WasteDB appears to know?

Any permitted capability must be explicit, tested, reviewable, and auditable.
Anonymous users cannot mutate graph data. Contributors may submit only
non-public draft or pending-review records owned by themselves. Only
editor/curator or admin review may make knowledge-shaping records public.
Migration and quarantine tables remain restricted to staff/admin and
service-role operations.

⸻

1. Suggested Indexes

Unique canonical-binding columns and the leading `entity_tags.entity_id`
primary-key column are already indexed by their constraints; do not duplicate
those indexes.

```sql
create index idx_entities_type on entities(entity_type);
create index idx_entities_slug on entities(slug);
create index idx_entity_relationships_source on entity_relationships(source_entity_id);
create index idx_entity_relationships_target on entity_relationships(target_entity_id);
create index idx_entity_relationships_type on entity_relationships(relationship_type);
create index idx_content_entities_content on content_entities(content_entity_id);
create index idx_content_entities_subject on content_entities(subject_entity_id);
create index idx_content_entities_role on content_entities(role);
create index idx_entity_tags_tag on entity_tags(tag_id);
create index idx_evidence_points_source_id on evidence_points(source_id);
create index idx_evidence_points_entity_id on evidence_points(entity_id);
create index idx_evidence_points_score_category on evidence_points(score_category);
```

⸻

1. Verification Queries

   12.1 Confirm all materials have entities

```sql
select count(*) as missing_material_entities
from materials m
left join entity_canonical_bindings b
  on b.material_id = m.id
left join entities e
  on e.id = b.entity_id
where b.entity_id is null
   or e.id is null
   or e.entity_type <> 'material';
```

Expected:

0

⸻

12.2 Confirm all articles have entities

```sql
select count(*) as missing_article_entities
from articles a
left join entity_canonical_bindings b
  on b.article_id = a.id
left join entities e
  on e.id = b.entity_id
where b.entity_id is null
   or e.id is null
   or e.entity_type <> 'article';
```

Expected:

0

⸻

12.3 Check migrated material relationships

```sql
select relationship_type, count(*)
from entity_relationships
group by relationship_type
order by count(*) desc;
```

⸻

12.4 Check content-to-material mappings

```sql
select ce.role, count(*)
from content_entities ce
join entities content
  on content.id = ce.content_entity_id
join entities subject
  on subject.id = ce.subject_entity_id
where content.entity_type in ('article', 'guide', 'blog_post', 'video')
  and subject.entity_type = 'material'
group by ce.role
order by count(*) desc;
```

⸻

12.5 Find unresolved article material links

select a.id, a.title, a.legacy_material_kv_id
from articles a
left join materials m
on m.legacy_kv_id = a.legacy_material_kv_id
where a.legacy_material_kv_id is not null
and m.id is null;

⸻

12.6 Find unresolved guide material links

select g.id, g.title, g.material_id, g.material_name
from guides g
left join materials m_id
on m_id.id::text = g.material_id
left join materials m_legacy
on m_legacy.legacy_kv_id = g.material_id
left join materials m_name
on lower(m_name.name) = lower(g.material_name)
where g.material_id is not null
and m_id.id is null
and m_legacy.id is null
and m_name.id is null;

⸻

1. Application Migration Plan

Step 0: Backup Compatibility

Update full-site export and validation to recognize graph-era schema version
4.0 before graph rows are created.

Keep schema version 3.0 validation and manual recovery supported.

Step 1: Schema Additions

Add new tables and indexes.

No existing behavior changes.

Step 2: Entity Backfill

Backfill entities for:

materials
articles
guides
blog_posts
sources

Add automated tests to confirm every canonical row has an entity.

Step 3: Relationship Backfill

Migrate:

material_links
materials.linked_material_ids
articles.legacy_material_kv_id
guides.material_id
guides.material_name
material_sources

Use conservative relationship types.

Prefer related_to and discusses over over-specific guesses.

Step 4: Tag Backfill

Normalize tags from:

articles.tags
guides.tags
blog_posts.tags

Keep old tag arrays temporarily.

Step 5: Evidence Linkage

Backfill:

evidence_points.source_id
evidence_points.entity_id
evidence_points.score_category

Step 6: UI Read Adapter Preparation

Prepare read adapters for:

entities
entity_relationships
content_entities
entity_tags
evidence_points

New page sections supported:

Overview
Material Intelligence
Key Insights
Knowledge Feed
Discovery Paths
Related Entities
Deep Research
Contribution Tools

Do not enable graph reads in Stage 6. Stage 8 may enable them only after
reconciliation gates pass.

Step 7: Compatibility Write Preparation

Add transactional database synchronization and an idempotent graph outbox.
Stage 7 may enable governed graph mutation workflows after reconciliation.

Examples:

- Adding article material association writes to content_entities.

- Adding material relationship writes to entity_relationships.

- Adding tags writes to entity_tags.

- Adding video creates a videos row, an entities row, and a canonical binding.

Step 8: Legacy Deprecation

After production verification:

1. Stop writing to deprecated fields.

2. Keep fields readable for one release cycle.

3. Add comments marking fields as deprecated.

4. Drop only after backups and validation.

⸻

1. Engineering Cautions

Avoid over-inference

During migration, ambiguous old links should become:

related_to

not more specific relationships.

Specific relationship refinement should happen through curator review.

Avoid graph overexposure in UI

Do not build a giant force-directed graph as the main interface.

Use graph data to generate:

Discovery Paths
Related Entities
Knowledge Feed
Recommended Learning
Deep Research

Avoid tag sprawl

Tags should be curated and typed.

Do not allow unlimited uncontrolled freeform tags in production workflows.

Keep domain tables authoritative

The graph layer should not replace rich domain tables.

For example:

materials.cr_practical_mean
materials.y_value
articles.content
guides.required_materials
sources.doi
evidence_points.value_raw

should remain in their domain tables.

⸻

1. Desired End State

After migration, WasteDB should support queries like:

Show all beginner content about PET recycling.
Show all evidence supporting aluminum recyclability.
Show videos demonstrating remelting.
Show policies affecting aluminum recovery.
Show discovery paths from tailings to aluminum.
Show materials related to biochar through remediation.
Show articles where aluminum foil is a comparison subject rather than the main subject.

This migration enables WasteDB to evolve from a material record database into a graph-powered educational discovery system while preserving existing content and evidence.
