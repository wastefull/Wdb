export type RoadmapStageStatus =
  | "complete"
  | "active"
  | "planned"
  | "triggered";
export type DeliverableStatus = "complete" | "active" | "planned" | "deferred";
export type AcceptanceTestStatus = "automated" | "planned";

export interface RoadmapDeliverable {
  title: string;
  description?: string;
  status: DeliverableStatus;
}

export interface RoadmapAcceptanceTest {
  id: string;
  title: string;
  description: string;
  status: AcceptanceTestStatus;
  legacyPhases?: string[];
}

export interface RoadmapStage {
  number: number;
  slug: `stage-${number}`;
  title: string;
  status: RoadmapStageStatus;
  completedDate?: string;
  summary: string;
  activationCriteria?: string[];
  legacyPhases?: string[];
  deliverables: RoadmapDeliverable[];
  acceptanceTests: RoadmapAcceptanceTest[];
}

export interface RoadmapBacklogItem {
  title: string;
  description: string;
  origin?: string;
}

export interface RoadmapBacklogCategory {
  title: string;
  priority: "high" | "medium" | "low";
  items: RoadmapBacklogItem[];
}

export type RoadmapTabId =
  | "overview"
  | "stages"
  | "tests"
  | "backlog"
  | `stage-${number}`;

const complete = (title: string, description?: string): RoadmapDeliverable => ({
  title,
  description,
  status: "complete",
});

const active = (title: string, description?: string): RoadmapDeliverable => ({
  title,
  description,
  status: "active",
});

const planned = (title: string, description?: string): RoadmapDeliverable => ({
  title,
  description,
  status: "planned",
});

const deferred = (title: string, description?: string): RoadmapDeliverable => ({
  title,
  description,
  status: "deferred",
});

const acceptance = (
  id: string,
  title: string,
  description: string,
  status: AcceptanceTestStatus = "planned",
  legacyPhases?: string[],
): RoadmapAcceptanceTest => ({
  id,
  title,
  description,
  status,
  legacyPhases,
});

export const ROADMAP_STAGES: RoadmapStage[] = [
  {
    number: 1,
    slug: "stage-1",
    title: "Foundation",
    status: "complete",
    completedDate: "November 2, 2025",
    summary:
      "Core product, scientific model, content workflows, public exports, and performance foundations.",
    legacyPhases: ["1", "2", "3", "3.5", "4", "5", "6", "7", "8"],
    deliverables: [
      complete("Scientific data model for CR, CC, and RU"),
      complete("Admin, editorial, visualization, and public export tools"),
      complete("Research API and performance infrastructure"),
    ],
    acceptanceTests: [
      acceptance(
        "stage-1-existing-behavior",
        "Foundation behavior remains available",
        "Core material, article, guide, visualization, and export workflows remain functional.",
      ),
    ],
  },
  {
    number: 2,
    slug: "stage-2",
    title: "Evidence Infrastructure",
    status: "complete",
    completedDate: "November 20, 2025",
    summary:
      "Transform governance, evidence CRUD, legal controls, audit logging, retention, and aggregation foundations.",
    legacyPhases: [
      "9.0.1",
      "9.0.2",
      "9.0.3",
      "9.0.4",
      "9.0.5",
      "9.0.6",
      "9.0.7",
      "9.0.8",
      "9.0.9",
      "9.0.10",
      "9.0.11",
      "9.1",
    ],
    deliverables: [
      complete("Versioned transforms and controlled vocabularies"),
      complete("Evidence CRUD, validation, and aggregation APIs"),
      complete("Audit logging, retention, backup, and legal safeguards"),
    ],
    acceptanceTests: [
      acceptance(
        "stage-2-regression",
        "Evidence infrastructure regression suite passes",
        "Legacy Phase 9.0 and 9.1 executable tests remain available under Stage 2.",
        "automated",
        ["9.0.x", "9.1"],
      ),
    ],
  },
  {
    number: 3,
    slug: "stage-3",
    title: "Curation Lab",
    status: "complete",
    completedDate: "Completed at revised scope, May 2026",
    summary:
      "Evidence extraction workbench, PDF-assisted curation, and MIU editing completed at the revised scope.",
    legacyPhases: ["9.2"],
    deliverables: [
      complete("Split-pane Curation Workbench and extraction wizard"),
      complete("PDF viewer with selection-to-form prefill"),
      complete("MIU create, edit, and delete workflows"),
      {
        title: "Scaled evidence curation and public traceability",
        description:
          "Carried forward to Stages 8-9, with scale-dependent expansion in Stage 12.",
        status: "deferred",
      },
    ],
    acceptanceTests: [
      acceptance(
        "stage-3-regression",
        "Curation Lab regression suite passes",
        "Legacy Phase 9.2 executable tests remain available under Stage 3.",
        "automated",
        ["9.2"],
      ),
    ],
  },
  {
    number: 4,
    slug: "stage-4",
    title: "Data Migration",
    status: "complete",
    completedDate: "May 21, 2026",
    summary:
      "Core application data migrated from KV blobs to relational Postgres tables with RLS and foreign-key integrity.",
    legacyPhases: ["10.0"],
    deliverables: [
      complete("Relational tables and RLS policies"),
      complete("Seeded data and compatibility-aware route migration"),
      complete("Postgres evidence and audit-log storage"),
    ],
    acceptanceTests: [
      acceptance(
        "stage-4-regression",
        "Relational migration regression suite passes",
        "Legacy Phase 10.0 executable tests remain available under Stage 4.",
        "automated",
        ["10.0"],
      ),
    ],
  },
  {
    number: 5,
    slug: "stage-5",
    title: "Material Experience Redesign",
    status: "complete",
    completedDate: "June 18, 2026",
    summary:
      "Restructure material pages as clear educational journeys while preserving every existing workflow and data surface.",
    deliverables: [
      complete("Material Overview and Material Intelligence hierarchy"),
      complete(
        "Review-aware Key Insight drafts and recommended learning using current data",
      ),
      complete(
        "Stable contracts and honest empty states for graph-powered sections",
      ),
      complete(
        "Preserve evidence, attribution, export, and contribution workflows",
      ),
    ],
    acceptanceTests: [
      acceptance(
        "stage-5-current-data",
        "Existing material data remains visible",
        "The redesigned page exposes all current scores, evidence, sources, attribution, and contribution actions without loss.",
        "automated",
      ),
      acceptance(
        "stage-5-empty-states",
        "Graph-dependent sections fail honestly",
        "Knowledge Feed, Related Entities, and Discovery Paths say verified graph reads are not available yet without implying that no relationships exist.",
        "automated",
      ),
      acceptance(
        "stage-5-editorial-insights",
        "Key Insights remain review-aware",
        "Generated claims carry review status, scope notes, and supporting references and are not presented as authoritative before human approval.",
        "automated",
      ),
      acceptance(
        "stage-5-accessibility-baseline",
        "Stage 5 avoids known accessibility regressions",
        "New material components preserve semantic structure, visible focus, keyboard reachability, reduced-motion compatibility, and non-color-only state communication while full browser acceptance remains deferred.",
        "automated",
      ),
      acceptance(
        "stage-5-learning-ranking",
        "Current-data learning remains deterministic",
        "Published direct-material content ranks before linked-material content, while drafts and archived content are excluded.",
        "automated",
      ),
      acceptance(
        "stage-5-section-navigation",
        "The educational journey has stable navigation targets",
        "Overview, Intelligence, Insights, Learning, Discovery, Research, and Contribution expose unique ordered targets without changing application routes.",
        "automated",
      ),
    ],
  },
  {
    number: 6,
    slug: "stage-6",
    title: "Knowledge Graph Foundation",
    status: "complete",
    completedDate: "June 22, 2026",
    summary:
      "Add the graph data layer through additive, observable, and recoverable migrations without replacing authoritative domain tables.",
    deliverables: [
      complete("Resolve schema ADRs for canonical references, enums, and RLS"),
      complete(
        "Add graph tables, indexes, policies, and compatibility adapters",
        "The additive foundation was deployed to production on June 22, 2026, with validated schema-version 3.0 and 4.0 backups, unchanged domain-table counts and checksums, clean database lint, and 64 passing production pgTAP assertions.",
      ),
      complete(
        "Backfill entities, relationships, tags, content mappings, and evidence links",
        "228 canonical entities and 228 bindings (materials, articles, guides) were backfilled to production on June 22, 2026 via a transactional, checkpointed apply run. All 228 reconciled in the post-apply dry run with zero prospective writes, zero conflicts, and zero orphans. Relationship, tag, and content mapping population is Stage 7 work.",
      ),
      complete(
        "Provide dry-run, reconciliation, quarantine, resume, and manual repair tools",
        "Admin-only dry-run, apply, resume, run-detail, and capabilities endpoints are deployed. Service-role-only phase functions execute transactionally with checkpoints, failure rollback, and issue persistence. Apply is gated by GRAPH_MIGRATION_APPLY_ENABLED; manual correction UI is deferred to the apply window.",
      ),
    ],
    acceptanceTests: [
      acceptance(
        "stage-6-fresh-bootstrap",
        "Fresh databases replay the complete migration history",
        "A clean local Supabase database creates the legacy KV compatibility table before historical seeds and reaches the Stage 6 migration without manual schema setup.",
        "automated",
      ),
      acceptance(
        "stage-6-schema-contract",
        "Graph foundation schema is additive and governed",
        "Graph tables, governed vocabulary seeds, evidence linkage columns, indexes, and RLS policies are present without replacing domain tables.",
        "automated",
      ),
      acceptance(
        "stage-6-rls-matrix",
        "Every knowledge-shaping surface has explicit authorization",
        "All graph tables are covered across anonymous, authenticated contributor, staff/curator, admin, and service-role capabilities; untrusted actors cannot make draft graph knowledge authoritative.",
        "automated",
      ),
      acceptance(
        "stage-6-backup-v4",
        "Graph-era backups are complete and backward compatible",
        "Schema version 4.0 includes every graph table with counts and checksums while the validator continues to recognize schema version 3.0.",
        "automated",
      ),
      acceptance(
        "stage-6-backup-gate",
        "Verified backup exists before migration",
        "Before writes begin, a versioned full backup includes a schema manifest, row counts, checksums, and export timestamp; it is validated and stored outside the repository with operator-only access, and storage has a separately verified provider backup when affected.",
        "automated",
      ),
      acceptance(
        "stage-6-idempotent",
        "Graph migration is idempotent and resumable",
        "Dry run, repeated execution, partial failure, and resume produce no duplicate or unexplained lost records.",
        "automated",
      ),
      acceptance(
        "stage-6-entity-backfill-dry-run",
        "Entity backfill is previewed without mutation",
        "The canonical material, article, guide, blog-post, and source mapping reports inserts, updates, reconciled rows, conflicts, unresolved rows, deterministic checksums, and unchanged graph snapshots before any apply operation.",
        "automated",
      ),
      acceptance(
        "stage-6-entity-backfill-apply-tooling",
        "Entity apply tooling is transactional and resumable",
        "Service-role-only phase functions atomically create or reconcile entities and bindings, persist checkpoints and failures, skip completed phases safely, and require all five phases before finalization; production execution remains separately gated.",
        "automated",
      ),
      acceptance(
        "stage-6-rollback",
        "Rollback limits and recovery are tested",
        "Every migration category has tested rollback instructions or an explicit manual recovery action when rollback is not safe.",
        "automated",
      ),
      acceptance(
        "stage-6-reconciliation",
        "Source and graph data reconcile",
        "Post-apply dry run (sample_limit 1) confirms all 228 canonical rows are reconciled, zero prospective writes, zero orphan bindings, and a stable graph snapshot.",
        "automated",
      ),
      acceptance(
        "stage-6-quarantine",
        "Unresolved records retain original payloads",
        "The completed entity-backfill apply run has zero migration issues — no conflicts or unresolved records were quarantined.",
        "automated",
      ),
      acceptance(
        "stage-6-manual-correction",
        "Manual corrections are safe to rerun",
        "Synthetic correction tests preserve immutable original payloads and allow the same reviewed resolution to rerun idempotently; the production apply run required no correction.",
        "automated",
      ),
    ],
  },
  {
    number: 7,
    slug: "stage-7",
    title: "Solo-Admin Content Curation",
    status: "active",
    summary:
      "Make one administrator fast at turning incomplete material records into well-sourced, publishable pages while consolidating source and evidence storage.",
    deliverables: [
      active(
        "Canonical source and evidence authority",
        "Reconcile KV and Postgres records without data loss, then use stable Postgres source, material-source, and evidence identifiers for all new work.",
      ),
      active(
        "Material-centered curation workspace",
        "Keep the current material in context while the admin links sources, captures evidence, drafts content, previews provenance, and publishes.",
      ),
      active(
        "Fast source capture and linking",
        "Support DOI, URL, and manual source intake with duplicate detection, immediate material linking, and optional PDF attachment in one flow.",
      ),
      active(
        "Material-page source and provenance links",
        "Published material pages expose canonical sources and evidence locations for supported claims without waiting for the full public Source Library in Stage 9.",
      ),
      planned(
        "Actionable content coverage dashboard",
        "Show missing descriptions, sources, evidence, article categories, and stale records with a direct next action for each material.",
      ),
      planned(
        "Faster article authoring",
        "Provide material-aware templates, Markdown or plain-text import, automatic slugs, source selection, and public-page preview.",
      ),
      planned(
        "Solo-admin recovery baseline",
        "Protect work with autosaved drafts, verified backups, simple trash or restore, and a revision snapshot before overwriting published content.",
      ),
      active(
        "Direct relationship and content management",
        "Admins can create, manage, and publish duplicate-safe material and educational-content relationships without a mandatory self-review pass.",
      ),
      complete(
        "Bulk YouTube playlist intake and four-way triage",
        "Implementation history retained: preview and deduplicate playlist candidates, export and validate a review-safe worksheet, and stage private triage records transactionally behind a server safety gate without publishing automatically.",
      ),
      complete(
        "Private triage persistence and worksheet validation",
        "Implementation history retained: immutable provider facts remain separate from editable human decisions, reviewed CSV validation is local-first, and private tables are covered in backup schema 4.1.",
      ),
      complete(
        "Idempotent private worksheet staging",
        "Implementation history retained: one validated worksheet and all candidate rows stage atomically, exact reruns return the same batch, and no public graph reads are enabled.",
      ),
      complete(
        "Private candidate review queue",
        "Implementation history retained: staged candidates support explicit disposition decisions and governed review metadata without automatic publication.",
      ),
      complete(
        "Transactional draft video creation",
        "Implementation history retained: accepted videos, entities, and canonical bindings can be created transactionally with resumable behavior.",
      ),
      complete(
        "Reviewed video publication and material-page resources",
        "Implementation history retained: reviewed material-linked video records can be published with transactional provenance and displayed on material pages.",
      ),
      complete(
        "Private editorial lead queue",
        "Implementation history retained: mission-aligned general videos can be retained as private editorial leads for future articles, blog posts, or guides.",
      ),
      planned(
        "Generalized taxonomy administration",
        "Global CRUD for tag vocabularies, relationship vocabularies, and lifecycle taxonomy moves to Stage 10.",
      ),
      planned(
        "Evidence provenance and scoring",
        "Source observation sessions, score publication, and score-to-evidence traceability move to Stage 8.",
      ),
      planned(
        "General discovery graph surfaces",
        "Knowledge Feed, generalized related-entity feeds, and discovery path cutover move to Stage 10.",
      ),
      deferred(
        "Multi-user review, audit, and outbox expansion",
        "Actor-level audit history, approval routing, reviewer attribution, assignments, and outbox consumers wait until another contributor or an external compliance requirement exists.",
      ),
    ],
    acceptanceTests: [
      acceptance(
        "stage-7-canonical-source-identity",
        "Source identity is consistent across the product",
        "A source created from a material workspace appears under the same stable identifier in the Source Library, material page, evidence records, and content citations.",
      ),
      acceptance(
        "stage-7-material-context-workflow",
        "Curation preserves material context",
        "An admin can link a source, capture evidence, preview the public result, and return to the same material without restarting navigation.",
      ),
      acceptance(
        "stage-7-material-source-provenance",
        "Material pages expose source provenance",
        "Published material claims link to their canonical source and preserve an evidence page, location, or snippet when one is available.",
      ),
      acceptance(
        "stage-7-direct-admin-publish",
        "Admin publication does not require self-review",
        "The sole admin can save a draft or publish directly; no second approval action or reviewer identity is required.",
      ),
      acceptance(
        "stage-7-content-coverage",
        "Coverage gaps are actionable",
        "The admin dashboard accurately identifies missing descriptions, sources, evidence, and article categories and deep-links to the relevant task.",
      ),
      acceptance(
        "stage-7-duplicate-protection",
        "Duplicate relationship claims are prevented",
        "Exact duplicate content-to-material and material-to-material records return the existing published state or deterministic conflict responses without creating additional rows.",
      ),
      acceptance(
        "stage-7-relationship-authorization",
        "Relationship mutation authorization is explicit",
        "Anonymous and untrusted authenticated users cannot create, publish, or delete relationship/mapping records; authorized admins can execute those mutations.",
      ),
      acceptance(
        "stage-7-public-material-reads",
        "Public material pages present published relationships",
        "Public material-page surfaces show only published educational content links and material relationships, excluding drafts and archived records.",
      ),
      acceptance(
        "stage-7-recovery-baseline",
        "Content work is recoverable",
        "Autosaved drafts, verified backups, and trash or revision recovery protect against accidental loss without requiring actor-level audit infrastructure.",
      ),
    ],
  },
  {
    number: 8,
    slug: "stage-8",
    title: "Evidence Provenance & Scoring",
    status: "planned",
    summary:
      "Capture reproducible source observations efficiently and calculate published sustainability dimensions from explicitly published evidence.",
    deliverables: [
      planned("Authoritative scoring methodology and parameter governance"),
      planned(
        "Source-centric extraction sessions",
        "Keep source, PDF, and material context pinned while the admin captures multiple observations with save-and-add-another behavior.",
      ),
      planned(
        "Complete scientific provenance",
        "Published observations retain source, page or location, quote or snippet, material, parameter, unit, confidence, and methodology version.",
      ),
      planned(
        "Direct admin evidence publication",
        "The admin can keep observations as drafts, publish them directly, or exclude them without a separate self-approval queue.",
      ),
      planned(
        "Score calculation from published observations",
        "Material sustainability dimensions are calculated only from published observations under a named methodology version.",
      ),
      planned(
        "Separation between discovery relationships and evidentiary support",
        "Relationship links remain discovery metadata and are not treated as evidence without explicit scoring provenance.",
      ),
    ],
    acceptanceTests: [
      acceptance(
        "stage-8-evidence-provenance",
        "Every scoring input preserves provenance",
        "Each published observation records its source, page or location, quoted snippet, material, parameter, unit, confidence, and methodology version.",
      ),
      acceptance(
        "stage-8-methodology-versioning",
        "Methodology changes are versioned and reproducible",
        "Score outputs can be recalculated by methodology version and retain explainable parameter lineage.",
      ),
      acceptance(
        "stage-8-publication-boundary",
        "Draft observations cannot affect public scores",
        "Draft and excluded observations remain non-authoritative until the admin explicitly publishes them.",
      ),
      acceptance(
        "stage-8-score-calculation",
        "Published sustainability dimensions come from published evidence",
        "Public dimensions are computed from published observations only and expose methodology metadata for traceability.",
      ),
      acceptance(
        "stage-8-admin-publication-workflow",
        "Admin evidence publication is direct and recoverable",
        "The admin can create a draft, inspect its complete provenance, publish it in one action, and exclude or revise it without a separate reviewer workflow.",
      ),
    ],
  },
  {
    number: 9,
    slug: "stage-9",
    title: "Public Sources & Structured Citations",
    status: "planned",
    summary:
      "Expose public source records, structured content citations, and clearly labeled material-source relationships while keeping restricted files and notes private.",
    deliverables: [
      planned("Public source browsing, search, and source detail pages"),
      planned(
        "Public metadata and access-availability indicators",
        "Public users can view bibliographic metadata and open-access or PDF availability without exposing restricted notes or review internals.",
      ),
      planned(
        "Published material-to-source relationship presentation",
        "Materials show explicit, labeled source relationships without implying every linked source contributes to scoring.",
      ),
      planned(
        "Structured content citation integration",
        "Articles, guides, and future content types cite canonical source-library records while retaining free-text footnotes for commentary.",
      ),
      planned(
        "Public/restricted field boundary model",
        "Restricted files, private notes, review state, and internal moderation fields remain private while public bibliographic records are readable.",
      ),
    ],
    acceptanceTests: [
      acceptance(
        "stage-9-public-restricted-separation",
        "Public and restricted source fields are separated",
        "Public endpoints expose only safe bibliographic metadata and availability markers; restricted files, notes, and review-state fields remain inaccessible.",
      ),
      acceptance(
        "stage-9-material-source-links",
        "Material and source links are explicit and published",
        "Material pages display published source relationships with clear relationship meaning and without automatic evidentiary claims.",
      ),
      acceptance(
        "stage-9-content-citations",
        "Content can cite Source Library records",
        "Articles, guides, and supported content forms can attach source-library citations through the existing footnote flow.",
      ),
      acceptance(
        "stage-9-inaccessible-pdf-behavior",
        "Inaccessible PDFs are handled safely",
        "Sources without public files still present bibliographic metadata and access status without exposing restricted assets or dead-link failures as hard errors.",
      ),
    ],
  },
  {
    number: 10,
    slug: "stage-10",
    title: "Taxonomy, Discovery & Learning Paths",
    status: "planned",
    summary:
      "Make taxonomy governance configurable, then power verified discovery reads, related-material experiences, and curated learning paths.",
    activationCriteria: [
      "A meaningful share of priority materials meets the minimum content-coverage standard.",
      "Source, evidence, and citation relationships use canonical identifiers.",
    ],
    deliverables: [
      planned("Admin CRUD for taxonomy and governed vocabulary"),
      planned(
        "Assignment governance with merge and deprecation workflows",
        "Admin assignment workflows prevent duplicate taxonomy values and support controlled merges/deprecations.",
      ),
      planned(
        "Verified discovery reads from published graph data",
        "Related materials, feed surfaces, search, and learning paths read only active published relationships and mappings.",
      ),
      planned(
        "Curated discovery paths and topic browsing",
        "Discovery focuses on governed educational pathways instead of raw undifferentiated graph visualization.",
      ),
    ],
    acceptanceTests: [
      acceptance(
        "stage-10-vocabulary-crud",
        "Taxonomy vocabulary is governable",
        "Admins can create, update, merge, deprecate, and retire relationship/tag/topic vocabulary without direct SQL edits.",
      ),
      acceptance(
        "stage-10-assignment-governance",
        "Assignment workflows prevent duplicate taxonomy drift",
        "Admin assignment and merge/deprecation workflows prevent duplicate active values and preserve canonical vocabulary history.",
      ),
      acceptance(
        "stage-10-verified-discovery-reads",
        "Discovery uses active published graph data only",
        "Related materials, feed, search, and learning-path reads exclude drafts, archived records, and unpublished mappings.",
      ),
      acceptance(
        "stage-10-related-materials-learning-paths",
        "Related-material and learning-path experiences are governed",
        "Public discovery surfaces show published relationship semantics and curated pathway sequencing without exposing raw graph internals.",
      ),
    ],
  },
  {
    number: 11,
    slug: "stage-11",
    title: "Revision Recovery & Multi-User Readiness",
    status: "triggered",
    summary:
      "Add actor-level governance only when collaboration or compliance requires it, while strengthening practical revision and restore workflows.",
    activationCriteria: [
      "A non-admin editor, curator, or reviewer is invited.",
      "An external partner or compliance requirement needs actor-level history or retention controls.",
    ],
    deliverables: [
      planned(
        "Content revision comparison and restore",
        "Provide understandable revisions and recovery beyond the lightweight Stage 7 snapshot baseline.",
      ),
      planned(
        "Multi-user approval and assignment workflows",
        "Add reviewer identity, approval routing, assignments, and notifications when multiple contributors exist.",
      ),
      planned(
        "Actor-level audit and security telemetry",
        "Introduce searchable administrative history, retention controls, and security telemetry only when required by collaboration or compliance.",
      ),
    ],
    acceptanceTests: [
      acceptance(
        "stage-11-revision-restore",
        "Published content revisions can be restored",
        "An authorized operator can compare and restore a prior published revision without losing the current version.",
      ),
      acceptance(
        "stage-11-collaboration-boundary",
        "Multi-user actions carry accountable identity",
        "When contributor roles are enabled, publication, review, assignment, and destructive actions retain the responsible actor and decision.",
      ),
      acceptance(
        "stage-11-restore",
        "Old and new backups restore successfully",
        "Representative pre-graph and graph-era backups restore into test environments and reconcile counts and checksums.",
      ),
    ],
  },
  {
    number: 12,
    slug: "stage-12",
    title: "Scale & Community Workflows",
    status: "triggered",
    summary:
      "Scale performance and community curation only after the corpus or contributor activity demonstrates a concrete need.",
    activationCriteria: [
      "Measured corpus size or query latency requires pagination, caching, or aggregation work.",
      "Active non-admin contributors require onboarding, assignments, sampling, and quality workflows.",
    ],
    deliverables: [
      planned("Aggregation engine and evidence quality metrics"),
      planned("Evidence curation across materials and dimensions"),
      planned("Public evidence traceability"),
      planned("Triggered community curator onboarding and quality workflows"),
    ],
    acceptanceTests: [
      acceptance(
        "stage-12-safety-gate",
        "Migration safety gates pass before scaling",
        "There is zero unexplained row or relationship loss and a documented manual recovery path for every unresolved migration category.",
      ),
      acceptance(
        "stage-12-backup-scale",
        "Backup and recovery remain functional at scale",
        "Full backup, validation, and restore remain usable at target data volumes; multi-user audit checks apply only after Stage 11 is activated.",
      ),
    ],
  },
];

export const ACTIVE_STAGE =
  ROADMAP_STAGES.find((stage) => stage.status === "active") ??
  ROADMAP_STAGES[0];

export const ACTIVE_STAGE_TAB_ID: RoadmapTabId = ACTIVE_STAGE.slug;

export const ROADMAP_PROGRESS = {
  total: ROADMAP_STAGES.length,
  complete: ROADMAP_STAGES.filter((stage) => stage.status === "complete")
    .length,
  active: ROADMAP_STAGES.filter((stage) => stage.status === "active").length,
  planned: ROADMAP_STAGES.filter((stage) => stage.status === "planned").length,
  triggered: ROADMAP_STAGES.filter((stage) => stage.status === "triggered")
    .length,
  percentComplete: Math.round(
    (ROADMAP_STAGES.filter((stage) => stage.status === "complete").length /
      ROADMAP_STAGES.length) *
      100,
  ),
};

export const ROADMAP_BACKLOG: RoadmapBacklogCategory[] = [
  {
    title: "Migration Safety & Operations",
    priority: "high",
    items: [
      {
        title: "Backup format compatibility adapters",
        description:
          "Keep pre-graph and graph-era backups restorable with version detection and documented manual recovery.",
        origin: "Data-safe migration requirements",
      },
      {
        title: "Relationship, tag, and content migration tooling",
        description:
          "Extend the proven dry-run, checkpoint, quarantine, and reconciliation pattern to Stage 7 relationship and content population while deferring generalized taxonomy governance to Stage 10.",
        origin: "Stage 7",
      },
    ],
  },
  {
    title: "Evidence & Source Management",
    priority: "high",
    items: [
      {
        title: "Bulk source deletion with integrity checks",
        description:
          "Support confirmed bulk deletion with dependency checks, dry runs, and rollback-aware reporting.",
        origin: "Legacy backlog",
      },
      {
        title: "DOI and CrossRef import",
        description:
          "Populate canonical source metadata from DOI, URL, or CrossRef with duplicate detection and immediate material linking.",
        origin: "Legacy backlog",
      },
      {
        title: "Source versioning and citation export",
        description:
          "Track source metadata revisions and generate BibTeX and formatted citations.",
        origin: "Legacy backlog",
      },
    ],
  },
  {
    title: "Multi-User Governance",
    priority: "low",
    items: [
      {
        title: "Approval routing and reviewer attribution",
        description:
          "Add assignments, reviewer identity, approval queues, and contributor notifications when a non-admin contributor is invited.",
        origin: "Triggered Stage 11",
      },
      {
        title: "Operational audit and retention controls",
        description:
          "Expand searchable actor history, retention rules, and security telemetry only for a concrete collaboration or compliance need.",
        origin: "Triggered Stage 11",
      },
    ],
  },
  {
    title: "Product & Accessibility",
    priority: "medium",
    items: [
      {
        title: "Inline content diff viewer",
        description:
          "Show accessible additions and removals when reviewing article edits.",
        origin: "Legacy backlog",
      },
      {
        title: "Guide sharing, PDF export, and read-time improvements",
        description:
          "Complete deferred guide usability enhancements after the redesign.",
        origin: "Legacy backlog",
      },
      {
        title: "Visualization interaction improvements",
        description:
          "Improve keyboard navigation, tooltips, animation, and dark-mode behavior.",
        origin: "Legacy backlog",
      },
    ],
  },
  {
    title: "Platform",
    priority: "low",
    items: [
      {
        title: "Advanced query and progressive loading",
        description:
          "Add pagination, query-plan analysis, caching, and on-demand scientific-data loading.",
        origin: "Legacy backlog",
      },
      {
        title: "API versioning and interactive testing",
        description:
          "Introduce explicit API versions, deprecation notices, and safe interactive endpoint testing.",
        origin: "Legacy backlog",
      },
      {
        title: "Additional authentication safeguards",
        description:
          "Evaluate trusted devices and multi-factor authentication for privileged users.",
        origin: "Legacy backlog",
      },
    ],
  },
];

export const LEGACY_PHASE_STAGE_MAP: Record<string, number> = {
  "9.0.1": 2,
  "9.0.2": 2,
  "9.0.3": 2,
  "9.0.4": 2,
  "9.0.5": 2,
  "9.0.6": 2,
  "9.0.7": 2,
  "9.0.8": 2,
  "9.0.9": 2,
  "9.0.10": 2,
  "9.0.11": 2,
  "9.1": 2,
  "9.2": 3,
  "10.0": 4,
};

export function getStageByNumber(number: number): RoadmapStage | undefined {
  return ROADMAP_STAGES.find((stage) => stage.number === number);
}

export function getStageNumberForLegacyPhase(
  phase: string,
): number | undefined {
  return LEGACY_PHASE_STAGE_MAP[phase];
}
