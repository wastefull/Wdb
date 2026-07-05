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
        description: "Carried forward to Stage 10.",
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
    title: "Graph Content & Curation",
    status: "active",
    summary:
      "Add governed graph content, first-class videos, editorial leads, and graph-aware contributor and admin workflows.",
    deliverables: [
      complete(
        "Bulk YouTube playlist intake and four-way triage",
        "Preview and deduplicate playlist candidates, export and validate a review-safe worksheet, and stage private triage records transactionally behind a server safety gate without publishing automatically. The initial production batch was fully reviewed and applied in a controlled window with reconciliation.",
      ),
      complete(
        "Private triage persistence and worksheet validation",
        "Preserve immutable provider facts separately from editable human decisions, validate reviewed CSVs locally before staging, and cover every private table in backup schema 4.1.",
      ),
      complete(
        "Idempotent private worksheet staging",
        "Stage one validated worksheet and all candidate rows atomically, return the existing batch for an exact rerun, retain partial review safely, and create no videos, graph records, tags, mappings, or editorial leads.",
      ),
      complete(
        "Private candidate review queue",
        "The production backend and admin UI page staged candidates and record explicit material-video, editorial-lead, both, or ignore decisions with notes and governed review metadata; no review action creates content.",
      ),
      complete(
        "Transactional draft video creation",
        "Create each accepted video, graph entity, and canonical binding atomically while preserving playlist provenance, idempotency, and resumable apply behavior.",
      ),
      active(
        "Reviewed video-to-material mapping tools",
        "The local Content Management workflow lets admins map canonical videos and other content to materials as explicit pending-review graph records. Reviewed video-triage material links can also be previewed and promoted in bulk to initial primary-subject mappings, with unresolved identifiers reported rather than guessed. Both paths preserve atomic audit/outbox writes and duplicate protection; production deployment and acceptance remain pending.",
      ),
      planned(
        "Governed video topic classification",
        "Assign reviewed topic tags independently from material mappings, beginning with 3D printing and leaving incidental mentions untagged.",
      ),
      complete(
        "Private editorial lead queue",
        "Retain mission-aligned general videos as candidates for articles, blog posts, or guides, with triage status and notes captured as private editorial leads during controlled apply.",
      ),
      planned("Relationship, entity, tag, and video curation tools"),
      planned("Human review workflow for scoped Key Insights"),
      active(
        "Reviewed relationship and content-mapping workflow",
        "Preview candidate relationships and content mappings without mutation, preserve unresolved candidates transactionally, and apply only explicitly selected resolved candidates as pending review. The hardened database functions, Edge routes, tests, and admin UI are deployed with the apply gate closed; production preview reconciliation and reviewed apply acceptance remain pending.",
      ),
      active(
        "Review and authorization workflows for graph mutations",
        "Admins can create one explicit pending-review content mapping through the normal Content Management workflow. Bulk migration candidate selection remains checksum-bound; no merely resolvable candidate is approved automatically.",
      ),
      active(
        "Compatibility-aware dual writes during migration",
        "The reviewed content-mapping transaction writes pending graph records and idempotent outbox events atomically. Outbox processing and other curation domains remain planned.",
      ),
      active(
        "Audit summaries that preserve existing audit consumers",
        "Successful quarantine and apply transactions write graph migration reports and existing audit_log summary records in the same transaction; the implementation is deployed and production apply acceptance remains pending.",
      ),
      planned("Cross-stage browser accessibility and responsive acceptance"),
    ],
    acceptanceTests: [
      acceptance(
        "stage-7-canonical-entry-baseline",
        "Curation starts from reconciled canonical entities",
        "Canonical entities and bindings remain available before relationship, tag, content, and video curation begins.",
        "automated",
      ),
      acceptance(
        "stage-7-discusses-semantics",
        "Discovery relationships remain evidence-neutral",
        "The governed discusses relationship remains broad and explicitly does not imply evidentiary support.",
        "automated",
      ),
      acceptance(
        "stage-7-read-cutover-disabled",
        "Graph-powered material reads remain disabled",
        "Stage 7 curation work leaves material graph sections in their honest pre-cutover state until Stage 8.",
        "automated",
      ),
      acceptance(
        "stage-7-video-preview-capabilities",
        "Playlist preview is configured without write authority",
        "The YouTube credential remains server-side, read-only preview is enabled, private worksheet staging is controlled by an explicit server gate, and draft apply and graph reads remain disabled.",
        "automated",
      ),
      acceptance(
        "stage-7-video-playlist-preview",
        "Playlist intake is complete and non-mutating",
        "The production preview reconciles all 370 playlist items as 366 new and four private candidates with no duplicates, deleted or unavailable items, or graph writes; fixture tests cover deterministic parsing, classification, snapshots, and checksums.",
        "automated",
      ),
      acceptance(
        "stage-7-video-triage-export",
        "Playlist candidates export to a review-safe worksheet",
        "The preview downloads as formula-injection-safe CSV with provenance, provider status, issues, non-authoritative 3D-printing suggestions, and blank human-review fields for disposition, materials, topics, editorial targets, and notes.",
        "automated",
      ),
      acceptance(
        "stage-7-video-triage-validation",
        "Reviewed worksheets are validated before staging",
        "Local validation rejects malformed contracts, mixed preview provenance, invalid dispositions, and unsafe provider classifications while keeping rejected topic suggestions separate from reviewed tags.",
        "automated",
      ),
      acceptance(
        "stage-7-video-triage-foundation",
        "Private triage records preserve provenance and authorization",
        "Import batches, candidate rows, and editorial leads retain immutable source data; contributors and anonymous users have no access, staff cannot delete records, and reviewed fields remain editable and auditable.",
        "automated",
      ),
      acceptance(
        "stage-7-video-curation-backup",
        "Video curation records are included in recovery artifacts",
        "Backup schema 4.1 includes import batches, candidate rows, and editorial leads with counts and checksums while schema 4.0 backups remain valid.",
        "automated",
      ),
      acceptance(
        "stage-7-video-triage-staging",
        "Validated worksheets stage atomically without content writes",
        "A service-role-only transaction stages one private batch and all candidates, rejects malformed or duplicate inputs without partial rows, and returns the existing batch on an exact rerun while leaving videos, entities, mappings, tags, and editorial leads unchanged.",
        "automated",
      ),
      acceptance(
        "stage-7-video-triage-review",
        "Human triage decisions remain private and reversible",
        "Admin review updates one candidate and its aggregate batch status transactionally, restricts unavailable sources to ignore, supports reopening a decision, preserves reviewer attribution, and creates no videos, entities, mappings, tags, or editorial leads.",
        "automated",
      ),
      acceptance(
        "stage-7-video-triage",
        "Every playlist candidate has an explicit disposition",
        "Reviewers can classify a candidate as a material video, editorial lead, both, or ignored; reruns preserve those decisions and do not recreate dismissed candidates.",
      ),
      acceptance(
        "stage-7-video-draft-apply",
        "Accepted videos are created atomically as drafts",
        "A reviewed apply creates one video, one video entity, and one canonical binding without duplication or automatic publication, and is safe to resume after interruption.",
      ),
      acceptance(
        "stage-7-video-material-mapping",
        "Video material mappings require review",
        "Primary-subject, mentioned, and evidence mappings preserve reviewer state; evidence use cannot be inferred from playlist membership, title, description, or automated classification.",
      ),
      acceptance(
        "stage-7-video-topic-classification",
        "Video topics remain governed and composable",
        "Reviewers can assign the 3D printing topic independently from material mappings and editorial disposition; automated suggestions remain pending review and incidental mentions do not create tags.",
      ),
      acceptance(
        "stage-7-editorial-leads",
        "Mission-aligned videos can become private editorial leads",
        "General educational videos may be retained as private article, blog-post, or guide candidates with notes, assignment, status, and explicit linkage when converted, without becoming public videos or graph claims implicitly.",
      ),
      acceptance(
        "stage-7-content-mapping-preview-non-mutating",
        "Content-mapping preview writes no graph records",
        "The preview identifies relationship and content-mapping candidates from material_links, linked_material_ids, articles, and guides without creating entity_relationships, content_entities, or any other graph record; mutation_proof counts match before and after.",
        "automated",
      ),
      acceptance(
        "stage-7-content-mapping-preview-deterministic",
        "Content-mapping preview is deterministic across repeated calls",
        "Repeated preview calls return identical candidate totals, confirming the preview does not alter state between runs.",
        "automated",
      ),
      acceptance(
        "stage-7-content-mapping-preview-semantics",
        "Preview candidates use only conservative relationship semantics",
        "All suggested relationship types are related_to; all suggested content roles are discusses. Evidence, primary_subject, and inferred-support semantics are absent from preview output.",
        "automated",
      ),
      acceptance(
        "stage-7-content-mapping-preview-quarantine",
        "Unresolvable preview candidates are framed as awaiting_review",
        "Candidates where entities cannot be resolved carry resolution awaiting_review rather than a null, empty, or misleading label.",
        "automated",
      ),
      acceptance(
        "stage-7-content-mapping-preview-fixture-resolved",
        "Resolved candidate contract: both entity IDs present, resolution_notes null",
        "Fixture verifies that a resolved candidate always has non-null source and target entity_ids, null resolution_notes, and conservative semantics.",
        "automated",
      ),
      acceptance(
        "stage-7-content-mapping-preview-fixture-awaiting-review",
        "Awaiting-review candidates carry non-null resolution notes",
        "Fixture verifies that each awaiting_review candidate provides a non-empty explanation string rather than a null or silent omission.",
        "automated",
      ),
      acceptance(
        "stage-7-content-mapping-preview-fixture-already-mapped",
        "Already-mapped candidates retain entity IDs and carry notes",
        "Fixture verifies that already_mapped candidates still expose both entity_ids and a non-null resolution_notes string explaining the pre-existing mapping.",
        "automated",
      ),
      acceptance(
        "stage-7-content-mapping-preview-fixture-missing-binding",
        "Missing entity binding is distinct from missing material record",
        "Fixture verifies that the missing-binding case (material_uuid present but entity_id null) produces a distinct resolution_notes string from the missing-material case.",
        "automated",
      ),
      acceptance(
        "stage-7-content-mapping-preview-sample-limit",
        "sample_limit parameter caps returned candidate arrays",
        "Calling with sample_limit=2 returns at most 2 candidates per array while summary totals reflect the full scanned population.",
        "automated",
      ),
      acceptance(
        "stage-7-content-mapping-preview-summary-consistency",
        "Preview summary counts are internally consistent",
        "summary.total equals resolved + awaiting_review + already_mapped for both relationship and content-mapping candidates; all counts are non-negative.",
        "automated",
      ),
      acceptance(
        "stage-7-content-mapping-reviewed-manifest",
        "Only explicitly reviewed content-mapping candidates can be applied",
        "The admin selects individual resolved candidates; the server rejects unknown, duplicate, unresolved, stale, or self-referential manifest entries.",
        "automated",
      ),
      acceptance(
        "stage-7-content-mapping-transaction",
        "Graph rows and compatibility events commit atomically",
        "The service-role-only database transaction creates pending-review graph rows, outbox events, migration reconciliation, and an audit summary together or rolls everything back.",
        "automated",
      ),
      acceptance(
        "stage-7-content-mapping-idempotency",
        "Reviewed apply and quarantine reruns are idempotent",
        "An exact checksum or manifest rerun returns its completed migration run without duplicating graph rows, outbox events, quarantine issues, or audit summaries.",
        "automated",
      ),
      acceptance(
        "stage-7-dual-write",
        "Dual writes remain reconcilable",
        "Legacy and graph representations match after create, update, review, and delete workflows.",
      ),
      acceptance(
        "stage-7-audit",
        "Graph mutations preserve audit compatibility",
        "Graph changes create summary audit records without breaking existing list, detail, statistics, or filtering interfaces.",
      ),
      acceptance(
        "stage-7-insight-review",
        "Key Insights require editorial approval",
        "Insight status, reviewer, review timestamp, supporting evidence, confidence or review status, and scope notes are preserved through approval and update workflows.",
      ),
      acceptance(
        "stage-7-browser-acceptance",
        "Stages 5-7 pass full browser acceptance",
        "Material and graph curation experiences pass keyboard, screen-reader, high-contrast, dark-mode, responsive, and reduced-motion browser testing before Stage 7 completes.",
      ),
    ],
  },
  {
    number: 8,
    slug: "stage-8",
    title: "Discovery & Learning Paths",
    status: "planned",
    summary:
      "Use verified graph data to power meaningful discovery rather than exposing an undifferentiated graph visualization.",
    deliverables: [
      planned("Knowledge Feed and recommended learning"),
      planned("Related entities grouped by relationship meaning"),
      planned("Curated discovery and learning paths"),
      planned("Verified legacy read/write deprecation process"),
    ],
    acceptanceTests: [
      acceptance(
        "stage-8-verified-reads",
        "Discovery reads only verified graph data",
        "Graph-powered sections do not replace legacy reads until reconciliation gates pass.",
      ),
      acceptance(
        "stage-8-deprecation",
        "Legacy deprecation is explicit and reversible",
        "Legacy writes stop only after verification; legacy reads remain for at least one release cycle.",
      ),
    ],
  },
  {
    number: 9,
    slug: "stage-9",
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
        "stage-9-history",
        "Historical audit records are preserved",
        "Audit migration accounts for every existing record and retains original payloads where automated conversion is impossible.",
      ),
      acceptance(
        "stage-9-api-compatibility",
        "Existing audit interfaces remain functional",
        "Audit list, detail, statistics, filtering, and export response shapes remain compatible or have documented adapters.",
      ),
      acceptance(
        "stage-9-restore",
        "Old and new backups restore successfully",
        "Representative pre-graph and graph-era backups restore into test environments and reconcile counts and checksums.",
      ),
    ],
  },
  {
    number: 10,
    slug: "stage-10",
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
        "stage-10-safety-gate",
        "Migration safety gates pass before scaling",
        "There is zero unexplained row or relationship loss and a documented manual recovery path for every unresolved migration category.",
      ),
      acceptance(
        "stage-10-backup-scale",
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
          "Extend the proven dry-run, checkpoint, quarantine, and reconciliation pattern to Stage 7 relationship, tag, and content population.",
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
