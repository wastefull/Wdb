import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { PageTemplate } from "../shared/PageTemplate";
import { TestSuite } from "./TestSuite";
import { PhaseFilteredTests } from "./PhaseFilteredTests";

interface PhaseData {
  number: number;
  title: string;
  status: "complete" | "in-progress" | "planned";
  completedDate?: string;
  description: string;
  keyDeliverables: string[];
}

interface SimplifiedRoadmapProps {
  onBack?: () => void;
  defaultTab?:
    | "overview"
    | "curation-lab"
    | "data-migration"
    | "next-stage"
    | "scale"
    | "tests"
    | "backlog";
  /** When true, locks to overview tab only (no tests, no phase tabs) */
  staffMode?: boolean;
}

// Define available stage tabs in order — the first one is shown as the "next up" stage.
export const PHASE_TABS = [
  {
    id: "next-stage",
    label: "Next Stage",
    fullName: "Next Stage (TBD)",
  },
  {
    id: "scale",
    label: "Scale",
    fullName: "Scale: Evidence Curation & Growth",
  },
  {
    id: "data-migration",
    label: "Data Migration",
    fullName: "Data Migration: KV → Postgres",
  },
  {
    id: "curation-lab",
    label: "Curation Lab",
    fullName: "Curation Lab (Partial)",
  },
];

export function SimplifiedRoadmap({
  onBack,
  defaultTab,
  staffMode,
}: SimplifiedRoadmapProps) {
  const phaseTabs = PHASE_TABS;

  // The active phase is always the first phase tab
  const activePhase = phaseTabs[0];

  // Use activePhase.id as default if defaultTab not provided
  const [activeTab, setActiveTab] = React.useState<
    | "overview"
    | "curation-lab"
    | "data-migration"
    | "next-stage"
    | "scale"
    | "tests"
    | "backlog"
  >(
    staffMode
      ? "overview"
      : (defaultTab as any) || (activePhase.id as any) || "overview",
  );

  // Backlog (Future Enhancements)
  const backlogItems = [
    {
      priority: "high",
      category: "Data Retention & Lifecycle Management",
      items: [
        {
          title: "Audit Log Cleanup Enhancements",
          description:
            "Add date range selector, preview before deletion, export option, and filter by entity type",
          effort: "2-3 hours",
          status: "Deferred from Phase 9.0 Day 7",
        },
        {
          title: "Retention Dashboard Integration",
          description:
            "Add visual charts, storage space indicators, last cleanup date tracking, and automated cleanup scheduling UI",
          effort: "4-5 hours",
          status: "Deferred from Phase 9.0 Day 7",
        },
        {
          title: "Bulk Source Deletion",
          description:
            "Allow admins to delete multiple sources at once with referential integrity checks and batch operations",
          effort: "5-6 hours",
          status: "Deferred from Phase 9.0 Day 7",
        },
        {
          title: "Configurable Retention Policies",
          description:
            "Allow admins to customize retention periods instead of hardcoded 7 years, with policy versioning",
          effort: "6-8 hours",
          status: "Deferred from Phase 9.0 Day 7",
        },
      ],
    },
    {
      priority: "medium",
      category: "Guides System",
      items: [
        {
          title: "Guide Renderer Common Mistakes Section",
          description:
            "Add support for rendering 'Common Mistakes' section in GuideRenderer with retro-card styling",
          effort: "1 hour",
          status: "Identified December 17, 2025",
        },
        {
          title: "View Count Increment",
          description:
            "Track and increment view count when guide detail page loads",
          effort: "30 minutes",
          status: "Identified December 17, 2025",
        },
        {
          title: "Read Time Calculation and Display",
          description:
            "Calculate estimated read time and display on guide cards with clock icon",
          effort: "30 minutes",
          status: "Identified December 17, 2025",
        },
        {
          title: "Share Guide Functionality",
          description:
            "Add share button using Web Share API with clipboard fallback",
          effort: "1 hour",
          status: "Identified December 17, 2025",
        },
        {
          title: "PDF Export for Guides",
          description:
            "Generate downloadable PDF version of guides with download tracking",
          effort: "2-3 hours",
          status: "Identified December 17, 2025",
        },
        {
          title: "Create Paper Recycling 101 Example Guide",
          description:
            "Create the example guide from mockup to demonstrate full system capabilities",
          effort: "1 hour",
          status: "Identified December 17, 2025",
        },
      ],
    },
    {
      priority: "medium",
      category: "Content Management",
      items: [
        {
          title: "Inline Diff Viewer for Article Updates",
          description:
            "Show color-coded diffs when reviewing article edits with visual diff component",
          effort: "3-4 hours",
          status: "Deferred from Phase 6.4",
        },
      ],
    },
    {
      priority: "medium",
      category: "Source Library",
      items: [
        {
          title: "BibTeX Import/Export",
          description:
            "Support BibTeX format for academic citation management with import/export endpoints",
          effort: "4-5 hours",
          status: "Future work from Phase 9.0 Day 5",
        },
        {
          title: "DOI Auto-Lookup",
          description:
            "Automatically fetch citation metadata from DOI.org API to populate source fields",
          effort: "2-3 hours",
          status: "Future work from Phase 9.0 Day 5",
        },
        {
          title: "CrossRef Import for Source Creation",
          description:
            "Add CrossRef API integration to Source Library Manager for automatic metadata population when creating new sources",
          effort: "4-5 hours",
          status: "Identified in Phase 9.2",
        },
        {
          title: "Citation Generator",
          description:
            "Generate formatted citations in multiple styles (APA, MLA, Chicago)",
          effort: "3-4 hours",
          status: "Future work from Phase 9.0 Day 5",
        },
        {
          title: "Source Versioning",
          description:
            "Track changes to source metadata over time with version comparison and revert functionality",
          effort: "6-8 hours",
          status: "Future work from Phase 9.0 Day 5",
        },
        {
          title: "Advanced Search with Boolean Operators",
          description:
            "Support complex searches like (aluminum OR aluminium) AND recycling NOT contamination",
          effort: "5-6 hours",
          status: "Future work from Phase 9.0 Day 5",
        },
      ],
    },
    {
      priority: "medium",
      category: "Guides System",
      items: [
        {
          title: "Guide Renderer Common Mistakes Section",
          description:
            "Add support for rendering 'Common Mistakes' section in GuideRenderer with retro-card styling",
          effort: "1 hour",
          status: "Identified December 17, 2025",
        },
        {
          title: "View Count Increment",
          description:
            "Track and increment view count when guide detail page loads",
          effort: "30 minutes",
          status: "Identified December 17, 2025",
        },
        {
          title: "Read Time Calculation and Display",
          description:
            "Calculate estimated read time and display on guide cards with clock icon",
          effort: "30 minutes",
          status: "Identified December 17, 2025",
        },
        {
          title: "Share Guide Functionality",
          description:
            "Add share button using Web Share API with clipboard fallback",
          effort: "1 hour",
          status: "Identified December 17, 2025",
        },
        {
          title: "PDF Export for Guides",
          description:
            "Generate downloadable PDF version of guides with download tracking",
          effort: "2-3 hours",
          status: "Identified December 17, 2025",
        },
        {
          title: "Create Paper Recycling 101 Example Guide",
          description:
            "Create the example guide from mockup to demonstrate full system capabilities",
          effort: "1 hour",
          status: "Identified December 17, 2025",
        },
      ],
    },
    {
      priority: "medium",
      category: "Audit Log Viewer",
      items: [
        {
          title: "Scroll-to-Focus Behavior",
          description:
            "Ensure modal is visible when opening audit log detail from bottom of list",
          effort: "1 hour",
          status: "Deferred from Phase 9.0 Day 6",
        },
      ],
    },
    {
      priority: "low",
      category: "Authentication",
      items: [
        {
          title: "OAuth Providers (Google, GitHub)",
          description:
            "Add social sign-in options for improved user experience",
          effort: "8-10 hours",
          status: "Future work from Phase 3.5",
        },
        {
          title: "Remember Device",
          description:
            "Trust this device for 30 days checkbox with device fingerprinting",
          effort: "4-5 hours",
          status: "Future work from Phase 3.5",
        },
        {
          title: "Two-Factor Authentication",
          description:
            "TOTP with SMS backup codes and admin-only requirement option",
          effort: "10-12 hours",
          status: "Future work from Phase 3.5",
        },
        {
          title: "Resend Confirmation Email Button",
          description: "Add to sign-in page for unconfirmed accounts",
          effort: "1-2 hours",
          status: "Future work from Phase 3.5",
        },
      ],
    },
    {
      priority: "low",
      category: "Visualization",
      items: [
        {
          title: "Animation Improvements",
          description:
            "Smooth fade-in for quantile visualizations and animated transitions",
          effort: "2-3 hours",
          status: "Future work from Phase 4",
        },
        {
          title: "Tooltip Enhancements",
          description:
            "Add tooltips explaining each parameter tab with methodology references",
          effort: "2-3 hours",
          status: "Future work from Phase 4",
        },
        {
          title: "Badge Indicators",
          description:
            "Show count of materials with scientific data and data completeness percentage",
          effort: "1-2 hours",
          status: "Future work from Phase 4",
        },
        {
          title: "Keyboard Navigation",
          description:
            "Arrow keys to switch between CR/CC/RU tabs with localStorage memory",
          effort: "1-2 hours",
          status: "Future work from Phase 4",
        },
        {
          title: "Dark Mode Chart Support",
          description:
            "Configure sustainability graphs (CR/CC/RU visualizations) to render properly in dark mode",
          effort: "3-4 hours",
          status: "Future work from Phase 4",
        },
      ],
    },
    {
      priority: "low",
      category: "Performance",
      items: [
        {
          title: "Server-Side Chart Rendering",
          description:
            "Add server-side rendering option for static charts to reduce client computation",
          effort: "8-10 hours",
          status: "Migrated to Phase 10",
        },
        {
          title: "Database Query Optimization",
          description:
            "Add pagination, query result caching, database indexes, and query plan analysis",
          effort: "10-12 hours",
          status: "Migrated to Phase 10",
        },
        {
          title: "Progressive Data Loading",
          description:
            "Load scientific data editor tabs on-demand with lazy loading",
          effort: "4-5 hours",
          status: "Migrated to Phase 10",
        },
      ],
    },
    {
      priority: "low",
      category: "Logging & Monitoring",
      items: [
        {
          title: "Remote Logging Integration",
          description:
            "Integrate Sentry for error tracking and LogRocket for session replay",
          effort: "6-8 hours",
          status: "Future work from Logger implementation",
        },
        {
          title: "Log Level Filtering",
          description:
            "UI controls to show only warnings/errors and filter by log category",
          effort: "2-3 hours",
          status: "Future work from Logger implementation",
        },
        {
          title: "Persistent TEST_MODE Setting",
          description:
            "Store TEST_MODE preference in localStorage with toggle in developer tools",
          effort: "1 hour",
          status: "Future work from Logger implementation",
        },
      ],
    },
    {
      priority: "low",
      category: "Parameter & Caching",
      items: [
        {
          title: "Persisted Cache",
          description:
            "Store parameter availability cache in localStorage to improve offline performance",
          effort: "3-4 hours",
          status: "Future work from cache implementation",
        },
        {
          title: "Worker Thread Cache Building",
          description:
            "Move cache building to Web Worker to prevent UI blocking for large datasets",
          effort: "5-6 hours",
          status: "Future work from cache implementation",
        },
        {
          title: "Incremental Cache Updates",
          description:
            "Update cache incrementally instead of full rebuild, tracking changed materials",
          effort: "4-5 hours",
          status: "Future work from cache implementation",
        },
      ],
    },
    {
      priority: "low",
      category: "API & Developer Tools",
      items: [
        {
          title: "Interactive API Testing",
          description:
            'Add "Try it" buttons to test endpoints in UI with live response data',
          effort: "6-8 hours",
          status: "Future work from Phase 7",
        },
        {
          title: "API Rate Limiting",
          description:
            "Add rate limiting per IP/API key with status in headers",
          effort: "3-4 hours",
          status: "Future work from Phase 7",
        },
        {
          title: "API Versioning",
          description:
            "Support /api/v1 and /api/v2 simultaneously with deprecation notices",
          effort: "5-6 hours",
          status: "Future work from Phase 7",
        },
      ],
    },
  ];

  const phases: PhaseData[] = [
    {
      number: 1,
      title: "Foundation",
      status: "complete",
      completedDate: "November 2, 2025",
      description:
        "Core data model, admin tools, public export, visualization, multi-dimensional scientific data, content management, research API, and performance infrastructure",
      keyDeliverables: [
        "Scientific data model with CR, CC, RU parameters and confidence intervals",
        "Admin & research tools (ScientificDataEditor, BatchOperations)",
        "Hybrid Quantile-Halo visualization with accessibility support",
        "Content management & editorial workflow with email notifications",
        "Public REST API and CSV/JSON export layer",
        "Chart rasterization, virtual scrolling, and performance monitoring",
      ],
    },
    {
      number: 2,
      title: "Evidence Infrastructure",
      status: "complete",
      completedDate: "November 20, 2025",
      description:
        "Transform governance, MIU evidence system, legal framework, audit logging, and aggregation backend — all on KV store",
      keyDeliverables: [
        "Versioned transform definitions for all 13 parameters",
        "Evidence points CRUD API with unit/transform validation",
        "Legal framework: MIU licensing, DMCA takedown process",
        "Audit logging, data retention, backup & export",
        "Open access triage (Unpaywall integration)",
        "Parameter aggregation backend with version snapshots",
      ],
    },
    {
      number: 3,
      title: "Curation Lab",
      status: "in-progress",
      completedDate: "Partial — pivoted May 2026",
      description:
        "Curation Workbench UI for evidence extraction with PDF tooling. Partially shipped before the team pivoted to the database migration.",
      keyDeliverables: [
        "✅ Curation Workbench: split-pane layout + 5-step extraction wizard",
        "✅ Integrated PDF viewer with text-selection → auto-populate",
        "✅ MIU edit and delete with confirmation dialog",
        "⏸️ Evidence List Viewer (deprioritized)",
        "⏸️ PET pilot MIU extraction: 15+ MIUs (deprioritized)",
      ],
    },
    {
      number: 4,
      title: "Data Migration",
      status: "complete",
      completedDate: "May 21, 2026",
      description:
        "Migrated all core data from KV Store to a proper Postgres relational schema, with RLS, seeded data, and foreign-key integrity.",
      keyDeliverables: [
        "Relational tables: materials, articles, sources, user_profiles",
        "material_categories, material_links, material_sources join tables",
        "evidence_points and audit_log moved to Postgres",
        "RLS policies for all tables (anon, auth, admin tiers)",
        "Migration scripts + seeded data for all existing content",
      ],
    },
    {
      number: 5,
      title: "Next Stage (TBD)",
      status: "planned",
      description: "Coming soon — stage details being finalized.",
      keyDeliverables: [],
    },
    {
      number: 6,
      title: "Scale",
      status: "planned",
      description:
        "Build on the relational foundation: aggregation engine, evidence curation at scale, and public traceability layer.",
      keyDeliverables: [
        "Aggregation engine with weighted statistics and CI",
        "Evidence List Viewer (browse/filter/search all MIUs)",
        "PET pilot MIU extraction: 15+ MIUs (≥3 per CR parameter)",
        "Evidence curation for 30+ materials across all dimensions",
        "Public evidence traceability tab on material detail pages",
        "Community curator onboarding and quality metrics",
      ],
    },
  ];

  const getStatusIcon = (status: PhaseData["status"]) => {
    switch (status) {
      case "complete":
        return <CheckCircle2 className="size-5 text-green-600" />;
      case "in-progress":
        return <Clock className="size-5 text-blue-600" />;
      case "planned":
        return <Circle className="size-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: PhaseData["status"]) => {
    switch (status) {
      case "complete":
        return (
          <Badge className="bg-green-600 hover:bg-green-700">Complete</Badge>
        );
      case "in-progress":
        return (
          <Badge className="bg-blue-600 hover:bg-blue-700">In Progress</Badge>
        );
      case "planned":
        return <Badge variant="outline">Planned</Badge>;
    }
  };

  const completedPhases = phases.filter((p) => p.status === "complete").length;
  const totalPhases = phases.length;
  const progressPercentage = Math.round((completedPhases / totalPhases) * 100);

  return (
    <PageTemplate
      title="WasteDB Development Roadmap"
      description="A journey from concept to evidence-based scientific platform"
      onBack={onBack}
      maxWidth="5xl"
    >
      {/* Next Stage Badge */}
      {!staffMode && (
        <div className="mb-6 flex items-center gap-3">
          <span className="text-sm font-['Sniglet'] text-muted-foreground">
            Next Up:
          </span>
          <Badge className="bg-[#bae1ff] text-black hover:bg-[#9dd1ff] font-['Sniglet'] px-3 py-1">
            {activePhase.fullName}
          </Badge>
        </div>
      )}

      {/* Tabs */}
      {!staffMode && (
        <div className="mb-6">
          <div className="flex gap-2 border-b border-[#211f1c]/20 dark:border-white/20">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 font-['Sniglet'] text-[12px] transition-colors ${
                activeTab === "overview"
                  ? "normal border-b-2 border-[#211f1c] dark:border-white"
                  : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("next-stage")}
              className={`px-4 py-2 font-['Sniglet'] text-[12px] transition-colors ${
                activeTab === "next-stage"
                  ? "normal border-b-2 border-[#211f1c] dark:border-white"
                  : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
              }`}
            >
              Next Stage
            </button>
            <button
              onClick={() => setActiveTab("scale")}
              className={`px-4 py-2 font-['Sniglet'] text-[12px] transition-colors ${
                activeTab === "scale"
                  ? "normal border-b-2 border-[#211f1c] dark:border-white"
                  : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
              }`}
            >
              Scale
            </button>
            <button
              onClick={() => setActiveTab("data-migration")}
              className={`px-4 py-2 font-['Sniglet'] text-[12px] transition-colors ${
                activeTab === "data-migration"
                  ? "normal border-b-2 border-[#211f1c] dark:border-white"
                  : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
              }`}
            >
              Data Migration
            </button>
            <button
              onClick={() => setActiveTab("curation-lab")}
              className={`px-4 py-2 font-['Sniglet'] text-[12px] transition-colors ${
                activeTab === "curation-lab"
                  ? "normal border-b-2 border-[#211f1c] dark:border-white"
                  : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
              }`}
            >
              Curation Lab
            </button>
            <button
              onClick={() => setActiveTab("tests")}
              className={`px-4 py-2 font-['Sniglet'] text-[12px] transition-colors ${
                activeTab === "tests"
                  ? "normal border-b-2 border-[#211f1c] dark:border-white"
                  : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
              }`}
            >
              Tests
            </button>
            <button
              onClick={() => setActiveTab("backlog")}
              className={`px-4 py-2 font-['Sniglet'] text-[12px] transition-colors ${
                activeTab === "backlog"
                  ? "normal border-b-2 border-[#211f1c] dark:border-white"
                  : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
              }`}
            >
              Backlog
            </button>
          </div>
        </div>
      )}

      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Progress Overview */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Overall Progress</CardTitle>
              <CardDescription>
                {completedPhases} of {totalPhases} major phases complete
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-green-500 to-green-600 transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <span className="font-bold text-2xl min-w-16 text-right">
                  {progressPercentage}%
                </span>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-green-600" />
                  <span>{completedPhases} Complete</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-blue-600" />
                  <span>
                    {phases.filter((p) => p.status === "in-progress").length} In
                    Progress
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="size-4 text-gray-400" />
                  <span>
                    {phases.filter((p) => p.status === "planned").length}{" "}
                    Planned
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Phase Timeline */}
          <div className="space-y-4">
            <h2 className="text-2xl">Development Phases</h2>

            <div className="space-y-6">
              {phases.map((phase, index) => (
                <div key={phase.number} className="flex gap-4">
                  {/* Timeline Line */}
                  <div className="flex flex-col items-center">
                    <div className="shrink-0">
                      {getStatusIcon(phase.status)}
                    </div>
                    {index < phases.length - 1 && (
                      <div className="w-0.5 flex-1 bg-border mt-2 mb-2" />
                    )}
                  </div>

                  {/* Content */}
                  <Card className="flex-1 mb-2">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-mono text-muted-foreground">
                              Stage {phase.number}
                            </span>
                            {getStatusBadge(phase.status)}
                          </div>
                          <CardTitle className="text-xl">
                            {phase.title}
                          </CardTitle>
                          {phase.completedDate && (
                            <CardDescription className="mt-1">
                              {phase.completedDate}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground">
                        {phase.description}
                      </p>

                      <div>
                        <h4 className="text-sm font-semibold mb-2">
                          Key Deliverables:
                        </h4>
                        <ul className="space-y-1">
                          {phase.keyDeliverables.map((deliverable, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-sm"
                            >
                              <span className="text-muted-foreground mt-0.5">
                                •
                              </span>
                              <span>{deliverable}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center">
                For detailed implementation status and technical documentation,
                see the{" "}
                <a
                  href="/ROADMAP.md"
                  target="_blank"
                  className="underline hover:text-foreground"
                >
                  full ROADMAP.md
                </a>{" "}
                and documentation in{" "}
                <code className="text-xs bg-background px-1.5 py-0.5 rounded">
                  /docs
                </code>
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "tests" && (
        <div className="space-y-8">
          <TestSuite />
        </div>
      )}

      {activeTab === "curation-lab" && (
        <div className="space-y-8">
          {/* Phase Header */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-2xl">
                    Phase 9.2: Curation Workbench UI
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Build UI for evidence extraction workflow with pilot
                    implementation (CR dimension, 3 materials)
                  </CardDescription>
                </div>
                <Badge className="bg-blue-600 hover:bg-blue-700 text-white">
                  In Progress
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">
                    Scope (Revised January 2026):
                  </h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>
                      • <strong>Pilot Dimension:</strong> CR (Recyclability)
                      only
                    </li>
                    <li>
                      • <strong>Materials:</strong> PET (1 material deep-dive)
                    </li>
                    <li>
                      • <strong>Parameters:</strong> Y, D, C, M, E (5 CR
                      parameters)
                    </li>
                    <li>
                      • <strong>Target:</strong> 15+ MIUs (≥3 per parameter)
                    </li>
                    <li>
                      • <strong>Duration:</strong> 1 week (estimated)
                    </li>
                  </ul>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
                  <p className="text-sm text-amber-900 dark:text-amber-100">
                    <strong>Scope Reduction (Jan 5, 2026):</strong> Original
                    plan of 6 materials × 5 parameters (~45 MIUs via copy/paste)
                    proved impractical. Revised to 1 material with PDF tooling
                    to validate workflow before scaling.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deliverables */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Deliverables</h3>

            {/* Curation Workbench */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-green-600" />
                  Curation Workbench (Split-Pane Interface)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-green-600 mt-0.5 shrink-0" />
                    <span>
                      <strong>Split-pane layout:</strong> Source Viewer (left) +
                      Evidence Wizard (right)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-green-600 mt-0.5 shrink-0" />
                    <span>
                      <strong>Source selection:</strong> Browse and select from
                      Source Library Manager
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-green-600 mt-0.5 shrink-0" />
                    <span>
                      <strong>Source viewer:</strong> Display source metadata,
                      abstract, DOI
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Circle className="size-4 text-gray-400 mt-0.5 shrink-0" />
                    <span>
                      <strong>Smart context pre-fill:</strong> Auto-detect
                      material/parameter from context (future enhancement)
                    </span>
                  </li>
                </ul>

                <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
                  <p className="text-sm text-green-900 dark:text-green-100">
                    <strong>PDF Tooling (Accelerated):</strong> Text selection,
                    page navigation, and annotation tools are now part of Phase
                    9.2 to streamline evidence extraction.
                  </p>
                  <p className="text-xs text-green-800 dark:text-green-200 mt-2">
                    <strong>Decision (Jan 5, 2026):</strong> Manual copy/paste
                    proved too time-intensive. Building PDF tools now for better
                    curator experience.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Evidence Wizard */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-green-600" />
                  Evidence Wizard (5-Step MIU Creation Flow)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-2">
                      Step 1: Select Source
                    </h4>
                    <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="size-4 text-green-600 mt-0.5 shrink-0" />
                        <span>Browse source library with search/filter</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="size-4 text-green-600 mt-0.5 shrink-0" />
                        <span>Auto-populate citation from selected source</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-2">
                      Step 2: Choose Material
                    </h4>
                    <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="size-4 text-green-600 mt-0.5 shrink-0" />
                        <span>
                          Select from pilot material (PET for initial
                          validation)
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="size-4 text-green-600 mt-0.5 shrink-0" />
                        <span>Material badge indicates pilot status</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-2">
                      Step 3: Pick Parameter
                    </h4>
                    <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="size-4 text-green-600 mt-0.5 shrink-0" />
                        <span>Select from CR parameters (Y, D, C, M, E)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="size-4 text-green-600 mt-0.5 shrink-0" />
                        <span>Parameter descriptions with unit guidance</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-2">
                      Step 4: Extract Value & Context
                    </h4>
                    <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="size-4 text-green-600 mt-0.5 shrink-0" />
                        <span>
                          Paste text snippet from source (&lt;250 words)
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="size-4 text-green-600 mt-0.5 shrink-0" />
                        <span>Input raw value (numeric) and unit</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="size-4 text-green-600 mt-0.5 shrink-0" />
                        <span>Unit validation against ontology (future)</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-2">
                      Step 5: Add Metadata
                    </h4>
                    <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="size-4 text-green-600 mt-0.5 shrink-0" />
                        <span>
                          Specify locator (page, figure, or table number)
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="size-4 text-green-600 mt-0.5 shrink-0" />
                        <span>Set confidence level (high/medium/low)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="size-4 text-green-600 mt-0.5 shrink-0" />
                        <span>Add optional curator notes</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="size-4 text-green-600 mt-0.5 shrink-0" />
                        <span>
                          Submit creates MIU via POST /evidence endpoint
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Double-Extraction Validation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Circle className="size-5 text-gray-400" />
                  Double-Extraction Validation Workflow
                </CardTitle>
                <CardDescription>Planned for validation phase</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-0.5">•</span>
                    <span>Assign same source to 2 independent curators</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-0.5">•</span>
                    <span>Compute inter-rater reliability (Cohen's κ)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-0.5">•</span>
                    <span>Target: κ ≥ 0.7 (substantial agreement)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-0.5">•</span>
                    <span>Conflict resolution workflow for low κ values</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Performance Tracking */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Circle className="size-5 text-gray-400" />
                  Performance Tracking
                </CardTitle>
                <CardDescription>Planned for Phase 9.3</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-0.5">•</span>
                    <span>Time-per-MIU metrics (target: &lt;3 minutes)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-0.5">•</span>
                    <span>Curator leaderboard (opt-in)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-0.5">•</span>
                    <span>Quality score tracking</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Success Criteria */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">
                Success Criteria (Revised)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-0.5">•</span>
                  <span>PET has ≥3 MIUs per CR parameter (15+ MIUs total)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-0.5">•</span>
                  <span>PDF viewer with text selection functional</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-0.5">•</span>
                  <span>
                    &lt;5 minutes average MIU creation time (with PDF tools)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-0.5">•</span>
                  <span>
                    All Phase 9.1 API endpoints successfully integrated
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Implementation Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Implementation Status</CardTitle>
              <CardDescription>
                ⏸️ Partial — pivoted to Data Migration (May 2026)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-green-600" />
                    Completed
                  </h4>
                  <ul className="space-y-1 text-sm text-muted-foreground ml-6">
                    <li>
                      ✅ CurationWorkbench.tsx — split-pane layout + 5-step
                      extraction wizard
                    </li>
                    <li>
                      ✅ Integrated PDF viewer with text selection →
                      auto-populate
                    </li>
                    <li>
                      ✅ MIU edit form (value, unit, notes) with PUT
                      /evidence/:id
                    </li>
                    <li>
                      ✅ MIU delete with confirmation dialog and DELETE
                      /evidence/:id
                    </li>
                    <li>✅ Source selection from Source Library Manager</li>
                    <li>✅ Material and parameter selection</li>
                    <li>✅ Form validation and error handling</li>
                    <li>✅ Integration with POST /evidence endpoint</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Circle className="size-4 text-gray-400" />
                    Not Completed — Deprioritized
                  </h4>
                  <ul className="space-y-1 text-sm text-muted-foreground ml-6">
                    <li>⏸️ Unit ontology validation integration</li>
                    <li>⏸️ PDF annotation/highlighting persistence</li>
                    <li>⏸️ Double-extraction validation workflow</li>
                    <li className="text-xs italic text-muted-foreground/70 mt-1">
                      Evidence List Viewer and Pilot MIU extraction moved to
                      Scale stage.
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Show testing console for this phase */}
          <PhaseFilteredTests
            phase="9.2"
            title="Curation Lab Tests"
            description="Curation Workbench UI Tests"
          />
        </div>
      )}

      {activeTab === "data-migration" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl mb-1">Data Migration: KV → Postgres</h2>
            <p className="text-muted-foreground text-sm">
              Completed May 21, 2026 — Migrated all core data from the Supabase
              KV Store to a proper relational Postgres schema with RLS and
              seeded data.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="size-5 text-green-600" />
                Migration Complete
              </CardTitle>
              <CardDescription>
                All tables migrated May 20–21, 2026
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Tables Created</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground ml-6">
                    <li>
                      ✅ <code>user_profiles</code> — user accounts and roles
                    </li>
                    <li>
                      ✅ <code>material_categories</code> — category taxonomy
                    </li>
                    <li>
                      ✅ <code>materials</code> — core materials with scientific
                      fields
                    </li>
                    <li>
                      ✅ <code>articles</code> — long-form material articles
                    </li>
                    <li>
                      ✅ <code>sources</code> — bibliographic source library
                    </li>
                    <li>
                      ✅ <code>material_sources</code> — material ↔ source join
                      table
                    </li>
                    <li>
                      ✅ <code>material_links</code> — external resource links
                    </li>
                    <li>
                      ✅ <code>evidence_points</code> — MIU evidence records
                    </li>
                    <li>
                      ✅ <code>audit_log</code> — all mutations with actor +
                      timestamp
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2">Infrastructure</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground ml-6">
                    <li>✅ Row-Level Security (RLS) policies on all tables</li>
                    <li>✅ Anon, authenticated, and admin access tiers</li>
                    <li>
                      ✅ Migration scripts in <code>supabase/migrations/</code>
                    </li>
                    <li>
                      ✅ Seeded data for all existing materials and sources
                    </li>
                    <li>✅ Foreign-key integrity enforced across all tables</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "next-stage" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl mb-1">Next Stage (TBD)</h2>
            <p className="text-muted-foreground text-sm">
              Stage details coming soon.
            </p>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground italic">
                This stage is being defined. Check back soon.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "scale" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl mb-1">Scale: Evidence Curation & Growth</h2>
            <p className="text-muted-foreground text-sm">
              Planned — Build on the relational Postgres foundation to enable
              evidence curation at scale, aggregation, and public traceability.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Circle className="size-5 text-gray-400" />
                Planned Work
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground ml-6">
                <li>
                  ⬜ Aggregation engine with weighted statistics and confidence
                  intervals
                </li>
                <li>
                  ⬜ Evidence List Viewer (browse/filter/search all MIUs){" "}
                  <span className="text-xs">(carried from Curation Lab)</span>
                </li>
                <li>
                  ⬜ PET pilot MIU extraction: 15+ MIUs (≥3 per CR parameter){" "}
                  <span className="text-xs">(carried from Curation Lab)</span>
                </li>
                <li>
                  ⬜ Evidence curation for 30+ materials across all dimensions
                </li>
                <li>
                  ⬜ Public evidence traceability tab on material detail pages
                </li>
                <li>⬜ Community curator onboarding workflow</li>
                <li>⬜ Evidence quality metrics and duplicate detection</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "backlog" && (
        <div className="space-y-8">
          <h2 className="text-2xl">Backlog (Future Enhancements)</h2>
          <div className="space-y-6">
            {backlogItems.map((category, index) => (
              <Card key={index} className="flex-1 mb-2">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-xl">
                        {category.category}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {category.priority} Priority
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {category.items.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-muted-foreground mt-0.5">•</span>
                      <div>
                        <CardTitle className="text-sm font-semibold">
                          {item.title}
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                          {item.description}
                        </CardDescription>
                        <CardDescription className="text-xs text-muted-foreground">
                          Effort: {item.effort}
                        </CardDescription>
                        <CardDescription className="text-xs text-muted-foreground">
                          Status: {item.status}
                        </CardDescription>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </PageTemplate>
  );
}
