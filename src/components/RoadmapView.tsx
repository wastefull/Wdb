import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { RoadmapPhaseTab } from './RoadmapPhaseTab';
import { Phase9Day1Testing } from './Phase9Day1Testing';
import { Phase9Day2Testing } from './Phase9Day2Testing';
import { Phase9Day3Testing } from './Phase9Day3Testing';
import { Phase9Day4Testing } from './Phase9Day4Testing';
import { Phase9Day5Testing } from './Phase9Day5Testing';
import { Phase9Day6Testing } from './Phase9Day6Testing';
import { Phase9Day7Testing } from './Phase9Day7Testing';

interface RoadmapViewProps {
  onBack: () => void;
}

export function RoadmapView({ onBack }: RoadmapViewProps) {
  const [activeTab, setActiveTab] = useState('completed');
  const [selectedDay, setSelectedDay] = useState<'day1' | 'day2' | 'day3' | 'day4' | 'day5' | 'day6'>('day6');

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
      completed: true,
    },
    {
      title: 'MIU Schema Planning',
      description: 'Design database schema for evidence_points table (MIUs) and parameter_aggregations table for Phase 9.1 readiness',
      completed: true,
    },
    {
      title: 'Evidence Lab Wireframes',
      description: 'Create component structure and navigation flow for split-pane Evidence Lab UI (preparation for Phase 9.2)',
      completed: true,
    },
    {
      title: 'Transform Formula Testing',
      description: 'Validate current v1.0 transform formulas against existing material parameter values to ensure accuracy',
      completed: true,
    },
    {
      title: 'Documentation Update',
      description: 'Update technical documentation with Phase 9.0 architecture, API reference, and admin workflow guides',
      completed: true,
    },
  ];

  // Day 4 Deliverables (Phase 9.1)
  const day4Deliverables = [
    {
      title: 'Evidence Backend CRUD Endpoints',
      description: '5 backend endpoints for managing evidence points: POST /evidence, GET /evidence/material/:materialId, GET /evidence/:evidenceId, PUT /evidence/:evidenceId, DELETE /evidence/:evidenceId',
      completed: true,
    },
    {
      title: 'Evidence Lab Integration',
      description: 'Connected Evidence Lab UI to backend with real CRUD operations replacing mock data',
      completed: true,
    },
    {
      title: 'Transform Validation System',
      description: 'Real-time validation of evidence values against transform definitions with parameter-aware unit checking',
      completed: true,
    },
    {
      title: 'Source Attribution',
      description: 'Complete source tracking with type selection (whitepaper/article/external/manual) and confidence levels',
      completed: true,
    },
    {
      title: 'Admin Evidence Management',
      description: 'Full admin interface for adding, editing, and deleting evidence with role-based access control',
      completed: true,
    },
  ];

  // Day 5 Deliverables (Source Deduplication)
  const day5Deliverables = [
    {
      title: 'DOI Normalization Function',
      description: 'Create DOI normalization function to handle various DOI formats (https, http, doi:, plain)',
      completed: true,
    },
    {
      title: 'Duplicate Check Endpoint',
      description: 'Create GET /sources/check-duplicate endpoint for detecting duplicate sources by DOI or title',
      completed: true,
    },
    {
      title: 'Fuzzy Title Matching',
      description: 'Implement fuzzy title matching using Levenshtein distance to catch non-DOI duplicates',
      completed: true,
    },
    {
      title: 'Duplicate Warning Modal',
      description: 'Create DuplicateSourceWarning.tsx modal to alert users of potential duplicates',
      completed: true,
    },
    {
      title: 'Source Merge Workflow',
      description: 'Add merge workflow for confirmed duplicates that preserves all MIU references',
      completed: true,
    },
    {
      title: 'Deduplication Testing',
      description: 'Test with known duplicate cases to ensure 100% DOI accuracy and 90%+ fuzzy match accuracy',
      completed: true,
    },
  ];

  // Day 6 Deliverables (Observability & Audit Logging)
  const day6Deliverables = [
    {
      title: 'Audit Log Infrastructure',
      description: 'Created audit log storage in KV store with AuditLogEntry interface for tracking all data changes',
      completed: true,
    },
    {
      title: 'Backend Audit Endpoints',
      description: 'Implemented 4 endpoints: POST /audit/log, GET /audit/logs (with filters), GET /audit/logs/:id, GET /audit/stats',
      completed: true,
    },
    {
      title: 'Audit Log Viewer Component',
      description: 'Created AuditLogViewer.tsx with statistics dashboard, filtering, pagination, detail modal, and export',
      completed: true,
    },
    {
      title: 'Search and Filter UI',
      description: 'Implemented comprehensive filtering by entity type, user, action type, date range, and search',
      completed: true,
    },
    {
      title: 'Navigation Integration',
      description: 'Added audit log viewer to Admin Dashboard with proper routing and admin-only access',
      completed: true,
    },
    {
      title: 'Testing Suite',
      description: 'Created Phase9Day6Testing component with 5 automated tests for all audit endpoints',
      completed: true,
    },
    {
      title: 'Email Notifications',
      description: 'Implemented email notifications for critical audit events (deletions, role changes) via Resend API',
      completed: true,
    },
    {
      title: 'CRUD Instrumentation',
      description: 'Added createAuditLog calls to all CRUD endpoints: materials, users, sources, evidence, whitepapers',
      completed: true,
    },
  ];

  // Day 7 Deliverables (Data Retention & Deletion)
  const day7Deliverables = [
    {
      title: 'Data Retention Policy Document',
      description: 'Create data retention policy document',
      completed: false,
    },
    {
      title: 'Delete Source Endpoint',
      description: 'Create DELETE /make-server-17cae920/sources/:id endpoint',
      completed: false,
    },
    {
      title: 'Referential Integrity Checks',
      description: 'Implement checks to prevent deletion if MIUs exist',
      completed: false,
    },
    {
      title: 'Screenshot Cleanup Cron Job',
      description: 'Create screenshot cleanup cron job (7-year policy)',
      completed: false,
    },
    {
      title: 'Data Retention Manager UI',
      description: 'Create DataRetentionManager.tsx admin UI',
      completed: false,
    },
    {
      title: 'Deletion Testing',
      description: 'Test deletion with dependent MIUs',
      completed: false,
    },
  ];

  // Day 8 Deliverables (Backup & Recovery)
  const day8Deliverables = [
    {
      title: 'Daily Supabase Backups',
      description: 'Configure daily Supabase backups (automatic)',
      completed: false,
    },
    {
      title: 'Manual Backup Trigger',
      description: 'Create manual backup trigger endpoint',
      completed: false,
    },
    {
      title: 'Backup Export Endpoint',
      description: 'Create POST /make-server-17cae920/backup/export (JSON dump)',
      completed: false,
    },
    {
      title: 'Backup Import Endpoint',
      description: 'Create POST /make-server-17cae920/backup/import (restore)',
      completed: false,
    },
    {
      title: 'Recovery Documentation',
      description: 'Document recovery procedures',
      completed: false,
    },
    {
      title: 'Restore Testing',
      description: 'Test restore from backup',
      completed: false,
    },
  ];

  // Day 9 Deliverables (Research Export Enhancements)
  const day9Deliverables = [
    {
      title: 'MIU Export Fields',
      description: 'Add MIU export fields (snippet, locator, transform_version)',
      completed: false,
    },
    {
      title: 'Provenance Metadata',
      description: 'Add provenance metadata (curator, extraction_date)',
      completed: false,
    },
    {
      title: 'Gzip Compression',
      description: 'Implement gzip compression for large exports',
      completed: false,
    },
    {
      title: 'Export Versioning',
      description: 'Add export versioning (v2.0 format)',
      completed: false,
    },
    {
      title: 'Export Format Documentation',
      description: 'Create export format documentation',
      completed: false,
    },
    {
      title: 'Large Export Testing',
      description: 'Test with 100+ material export',
      completed: false,
    },
  ];

  // Day 10 Deliverables (Open Access Triage)
  const day10Deliverables = [
    {
      title: 'Open Access Field',
      description: 'Add is_open_access BOOLEAN field to sources table',
      completed: false,
    },
    {
      title: 'OA Check Endpoint',
      description: 'Create GET /make-server-17cae920/sources/check-oa endpoint',
      completed: false,
    },
    {
      title: 'Unpaywall API Integration',
      description: 'Integrate Unpaywall API (DOI → OA status)',
      completed: false,
    },
    {
      title: 'OA Filter UI',
      description: 'Create OA filter in Source Library UI',
      completed: false,
    },
    {
      title: 'OA Badge',
      description: 'Add OA badge to source cards',
      completed: false,
    },
    {
      title: 'Prioritize OA Setting',
      description: 'Create "Prioritize OA" curator setting',
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
    {
      title: 'Cleanup for Expired Audit Logs',
      description: 'Add cleanup endpoint and UI for expired audit logs (similar to screenshot cleanup)',
      completed: false,
    },
    {
      title: 'Admin Dashboard for Retention Statistics',
      description: 'Create admin dashboard showing retention statistics and cleanup actions in a unified interface',
      completed: false,
    },
    {
      title: 'Bulk Deletion for Sources',
      description: 'Implement bulk deletion for sources without evidence dependencies',
      completed: false,
    },
    {
      title: 'Retention Policy Configuration',
      description: 'Add UI to customize the 7-year retention threshold for different data types',
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
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 font-['Sniglet'] text-[12px] transition-colors ${
              activeTab === 'completed'
                ? 'text-black dark:text-white border-b-2 border-[#211f1c] dark:border-white'
                : 'text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setActiveTab('day7')}
            className={`px-4 py-2 font-['Sniglet'] text-[12px] transition-colors ${
              activeTab === 'day7'
                ? 'text-black dark:text-white border-b-2 border-[#211f1c] dark:border-white'
                : 'text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white'
            }`}
          >
            Day 7
          </button>
          <button
            onClick={() => setActiveTab('day8')}
            className={`px-4 py-2 font-['Sniglet'] text-[12px] transition-colors ${
              activeTab === 'day8'
                ? 'text-black dark:text-white border-b-2 border-[#211f1c] dark:border-white'
                : 'text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white'
            }`}
          >
            Day 8
          </button>
          <button
            onClick={() => setActiveTab('day9')}
            className={`px-4 py-2 font-['Sniglet'] text-[12px] transition-colors ${
              activeTab === 'day9'
                ? 'text-black dark:text-white border-b-2 border-[#211f1c] dark:border-white'
                : 'text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white'
            }`}
          >
            Day 9
          </button>
          <button
            onClick={() => setActiveTab('day10')}
            className={`px-4 py-2 font-['Sniglet'] text-[12px] transition-colors ${
              activeTab === 'day10'
                ? 'text-black dark:text-white border-b-2 border-[#211f1c] dark:border-white'
                : 'text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white'
            }`}
          >
            Day 10
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
        {activeTab === 'completed' && (
          <div>
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => setSelectedDay('day1')}
                className={`px-4 py-2 font-['Sniglet'] text-[12px] transition-colors ${
                  selectedDay === 'day1'
                    ? 'text-black dark:text-white border-b-2 border-[#211f1c] dark:border-white'
                    : 'text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white'
                }`}
              >
                Day 1
              </button>
              <button
                onClick={() => setSelectedDay('day2')}
                className={`px-4 py-2 font-['Sniglet'] text-[12px] transition-colors ${
                  selectedDay === 'day2'
                    ? 'text-black dark:text-white border-b-2 border-[#211f1c] dark:border-white'
                    : 'text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white'
                }`}
              >
                Day 2
              </button>
              <button
                onClick={() => setSelectedDay('day3')}
                className={`px-4 py-2 font-['Sniglet'] text-[12px] transition-colors ${
                  selectedDay === 'day3'
                    ? 'text-black dark:text-white border-b-2 border-[#211f1c] dark:border-white'
                    : 'text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white'
                }`}
              >
                Day 3
              </button>
              <button
                onClick={() => setSelectedDay('day4')}
                className={`px-4 py-2 font-['Sniglet'] text-[12px] transition-colors ${
                  selectedDay === 'day4'
                    ? 'text-black dark:text-white border-b-2 border-[#211f1c] dark:border-white'
                    : 'text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white'
                }`}
              >
                Day 4
              </button>
              <button
                onClick={() => setSelectedDay('day5')}
                className={`px-4 py-2 font-['Sniglet'] text-[12px] transition-colors ${
                  selectedDay === 'day5'
                    ? 'text-black dark:text-white border-b-2 border-[#211f1c] dark:border-white'
                    : 'text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white'
                }`}
              >
                Day 5
              </button>
              <button
                onClick={() => setSelectedDay('day6')}
                className={`px-4 py-2 font-['Sniglet'] text-[12px] transition-colors ${
                  selectedDay === 'day6'
                    ? 'text-black dark:text-white border-b-2 border-[#211f1c] dark:border-white'
                    : 'text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white'
                }`}
              >
                Day 6
              </button>
            </div>
            {selectedDay === 'day1' && (
              <RoadmapPhaseTab
                phase="Phase 9.0"
                dayNumber="Day 1"
                deliverables={day1Deliverables}
                testingView={<Phase9Day1Testing />}
                showTestingToggle={true}
              />
            )}
            {selectedDay === 'day2' && (
              <RoadmapPhaseTab
                phase="Phase 9.0"
                dayNumber="Day 2"
                deliverables={day2Deliverables}
                testingView={<Phase9Day2Testing />}
                showTestingToggle={true}
              />
            )}
            {selectedDay === 'day3' && (
              <RoadmapPhaseTab
                phase="Phase 9.0"
                dayNumber="Day 3"
                deliverables={day3Deliverables}
                testingView={<Phase9Day3Testing />}
                showTestingToggle={true}
              />
            )}
            {selectedDay === 'day4' && (
              <RoadmapPhaseTab
                phase="Phase 9.0"
                dayNumber="Day 4"
                deliverables={day4Deliverables}
                testingView={<Phase9Day4Testing />}
                showTestingToggle={true}
              />
            )}
            {selectedDay === 'day5' && (
              <RoadmapPhaseTab
                phase="Phase 9.0"
                dayNumber="Day 5"
                deliverables={day5Deliverables}
                testingView={<Phase9Day5Testing />}
                showTestingToggle={true}
              />
            )}
            {selectedDay === 'day6' && (
              <RoadmapPhaseTab
                phase="Phase 9.0"
                dayNumber="Day 6"
                deliverables={day6Deliverables}
                testingView={<Phase9Day6Testing />}
                showTestingToggle={true}
              />
            )}
          </div>
        )}
        {activeTab === 'day7' && (
          <RoadmapPhaseTab
            phase="Phase 9.0"
            dayNumber="Day 7"
            deliverables={day7Deliverables}
            testingView={<Phase9Day7Testing />}
            showTestingToggle={true}
          />
        )}
        {activeTab === 'day8' && (
          <RoadmapPhaseTab
            phase="Phase 9.0"
            dayNumber="Day 8"
            deliverables={day8Deliverables}
            showTestingToggle={false}
          />
        )}
        {activeTab === 'day9' && (
          <RoadmapPhaseTab
            phase="Phase 9.0"
            dayNumber="Day 9"
            deliverables={day9Deliverables}
            showTestingToggle={false}
          />
        )}
        {activeTab === 'day10' && (
          <RoadmapPhaseTab
            phase="Phase 9.0"
            dayNumber="Day 10"
            deliverables={day10Deliverables}
            showTestingToggle={false}
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