import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { PageTemplate } from './PageTemplate';

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
}

export function SimplifiedRoadmap({ onBack }: SimplifiedRoadmapProps) {
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
    </PageTemplate>
  );
}