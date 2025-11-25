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
    | "9.1"
    | "9.2"
    | "9.3"
    | "9.4"
    | "9.5"
    | "10"
    | "tests"
    | "backlog";
}

// Define available phase tabs in order - the first one is automatically the active phase
export const PHASE_TABS = [
  { id: "9.2", label: "9.2", fullName: "Phase 9.2: Curation Workbench UI" },
  { id: "9.3", label: "9.3", fullName: "Phase 9.3" },
  { id: "9.4", label: "9.4", fullName: "Phase 9.4" },
  { id: "9.5", label: "9.5", fullName: "Phase 9.5" },
  { id: "10", label: "10", fullName: "Phase 10: Advanced Optimization" },
];

export function SimplifiedRoadmap({
  onBack,
  defaultTab,
}: SimplifiedRoadmapProps) {
  const phaseTabs = PHASE_TABS;

  // The active phase is always the first phase tab
  const activePhase = phaseTabs[0];

  // Use activePhase.id as default if defaultTab not provided
  const [activeTab, setActiveTab] = React.useState<
    | "overview"
    | "9.1"
    | "9.2"
    | "9.3"
    | "9.4"
    | "9.5"
    | "10"
    | "tests"
    | "backlog"
  >(defaultTab || (activePhase.id as any) || "overview");

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
      title: "Data Model Integration",
      status: "complete",
      completedDate: "October 20, 2025",
      description:
        "Introduced the WasteDB scientific data layer with normalized parameters across three dimensions",
      keyDeliverables: [
        "Extended schema for CR, CC, RU scientific fields",
        "Confidence intervals and source weighting",
        "Migration scripts and API validation",
      ],
    },
    {
      number: 2,
      title: "Admin & Research Tools",
      status: "complete",
      completedDate: "October 20, 2025",
      description:
        "Built comprehensive admin tools for scientific parameter management",
      keyDeliverables: [
        "Data Processing View with dual modes (Theoretical & Practical)",
        "Admin Source Manager for citation metadata",
        "Auto-calculation of confidence categories",
      ],
    },
    {
      number: 3,
      title: "Public Data & Export Layer",
      status: "complete",
      completedDate: "October 20, 2025",
      description:
        "Created export system translating scientific data to user-friendly formats",
      keyDeliverables: [
        "Public CSV export (0-100 scale)",
        "Research export (raw normalized data + CI)",
        "JSON and CSV format support",
      ],
    },
    {
      number: 4,
      title: "Visualization & Accessibility",
      status: "complete",
      completedDate: "October 22, 2025",
      description:
        "Implemented Hybrid Quantile-Halo Visualization Model with comprehensive accessibility",
      keyDeliverables: [
        "Three visualization modes (Overlap, Near-Overlap, Gap)",
        "High-contrast, dark mode, reduced-motion support",
        "Interactive tooltips and ARIA labels",
      ],
    },
    {
      number: 5,
      title: "Multi-Dimensional Scientific Data Layer",
      status: "complete",
      completedDate: "October 23, 2025",
      description:
        "Extended scientific infrastructure to all three dimensions (CR, CC, RU)",
      keyDeliverables: [
        "Calculation endpoints for CC and RU",
        "ScientificDataEditor with tabbed interface",
        "Whitepapers for all three dimensions",
      ],
    },
    {
      number: 6,
      title: "Content Management & Editorial Workflow",
      status: "complete",
      completedDate: "November 2, 2025",
      description:
        "Enabled community-driven content creation with admin editorial oversight",
      keyDeliverables: [
        "User profiles and submission workflow",
        "Content Review Center with approve/edit/flag",
        "Email notifications via Resend",
      ],
    },
    {
      number: 7,
      title: "Research API & Data Publication",
      status: "complete",
      completedDate: "October 30, 2025",
      description:
        "Opened WasteDB data for public and academic use with comprehensive API",
      keyDeliverables: [
        "REST API with /materials, /stats, /categories endpoints",
        "Versioned methodology information",
        "Interactive API documentation",
      ],
    },
    {
      number: 8,
      title: "Performance & Scalability",
      status: "complete",
      completedDate: "November 2, 2025",
      description:
        "Optimized rendering performance for large datasets and complex visualizations",
      keyDeliverables: [
        "Chart rasterization with IndexedDB caching",
        "Virtual scrolling for material lists",
        "Performance monitoring and metrics collection",
        "Lazy loading for visualization rendering",
      ],
    },
    {
      number: 9,
      title: "Evidence Pipeline & Curation System",
      status: "in-progress",
      completedDate: "November 13, 2025 (partial)",
      description:
        "Building granular evidence extraction system with transform governance",
      keyDeliverables: [
        "Phase 9.0: Transform governance and versioning ✅",
        "Phase 9.1: Evidence points database schema (planned)",
        "Phase 9.2: Curation Workbench UI (planned)",
      ],
    },
    {
      number: 10,
      title: "Advanced Performance & Data Optimization",
      status: "planned",
      description:
        "Future enhancements for server-side rendering, database optimization, and progressive loading",
      keyDeliverables: [
        "Server-side rendering for static charts",
        "Database query optimization for large collections",
        "Progressive loading for scientific data editor",
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
      {/* Active Phase Badge - first phase tab is always the active one */}
      <div className="mb-6 flex items-center gap-3">
        <span className="text-sm font-['Sniglet'] text-muted-foreground">
          Active Phase:
        </span>
        <Badge className="bg-[#bae1ff] text-black hover:bg-[#9dd1ff] font-['Sniglet'] px-3 py-1">
          {activePhase.fullName}
        </Badge>
        <span className="text-xs text-muted-foreground font-['Sniglet']">
          (When complete, remove this tab to advance to the next phase)
        </span>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 border-b border-[#211f1c]/20 dark:border-white/20">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 font-['Sniglet'] text-[12px] transition-colors ${
              activeTab === "overview"
                ? "text-black dark:text-white border-b-2 border-[#211f1c] dark:border-white"
                : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("9.2")}
            className={`px-4 py-2 font-['Sniglet'] text-[12px] transition-colors ${
              activeTab === "9.2"
                ? "text-black dark:text-white border-b-2 border-[#211f1c] dark:border-white"
                : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
            }`}
          >
            9.2
          </button>
          <button
            onClick={() => setActiveTab("9.3")}
            className={`px-4 py-2 font-['Sniglet'] text-[12px] transition-colors ${
              activeTab === "9.3"
                ? "text-black dark:text-white border-b-2 border-[#211f1c] dark:border-white"
                : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
            }`}
          >
            9.3
          </button>
          <button
            onClick={() => setActiveTab("9.4")}
            className={`px-4 py-2 font-['Sniglet'] text-[12px] transition-colors ${
              activeTab === "9.4"
                ? "text-black dark:text-white border-b-2 border-[#211f1c] dark:border-white"
                : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
            }`}
          >
            9.4
          </button>
          <button
            onClick={() => setActiveTab("9.5")}
            className={`px-4 py-2 font-['Sniglet'] text-[12px] transition-colors ${
              activeTab === "9.5"
                ? "text-black dark:text-white border-b-2 border-[#211f1c] dark:border-white"
                : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
            }`}
          >
            9.5
          </button>
          <button
            onClick={() => setActiveTab("10")}
            className={`px-4 py-2 font-['Sniglet'] text-[12px] transition-colors ${
              activeTab === "10"
                ? "text-black dark:text-white border-b-2 border-[#211f1c] dark:border-white"
                : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
            }`}
          >
            10
          </button>
          <button
            onClick={() => setActiveTab("tests")}
            className={`px-4 py-2 font-['Sniglet'] text-[12px] transition-colors ${
              activeTab === "tests"
                ? "text-black dark:text-white border-b-2 border-[#211f1c] dark:border-white"
                : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
            }`}
          >
            Tests
          </button>
          <button
            onClick={() => setActiveTab("backlog")}
            className={`px-4 py-2 font-['Sniglet'] text-[12px] transition-colors ${
              activeTab === "backlog"
                ? "text-black dark:text-white border-b-2 border-[#211f1c] dark:border-white"
                : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
            }`}
          >
            Backlog
          </button>
        </div>
      </div>

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
                    className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <span className="font-bold text-2xl min-w-[4rem] text-right">
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
                    <div className="flex-shrink-0">
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
                              Phase {phase.number}
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

      {activeTab === "9.2" && (
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
                  <h4 className="text-sm font-semibold mb-2">Scope:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>
                      • <strong>Pilot Dimension:</strong> CR (Recyclability)
                      only
                    </li>
                    <li>
                      • <strong>Materials:</strong> Aluminum, PET, Cardboard (3
                      high-priority materials)
                    </li>
                    <li>
                      • <strong>Parameters:</strong> Y, D, C, M, E (5 CR
                      parameters)
                    </li>
                    <li>
                      • <strong>Duration:</strong> 1-2 weeks (estimated)
                    </li>
                  </ul>
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
                    <CheckCircle2 className="size-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Split-pane layout:</strong> Source Viewer (left) +
                      Evidence Wizard (right)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Source selection:</strong> Browse and select from
                      Source Library Manager
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Source viewer:</strong> Display source metadata,
                      abstract, DOI
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Circle className="size-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Smart context pre-fill:</strong> Auto-detect
                      material/parameter from context (future enhancement)
                    </span>
                  </li>
                </ul>

                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>Note:</strong> PDF annotation tools, figure zoom,
                    and page navigation are{" "}
                    <strong>deferred to Phase 9.4 Week 1</strong> (before
                    scaling to all materials).
                  </p>
                  <p className="text-xs text-blue-800 dark:text-blue-200 mt-2">
                    <strong>Rationale:</strong> Low volume in pilot (~45 MIUs)
                    makes copy/paste workflow acceptable. Better ROI when
                    scaling to 8 materials × 13 parameters (~300+ MIUs).
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
                        <CheckCircle2 className="size-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Browse source library with search/filter</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="size-4 text-green-600 mt-0.5 flex-shrink-0" />
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
                        <CheckCircle2 className="size-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>
                          Select from pilot materials (Aluminum, PET, Cardboard)
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="size-4 text-green-600 mt-0.5 flex-shrink-0" />
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
                        <CheckCircle2 className="size-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Select from CR parameters (Y, D, C, M, E)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="size-4 text-green-600 mt-0.5 flex-shrink-0" />
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
                        <CheckCircle2 className="size-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>
                          Paste text snippet from source (&lt;250 words)
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="size-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Input raw value (numeric) and unit</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="size-4 text-green-600 mt-0.5 flex-shrink-0" />
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
                        <CheckCircle2 className="size-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>
                          Specify locator (page, figure, or table number)
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="size-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Set confidence level (high/medium/low)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="size-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Add optional curator notes</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="size-4 text-green-600 mt-0.5 flex-shrink-0" />
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
              <CardTitle className="text-lg">Success Criteria</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-0.5">•</span>
                  <span>
                    3 pilot materials have ≥3 MIUs per parameter (15 MIUs per
                    material minimum)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-0.5">•</span>
                  <span>κ ≥ 0.7 for all double-extracted sources</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-0.5">•</span>
                  <span>&lt;3 minutes average MIU creation time</span>
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
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-green-600" />
                    Completed
                  </h4>
                  <ul className="space-y-1 text-sm text-muted-foreground ml-6">
                    <li>✅ CurationWorkbench.tsx component created</li>
                    <li>✅ Split-pane layout with source viewer and wizard</li>
                    <li>✅ 5-step progressive wizard with validation</li>
                    <li>✅ Source selection from Source Library Manager</li>
                    <li>✅ Material and parameter selection (pilot scope)</li>
                    <li>✅ Form validation and error handling</li>
                    <li>✅ Integration with POST /evidence endpoint</li>
                    <li>✅ Wastefull brand retro design system</li>
                    <li>✅ EvidenceListViewer.tsx component created</li>
                    <li>✅ Filter by material and parameter (pilot scope)</li>
                    <li>✅ Search functionality (snippets and citations)</li>
                    <li>✅ MIU detail view modal with full metadata</li>
                    <li>✅ Confidence level badges with color coding</li>
                    <li>✅ Locator display (page/figure/table)</li>
                    <li>✅ Integration with GET /evidence endpoint</li>
                    <li>✅ Unit ontology validation integration</li>
                    <li>✅ Real-time unit validation against allowed units</li>
                    <li>✅ Unit dropdown with parameter-specific options</li>
                    <li>✅ Canonical unit display and conversion hints</li>
                    <li>✅ Validation error messages with allowed units</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Clock className="size-4 text-blue-600" />
                    In Progress / Refinements
                  </h4>
                  <ul className="space-y-1 text-sm text-muted-foreground ml-6">
                    <li>
                      🔄 Smart context pre-fill (detect material/parameter from
                      text)
                    </li>
                    <li>🔄 MIU review and edit functionality</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Circle className="size-4 text-gray-400" />
                    Deferred to Production
                  </h4>
                  <ul className="space-y-1 text-sm text-muted-foreground ml-6">
                    <li>⏸️ Integrated PDF viewer with text selection</li>
                    <li>⏸️ PDF annotation and highlighting tools</li>
                    <li>⏸️ Page jump and figure zoom navigation</li>
                    <li>⏸️ OCR text extraction from PDF images</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Show testing console for this phase */}
          <PhaseFilteredTests
            phase="9.2"
            title="Phase 9.2 Tests"
            description="Curation Workbench UI Tests"
          />
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
