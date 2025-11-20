import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { PageTemplate } from './PageTemplate';
import { TestSuite } from './TestSuite';
import { PhaseFilteredTests } from './PhaseFilteredTests';

interface PhaseData {
  number: number;
  title: string;
  status: 'complete' | 'in-progress' | 'planned';
  completedDate?: string;
  description: string;
  keyDeliverables: string[];
}

interface SimplifiedRoadmapProps {
  onBack?: () => void;
  defaultTab?: 'overview' | '9.1' | '9.2' | '9.3' | '9.4' | '9.5' | '10' | 'tests' | 'backlog';
}

// Define available phase tabs in order - the first one is automatically the active phase
export const PHASE_TABS = [
  { id: '9.2', label: '9.2', fullName: 'Phase 9.2: Curation Workbench UI' },
  { id: '9.3', label: '9.3', fullName: 'Phase 9.3' },
  { id: '9.4', label: '9.4', fullName: 'Phase 9.4' },
  { id: '9.5', label: '9.5', fullName: 'Phase 9.5' },
  { id: '10', label: '10', fullName: 'Phase 10: Advanced Optimization' },
];

export function SimplifiedRoadmap({ onBack, defaultTab }: SimplifiedRoadmapProps) {
  const phaseTabs = PHASE_TABS;

  // The active phase is always the first phase tab
  const activePhase = phaseTabs[0];

  // Use activePhase.id as default if defaultTab not provided
  const [activeTab, setActiveTab] = React.useState<'overview' | '9.1' | '9.2' | '9.3' | '9.4' | '9.5' | '10' | 'tests' | 'backlog'>(
    defaultTab || (activePhase.id as any) || 'overview'
  );

  // Backlog (Future Enhancements)
  const backlogItems = [
    {
      title: 'Automated Cron Backups',
      description: 'Implement Deno cron scheduled nightly backups at 2 AM UTC with retention policy (7 daily, 4 weekly, 12 monthly) and failure alerts',
    },
    {
      title: 'Observability Dashboard',
      description: 'Comprehensive monitoring dashboard with metrics (error rate, latency percentiles, failed jobs), alert rules (CI width >0.3, stale aggregations), and structured logging with Winston',
    },
    {
      title: 'KV-Backed Pages Manager',
      description: 'Explore KV-backed JSON storage pattern (similar to ontologies) for Pages Manager - store page content in KV store with versioning, serve via API endpoints, maintain JSON files as source of truth for version control',
    },
    {
      title: 'Curation Queue & Claim Workflow',
      description: 'Priority queue showing materials with <3 MIUs per parameter, with OA filter, claim workflow to prevent duplicate work, and time estimates',
    },
    {
      title: 'Evidence Heatmap (Coverage Matrix)',
      description: 'Visual matrix showing evidence coverage gaps: rows = materials, columns = parameters, color-coded by MIU count (green ≥3, yellow 1-2, red 0)',
    },
    {
      title: 'Release Management System',
      description: 'ReleaseManager UI for creating versioned releases with SHA-256 checksumming, changelog generation, and immutable release artifacts',
    },
    {
      title: 'MIU Deduplication',
      description: 'Duplicate detection for evidence points (MIUs) based on source + locator + parameter + value, with near-match detection (ε=0.05)',
    },
    {
      title: 'Guest Role Refactoring',
      description: 'Change unauthenticated role from "user" to "guest" for clearer semantic distinction between logged-out and authenticated states',
    },
    {
      title: 'Admin Dashboard Polish',
      description: 'Final UX improvements: keyboard shortcuts, search/filter in admin views, performance optimizations',
    },
    {
      title: 'Cleanup for Expired Audit Logs',
      description: 'Add cleanup endpoint and UI for expired audit logs (similar to screenshot cleanup)',
    },
    {
      title: 'Admin Dashboard for Retention Statistics',
      description: 'Create admin dashboard showing retention statistics and cleanup actions in a unified interface',
    },
    {
      title: 'Bulk Deletion for Sources',
      description: 'Implement bulk deletion for sources without evidence dependencies',
    },
    {
      title: 'Retention Policy Configuration',
      description: 'Add UI to customize the 7-year retention threshold for different data types',
    },
  ];

  const phases: PhaseData[] = [
    {
      number: 1,
      title: 'Data Model Integration',
      status: 'complete',
      completedDate: 'October 20, 2025',
      description: 'Introduced the WasteDB scientific data layer with normalized parameters across three dimensions',
      keyDeliverables: [
        'Extended schema for CR, CC, RU scientific fields',
        'Confidence intervals and source weighting',
        'Migration scripts and API validation',
      ],
    },
    {
      number: 2,
      title: 'Admin & Research Tools',
      status: 'complete',
      completedDate: 'October 20, 2025',
      description: 'Built comprehensive admin tools for scientific parameter management',
      keyDeliverables: [
        'Data Processing View with dual modes (Theoretical & Practical)',
        'Admin Source Manager for citation metadata',
        'Auto-calculation of confidence categories',
      ],
    },
    {
      number: 3,
      title: 'Public Data & Export Layer',
      status: 'complete',
      completedDate: 'October 20, 2025',
      description: 'Created export system translating scientific data to user-friendly formats',
      keyDeliverables: [
        'Public CSV export (0-100 scale)',
        'Research export (raw normalized data + CI)',
        'JSON and CSV format support',
      ],
    },
    {
      number: 4,
      title: 'Visualization & Accessibility',
      status: 'complete',
      completedDate: 'October 22, 2025',
      description: 'Implemented Hybrid Quantile-Halo Visualization Model with comprehensive accessibility',
      keyDeliverables: [
        'Three visualization modes (Overlap, Near-Overlap, Gap)',
        'High-contrast, dark mode, reduced-motion support',
        'Interactive tooltips and ARIA labels',
      ],
    },
    {
      number: 5,
      title: 'Multi-Dimensional Scientific Data Layer',
      status: 'complete',
      completedDate: 'October 23, 2025',
      description: 'Extended scientific infrastructure to all three dimensions (CR, CC, RU)',
      keyDeliverables: [
        'Calculation endpoints for CC and RU',
        'ScientificDataEditor with tabbed interface',
        'Whitepapers for all three dimensions',
      ],
    },
    {
      number: 6,
      title: 'Content Management & Editorial Workflow',
      status: 'complete',
      completedDate: 'November 2, 2025',
      description: 'Enabled community-driven content creation with admin editorial oversight',
      keyDeliverables: [
        'User profiles and submission workflow',
        'Content Review Center with approve/edit/flag',
        'Email notifications via Resend',
      ],
    },
    {
      number: 7,
      title: 'Research API & Data Publication',
      status: 'complete',
      completedDate: 'October 30, 2025',
      description: 'Opened WasteDB data for public and academic use with comprehensive API',
      keyDeliverables: [
        'REST API with /materials, /stats, /categories endpoints',
        'Versioned methodology information',
        'Interactive API documentation',
      ],
    },
    {
      number: 8,
      title: 'Performance & Scalability',
      status: 'complete',
      completedDate: 'November 2, 2025',
      description: 'Optimized rendering performance for large datasets and complex visualizations',
      keyDeliverables: [
        'Chart rasterization with IndexedDB caching',
        'Virtual scrolling for material lists',
        'Performance monitoring and metrics collection',
        'Lazy loading for visualization rendering',
      ],
    },
    {
      number: 9,
      title: 'Evidence Pipeline & Curation System',
      status: 'in-progress',
      completedDate: 'November 13, 2025 (partial)',
      description: 'Building granular evidence extraction system with transform governance',
      keyDeliverables: [
        'Phase 9.0: Transform governance and versioning ✅',
        'Phase 9.1: Evidence points database schema (planned)',
        'Phase 9.2: Curation Workbench UI (planned)',
      ],
    },
    {
      number: 10,
      title: 'Advanced Performance & Data Optimization',
      status: 'planned',
      description: 'Future enhancements for server-side rendering, database optimization, and progressive loading',
      keyDeliverables: [
        'Server-side rendering for static charts',
        'Database query optimization for large collections',
        'Progressive loading for scientific data editor',
      ],
    },
  ];

  const getStatusIcon = (status: PhaseData['status']) => {
    switch (status) {
      case 'complete':
        return <CheckCircle2 className="size-5 text-green-600" />;
      case 'in-progress':
        return <Clock className="size-5 text-blue-600" />;
      case 'planned':
        return <Circle className="size-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: PhaseData['status']) => {
    switch (status) {
      case 'complete':
        return <Badge className="bg-green-600 hover:bg-green-700">Complete</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-600 hover:bg-blue-700">In Progress</Badge>;
      case 'planned':
        return <Badge variant="outline">Planned</Badge>;
    }
  };

  const completedPhases = phases.filter(p => p.status === 'complete').length;
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
        <span className="text-sm font-['Sniglet'] text-muted-foreground">Active Phase:</span>
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
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-['Sniglet'] text-[12px] transition-colors ${
              activeTab === 'overview'
                ? 'text-black dark:text-white border-b-2 border-[#211f1c] dark:border-white'
                : 'text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('9.2')}
            className={`px-4 py-2 font-['Sniglet'] text-[12px] transition-colors ${
              activeTab === '9.2'
                ? 'text-black dark:text-white border-b-2 border-[#211f1c] dark:border-white'
                : 'text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white'
            }`}
          >
            9.2
          </button>
          <button
            onClick={() => setActiveTab('9.3')}
            className={`px-4 py-2 font-['Sniglet'] text-[12px] transition-colors ${
              activeTab === '9.3'
                ? 'text-black dark:text-white border-b-2 border-[#211f1c] dark:border-white'
                : 'text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white'
            }`}
          >
            9.3
          </button>
          <button
            onClick={() => setActiveTab('9.4')}
            className={`px-4 py-2 font-['Sniglet'] text-[12px] transition-colors ${
              activeTab === '9.4'
                ? 'text-black dark:text-white border-b-2 border-[#211f1c] dark:border-white'
                : 'text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white'
            }`}
          >
            9.4
          </button>
          <button
            onClick={() => setActiveTab('9.5')}
            className={`px-4 py-2 font-['Sniglet'] text-[12px] transition-colors ${
              activeTab === '9.5'
                ? 'text-black dark:text-white border-b-2 border-[#211f1c] dark:border-white'
                : 'text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white'
            }`}
          >
            9.5
          </button>
          <button
            onClick={() => setActiveTab('10')}
            className={`px-4 py-2 font-['Sniglet'] text-[12px] transition-colors ${
              activeTab === '10'
                ? 'text-black dark:text-white border-b-2 border-[#211f1c] dark:border-white'
                : 'text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white'
            }`}
          >
            10
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-4 py-2 font-['Sniglet'] text-[12px] transition-colors ${
              activeTab === 'tests'
                ? 'text-black dark:text-white border-b-2 border-[#211f1c] dark:border-white'
                : 'text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white'
            }`}
          >
            Tests
          </button>
          <button
            onClick={() => setActiveTab('backlog')}
            className={`px-4 py-2 font-['Sniglet'] text-[12px] transition-colors ${
              activeTab === 'backlog'
                ? 'text-black dark:text-white border-b-2 border-[#211f1c] dark:border-white'
                : 'text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white'
            }`}
          >
            Backlog
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
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
                <span>{phases.filter(p => p.status === 'in-progress').length} In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <Circle className="size-4 text-gray-400" />
                <span>{phases.filter(p => p.status === 'planned').length} Planned</span>
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
                        <CardTitle className="text-xl">{phase.title}</CardTitle>
                        {phase.completedDate && (
                          <CardDescription className="mt-1">
                            {phase.completedDate}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{phase.description}</p>
                    
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Key Deliverables:</h4>
                      <ul className="space-y-1">
                        {phase.keyDeliverables.map((deliverable, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-muted-foreground mt-0.5">•</span>
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
              For detailed implementation status and technical documentation, see the{' '}
              <a href="/ROADMAP.md" target="_blank" className="underline hover:text-foreground">
                full ROADMAP.md
              </a>{' '}
              and documentation in <code className="text-xs bg-background px-1.5 py-0.5 rounded">/docs</code>
            </p>
          </CardContent>
        </Card>
      </div>
      )}

      {activeTab === 'tests' && (
        <div className="space-y-8">
          <TestSuite />
        </div>
      )}

      {activeTab === '9.2' && (
        <div className="space-y-8">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Phase 9.2 - Coming Soon</CardTitle>
              <CardDescription>Curation Workbench UI</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This phase is currently in planning. Content will be added as development progresses.
              </p>
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

      {activeTab === 'backlog' && (
        <div className="space-y-8">
          <h2 className="text-2xl">Backlog (Future Enhancements)</h2>
          <div className="space-y-6">
            {backlogItems.map((item, index) => (
              <Card key={index} className="flex-1 mb-2">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{item.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {item.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}
    </PageTemplate>
  );
}