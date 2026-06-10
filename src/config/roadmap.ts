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
    status: "active",
    summary:
      "Restructure material pages as clear educational journeys while preserving every existing workflow and data surface.",
    deliverables: [
      planned("Material Overview and Material Intelligence hierarchy"),
      planned("Key Insights and recommended learning sections using current data"),
      planned("Stable contracts and honest empty states for graph-powered sections"),
      planned("Preserve evidence, attribution, export, and contribution workflows"),
    ],
    acceptanceTests: [
      acceptance(
        "stage-5-current-data",
        "Existing material data remains visible",
        "The redesigned page exposes all current scores, evidence, sources, attribution, and contribution actions without loss.",
      ),
      acceptance(
        "stage-5-empty-states",
        "Graph-dependent sections fail honestly",
        "Knowledge Feed, Related Entities, and Discovery Paths show explicit empty states until graph data exists.",
      ),
      acceptance(
        "stage-5-accessibility",
        "Redesigned hierarchy remains accessible",
        "Keyboard, screen-reader, high-contrast, dark-mode, and reduced-motion behavior remains functional.",
      ),
    ],
  },
  {
    number: 6,
    slug: "stage-6",
    title: "Knowledge Graph Foundation",
    status: "planned",
    summary:
      "Add the graph data layer through additive, observable, and recoverable migrations without replacing authoritative domain tables.",
    deliverables: [
      planned("Resolve schema ADRs for canonical references, enums, and RLS"),
      planned("Add graph tables, indexes, policies, and compatibility adapters"),
      planned("Backfill entities, relationships, tags, content mappings, and evidence links"),
      planned("Provide dry-run, reconciliation, quarantine, resume, and manual repair tools"),
    ],
    acceptanceTests: [
      acceptance(
        "stage-6-backup-gate",
        "Verified backup exists before migration",
        "A versioned full backup includes schema manifest, row counts, checksums, and export timestamp before writes begin; storage has a separately verified provider backup when affected.",
      ),
      acceptance(
        "stage-6-idempotent",
        "Graph migration is idempotent and resumable",
        "Dry run, repeated execution, partial failure, and resume produce no duplicate or unexplained lost records.",
      ),
      acceptance(
        "stage-6-rollback",
        "Rollback limits and recovery are tested",
        "Every migration category has tested rollback instructions or an explicit manual recovery action when rollback is not safe.",
      ),
      acceptance(
        "stage-6-reconciliation",
        "Source and graph data reconcile",
        "Counts, identifiers, relationships, and checksums reconcile before graph read paths are enabled.",
      ),
      acceptance(
        "stage-6-quarantine",
        "Unresolved records retain original payloads",
        "Ambiguous or invalid records are reported and quarantined for manual repair rather than discarded.",
      ),
      acceptance(
        "stage-6-manual-correction",
        "Manual corrections are safe to rerun",
        "Reviewed corrections resume cleanly, retain original payloads, and reconcile without duplicating relationships.",
      ),
    ],
  },
  {
    number: 7,
    slug: "stage-7",
    title: "Graph Content & Curation",
    status: "planned",
    summary:
      "Add governed graph content, first-class videos, and graph-aware contributor and admin workflows.",
    deliverables: [
      planned("Relationship, entity, tag, and video curation tools"),
      planned("Review and authorization workflows for graph mutations"),
      planned("Compatibility-aware dual writes during migration"),
      planned("Audit summaries that preserve existing audit consumers"),
    ],
    acceptanceTests: [
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
      planned("Versioned audit migration with reconciliation and rollback instructions"),
      planned("Compatibility adapters for existing audit endpoints and consumers"),
      planned("Documented retention, incompatibilities, and manual recovery paths"),
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
  ROADMAP_STAGES.find((stage) => stage.status === "active") ?? ROADMAP_STAGES[0];

export const ACTIVE_STAGE_TAB_ID: RoadmapTabId = ACTIVE_STAGE.slug;

export const ROADMAP_PROGRESS = {
  total: ROADMAP_STAGES.length,
  complete: ROADMAP_STAGES.filter((stage) => stage.status === "complete").length,
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
        title: "Migration dry-run and quarantine tooling",
        description:
          "Report conflicts and unresolved records while preserving original payloads for manual repair.",
        origin: "Stage 6",
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

export function getStageNumberForLegacyPhase(phase: string): number | undefined {
  return LEGACY_PHASE_STAGE_MAP[phase];
}
