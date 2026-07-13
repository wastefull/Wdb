export type RoadmapStageStatus = "complete" | "active" | "planned";
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
    title: "Material Relationships & Educational Content",
    status: "active",
    summary:
      "Complete reviewed material-to-material and content-to-material relationship workflows with focused audit coverage and public material-page presentation.",
    deliverables: [
      active(
        "Reviewed educational content-to-material relationships",
        "Admins can create, review, and manage explicit content-to-material mappings that are presented on public material pages through governed relationship roles.",
      ),
      active(
        "Reviewed material-to-material relationships",
        "Admins can create, review, and manage explicit material relationships with duplicate protection, explicit review state, and public material-page presentation.",
      ),
      active(
        "Focused relationship audit coverage",
        "Relationship and mapping mutations record transactional audit summaries for create, review, state-transition, and delete operations required by Stage 7.",
      ),
      active(
        "Outbox retained as inactive durable ledger",
        "Current relationship and mapping writes keep idempotent outbox records in the same transaction, but downstream outbox consumers are out of Stage 7 scope until a concrete consumer is approved.",
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
        "Key Insight review and evidence-claim workflows",
        "Structured Key Insight and scoring-evidence editorial workflows move to Stage 8.",
      ),
      planned(
        "General discovery graph surfaces",
        "Knowledge Feed, generalized related-entity feeds, and discovery path cutover move to Stage 10.",
      ),
      planned(
        "Audit-system redesign",
        "Broad audit and revision-model redesign is Stage 11 work; Stage 7 requires only focused mutation coverage.",
      ),
    ],
    acceptanceTests: [
      acceptance(
        "stage-7-content-material-create-review",
        "Educational content links are created and reviewed",
        "Admins can create pending educational content-to-material mappings, review them to active or archived, and preserve reviewer metadata across transitions.",
      ),
      acceptance(
        "stage-7-material-relationship-create-review",
        "Material relationships are created and reviewed",
        "Admins can create pending material-to-material relationships, review them to active or archived, and preserve reviewer metadata across transitions.",
      ),
      acceptance(
        "stage-7-duplicate-protection",
        "Duplicate relationship claims are prevented",
        "Exact duplicate content-to-material and material-to-material records return existing reviewed state or deterministic conflict responses without creating additional rows.",
      ),
      acceptance(
        "stage-7-relationship-authorization",
        "Relationship mutation authorization is explicit",
        "Anonymous and untrusted authenticated users cannot create, review, or delete relationship/mapping records; authorized admins can execute those mutations.",
      ),
      acceptance(
        "stage-7-public-material-reads",
        "Public material pages present reviewed relationships",
        "Public material-page surfaces show only active reviewed educational content links and material relationships, excluding pending or archived records.",
      ),
      acceptance(
        "stage-7-focused-audit",
        "Stage 7 mutations retain focused transactional audit coverage",
        "Create, review-state transition, and delete mutations for Stage 7 relationship domains write compatible audit summaries in the same transaction as the data change.",
      ),
    ],
  },
  {
    number: 8,
    slug: "stage-8",
    title: "Evidence-Based Sustainability Scoring",
    status: "active",
    summary:
      "Define authoritative scoring methodology and convert reviewed source observations into published sustainability dimensions with strict provenance and approval boundaries.",
    deliverables: [
      planned("Authoritative scoring methodology and parameter governance"),
      planned(
        "Reviewer workflow for structured source-PDF observations",
        "Reviewers can capture parameter observations with source, page, snippet/quote, reviewer identity, confidence, and methodology version.",
      ),
      planned(
        "Volunteer-safe guided review workflow",
        "Trainable high-school volunteer flow includes instructions, constrained input, and mandatory staff approval before score impact.",
      ),
      planned(
        "Score calculation and publication from approved observations",
        "Material sustainability dimensions are calculated only from approved observations under a named methodology version.",
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
        "Each approved observation records source record, page/location, quoted snippet, reviewer, confidence, and methodology version.",
      ),
      acceptance(
        "stage-8-methodology-versioning",
        "Methodology changes are versioned and reproducible",
        "Score outputs can be recalculated by methodology version and retain explainable parameter lineage.",
      ),
      acceptance(
        "stage-8-approval-boundary",
        "Unapproved observations cannot affect public scores",
        "Volunteer and reviewer draft observations remain non-authoritative until explicit staff approval is recorded.",
      ),
      acceptance(
        "stage-8-score-calculation",
        "Published sustainability dimensions come from approved evidence",
        "Public dimensions are computed from approved observations only and expose methodology metadata for traceability.",
      ),
      acceptance(
        "stage-8-volunteer-workflow",
        "Guided workflows are safe for trained high-school volunteers",
        "Review UI provides clear instructions, constrained forms, and safe escalation paths suitable for supervised volunteer use.",
      ),
    ],
  },
  {
    number: 9,
    slug: "stage-9",
    title: "Public Source Library & Citations",
    status: "planned",
    summary:
      "Expose a safe public source library with citations and reviewed source-material links while keeping restricted operational fields private.",
    deliverables: [
      planned("Public source browsing, search, and source detail pages"),
      planned(
        "Public metadata and access-availability indicators",
        "Public users can view bibliographic metadata and open-access or PDF availability without exposing restricted notes or review internals.",
      ),
      planned(
        "Reviewed material-to-source relationship presentation",
        "Materials show explicit source relationships without implying every linked source contributes to scoring.",
      ),
      planned(
        "Content citation integration via existing footnotes",
        "Articles, guides, and future content types can cite source-library records through current citation/footnote experiences.",
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
        "Material and source links are explicit and reviewed",
        "Material pages display reviewed source relationships with clear relationship meaning and without automatic evidentiary claims.",
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
    deliverables: [
      planned("Admin CRUD for taxonomy and governed vocabulary"),
      planned(
        "Assignment governance with merge and deprecation workflows",
        "Reviewed assignment workflows prevent duplicate taxonomy values and support controlled merges/deprecations.",
      ),
      planned(
        "Verified discovery reads from active reviewed graph data",
        "Related materials, feed surfaces, search, and learning paths read only active reviewed relationships and mappings.",
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
        "Reviewed assignment and merge/deprecation workflows prevent duplicate active values and preserve auditability of vocabulary changes.",
      ),
      acceptance(
        "stage-10-verified-discovery-reads",
        "Discovery uses active reviewed graph data only",
        "Related materials, feed, search, and learning-path reads exclude pending, archived, and unreviewed records.",
      ),
      acceptance(
        "stage-10-related-materials-learning-paths",
        "Related-material and learning-path experiences are governed",
        "Public discovery surfaces show reviewed relationship semantics and curated pathway sequencing without exposing raw graph internals.",
      ),
    ],
  },
  {
    number: 11,
    slug: "stage-11",
    title: "Privacy, Audit & Revision History",
    status: "planned",
    summary:
      "Separate revision history, restricted admin audit, and security telemetry while preserving historical records and API compatibility.",
    deliverables: [
      planned("Layered revision, admin-audit, and security telemetry models"),
      planned(
        "Versioned audit migration with reconciliation and rollback instructions",
      ),
      planned(
        "Compatibility adapters for existing audit endpoints and consumers",
      ),
      planned(
        "Documented retention, incompatibilities, and manual recovery paths",
      ),
    ],
    acceptanceTests: [
      acceptance(
        "stage-11-history",
        "Historical audit records are preserved",
        "Audit migration accounts for every existing record and retains original payloads where automated conversion is impossible.",
      ),
      acceptance(
        "stage-11-api-compatibility",
        "Existing audit interfaces remain functional",
        "Audit list, detail, statistics, filtering, and export response shapes remain compatible or have documented adapters.",
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
    title: "Scale",
    status: "planned",
    summary:
      "Scale evidence curation, aggregation, public traceability, and community workflows after migration safety gates pass.",
    deliverables: [
      planned("Aggregation engine and evidence quality metrics"),
      planned("Evidence curation across materials and dimensions"),
      planned("Public evidence traceability"),
      planned("Community curator onboarding and quality workflows"),
    ],
    acceptanceTests: [
      acceptance(
        "stage-12-safety-gate",
        "Migration safety gates pass before scaling",
        "There is zero unexplained row or relationship loss and a documented manual recovery path for every unresolved migration category.",
      ),
      acceptance(
        "stage-12-backup-scale",
        "Backup and audit systems remain functional at scale",
        "Full backup, validation, restore, audit filtering, and audit statistics remain usable at target data volumes.",
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
      {
        title: "Retention dashboard enhancements",
        description:
          "Add previews, exports, date filters, storage indicators, and scheduling without weakening audit retention guarantees.",
        origin: "Legacy backlog",
      },
    ],
  },
  {
    title: "Evidence & Source Management",
    priority: "medium",
    items: [
      {
        title: "Bulk source deletion with integrity checks",
        description:
          "Support reviewed bulk deletion with dependency checks, dry runs, and rollback-aware reporting.",
        origin: "Legacy backlog",
      },
      {
        title: "DOI and CrossRef import",
        description:
          "Populate source metadata from DOI/CrossRef with duplicate detection and manual review.",
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
