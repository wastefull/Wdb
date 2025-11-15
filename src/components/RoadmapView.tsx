import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { RoadmapPhaseTab } from './RoadmapPhaseTab';
import { Phase9Day1Testing } from './Phase9Day1Testing';
import { Phase9Day2Testing } from './Phase9Day2Testing';
import { Phase9Day3Testing } from './Phase9Day3Testing';

interface RoadmapViewProps {
  onBack: () => void;
}

export function RoadmapView({ onBack }: RoadmapViewProps) {
  const [activeTab, setActiveTab] = useState('day1');

  // Day 1 Deliverables
  const day1Deliverables = [
    {
      title: 'Transform Governance System',
      description: 'Implemented versioned transform definitions for all 13 parameters',
      completed: true,
    },
    {
      title: 'Backend API Endpoints',
      description: '5 new endpoints for transform management and recompute jobs',
      completed: true,
    },
    {
      title: 'Transform Version Manager UI',
      description: 'Complete management interface accessible from admin panel',
      completed: true,
    },
  ];

  // Day 2 Deliverables
  const day2Deliverables = [
    {
      title: 'Transform Definitions File',
      description: 'Created transforms.json with version 1.0 definitions for all 13 WasteDB parameters (Y, D, C, M, E, B, N, T, H, L, R, U, C_RU)',
      completed: true,
    },
    {
      title: 'Backend API Endpoints',
      description: '5 new endpoints for transform management and recompute jobs: GET /transforms, GET /transforms/:parameter, POST /transforms/recompute, GET /transforms/recompute/:jobId, GET /transforms/recompute',
      completed: true,
    },
    {
      title: 'Transform Version Manager UI',
      description: 'Complete management interface with transform overview, recompute dialog, and job history tracking',
      completed: true,
    },
    {
      title: 'Navigation Integration',
      description: 'Integrated Transform Manager into admin dashboard with proper navigation and routing',
      completed: true,
    },
    {
      title: 'Admin Dashboard Redesign',
      description: 'Left accordion menu with organized sections for all admin tools',
      completed: true,
    },
    {
      title: 'Menu Reorganization',
      description: 'New Moderation, Admin, Database, and Testing sections with nested navigation',
      completed: true,
    },
    {
      title: 'Admin Button Enhancement',
      description: 'Toggle for admin mode plus navigation to Admin Dashboard, fixed DOM nesting',
      completed: true,
    },
    {
      title: 'Session Expiration Handling',
      description: 'Comprehensive error handling with toast notifications, auto-redirect, periodic validation, and global error boundary',
      completed: true,
    },
  ];

  // Day 3 Deliverables (Planned)
  const day3Deliverables = [
    {
      title: 'Notification Backend Endpoints',
      description: 'Implement server endpoints: getNotifications, markNotificationAsRead, markAllNotificationsAsRead to support the notification bell UI',
      completed: true,
    },
    {
      title: 'Notification Bell Integration',
      description: 'Connect existing NotificationBell UI to new backend endpoints with real-time notification loading and badge counts',
      completed: false,
    },
    {
      title: 'MIU Schema Planning',
      description: 'Design database schema for evidence_points table (MIUs) and parameter_aggregations table for Phase 9.1 readiness',
      completed: true,
    },
    {
      title: 'Evidence Wizard Wireframes',
      description: 'Create component structure and navigation flow for split-pane Evidence Wizard UI (preparation for Phase 9.2)',
      completed: false,
    },
    {
      title: 'Transform Formula Testing',
      description: 'Validate current v1.0 transform formulas against existing material parameter values to ensure accuracy',
      completed: false,
    },
    {
      title: 'Documentation Update',
      description: 'Update technical documentation with Phase 9.0 architecture, API reference, and admin workflow guides',
      completed: false,
    },
  ];

  // Backlog (Future Enhancements)
  const backlogItems = [
    {
      title: 'Guest Role Refactoring',
      description: 'Change unauthenticated role from "user" to "guest" for clearer semantic distinction between logged-out and authenticated states',
      completed: false,
    },
    {
      title: 'Admin Dashboard Polish',
      description: 'Final UX improvements: keyboard shortcuts, search/filter in admin views, performance optimizations',
      completed: false,
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 bg-[#b8c8cb] rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all"
        >
          <ArrowLeft size={16} className="text-black" />
        </button>
        <div className="flex-1">
          <h2 className="font-['Fredoka_One'] text-[24px] text-black dark:text-white">
            Roadmap: Phase 9.0
          </h2>
          <p className="font-['Sniglet'] text-[12px] text-black/60 dark:text-white/60">
            Transform governance, admin dashboard redesign, and infrastructure improvements
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 border-b border-[#211f1c]/20 dark:border-white/20">
          <button
            onClick={() => setActiveTab('day1')}
            className={`px-4 py-2 font-['Sniglet'] text-[12px] transition-colors ${
              activeTab === 'day1'
                ? 'text-black dark:text-white border-b-2 border-[#211f1c] dark:border-white'
                : 'text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white'
            }`}
          >
            Day 1
          </button>
          <button
            onClick={() => setActiveTab('day2')}
            className={`px-4 py-2 font-['Sniglet'] text-[12px] transition-colors ${
              activeTab === 'day2'
                ? 'text-black dark:text-white border-b-2 border-[#211f1c] dark:border-white'
                : 'text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white'
            }`}
          >
            Day 2
          </button>
          <button
            onClick={() => setActiveTab('day3')}
            className={`px-4 py-2 font-['Sniglet'] text-[12px] transition-colors ${
              activeTab === 'day3'
                ? 'text-black dark:text-white border-b-2 border-[#211f1c] dark:border-white'
                : 'text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white'
            }`}
          >
            Day 3
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

      {/* Content */}
      <div className="bg-white dark:bg-[#1a1917] rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] p-6">
        {activeTab === 'day1' && (
          <RoadmapPhaseTab
            phase="Phase 9.0"
            dayNumber="Day 1"
            deliverables={day1Deliverables}
            testingView={<Phase9Day1Testing />}
            showTestingToggle={true}
          />
        )}
        {activeTab === 'day2' && (
          <RoadmapPhaseTab
            phase="Phase 9.0"
            dayNumber="Day 2"
            deliverables={day2Deliverables}
            testingView={<Phase9Day2Testing />}
            showTestingToggle={true}
          />
        )}
        {activeTab === 'day3' && (
          <RoadmapPhaseTab
            phase="Phase 9.0"
            dayNumber="Day 3"
            deliverables={day3Deliverables}
            testingView={<Phase9Day3Testing />}
            showTestingToggle={true}
          />
        )}
        {activeTab === 'backlog' && (
          <RoadmapPhaseTab
            phase="Phase 9.0"
            dayNumber="Backlog"
            deliverables={backlogItems}
            showTestingToggle={false}
          />
        )}
      </div>
    </div>
  );
}