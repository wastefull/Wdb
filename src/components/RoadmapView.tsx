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
import { Phase9Day8Testing } from './Phase9Day8Testing';
import { Phase9Day9Testing } from './Phase9Day9Testing';
import { Phase9Day10Testing } from './Phase9Day10Testing';
import { Phase9Day11Testing } from './Phase9Day11Testing';

interface RoadmapViewProps {
  onBack: () => void;
}

export function RoadmapView({ onBack }: RoadmapViewProps) {
  const [activeTab, setActiveTab] = useState('completed');

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
      completed: true,
    },
    {
      title: 'Delete Source Endpoint',
      description: 'Create DELETE /make-server-17cae920/sources/:id endpoint with referential integrity checks',
      completed: true,
    },
    {
      title: 'Referential Integrity Checks',
      description: 'Implement checks to prevent deletion if MIUs exist',
      completed: true,
    },
    {
      title: 'Screenshot Cleanup Endpoint',
      description: 'Create screenshot cleanup endpoint (7-year policy)',
      completed: true,
    },
    {
      title: 'Retention Statistics Endpoint',
      description: 'Create GET /admin/retention/stats endpoint for retention tracking',
      completed: true,
    },
    {
      title: 'Deletion Testing',
      description: 'Test deletion with dependent MIUs - 6 comprehensive tests',
      completed: true,
    },
  ];

  // Day 8 Deliverables (Backup & Recovery)
  const day8Deliverables = [
    {
      title: 'Daily Supabase Backups',
      description: 'Configure daily Supabase backups (automatic)',
      completed: true,
    },
    {
      title: 'Manual Backup Trigger',
      description: 'Create manual backup trigger endpoint',
      completed: true,
    },
    {
      title: 'Backup Export Endpoint',
      description: 'Create POST /make-server-17cae920/backup/export (JSON dump)',
      completed: true,
    },
    {
      title: 'Backup Import Endpoint',
      description: 'Create POST /make-server-17cae920/backup/import (restore)',
      completed: true,
    },
    {
      title: 'Recovery Documentation',
      description: 'Document recovery procedures',
      completed: true,
    },
    {
      title: 'Restore Testing',
      description: 'Test restore from backup',
      completed: true,
    },
  ];

  // Day 9 Deliverables (Research Export Enhancements)
  const day9Deliverables = [
    {
      title: 'MIU Export Fields',
      description: 'Add MIU export fields (snippet, locator, transform_version)',
      completed: true,
    },
    {
      title: 'Provenance Metadata',
      description: 'Add provenance metadata (curator, extraction_date)',
      completed: true,
    },
    {
      title: 'Gzip Compression',
      description: 'Implement gzip compression for large exports',
      completed: true,
    },
    {
      title: 'Export Versioning',
      description: 'Add export versioning (v2.0 format)',
      completed: true,
    },
    {
      title: 'Export Format Documentation',
      description: 'Create export format documentation',
      completed: true,
    },
    {
      title: 'Large Export Testing',
      description: 'Test with 100+ material export',
      completed: true,
    },
  ];

  // Day 10 Deliverables (Open Access Triage)
  const day10Deliverables = [
    {
      title: 'Open Access Field',
      description: 'Add is_open_access BOOLEAN field to sources table',
      completed: true,
    },
    {
      title: 'OA Check Endpoint',
      description: 'Create GET /make-server-17cae920/sources/check-oa endpoint',
      completed: true,
    },
    {
      title: 'Unpaywall API Integration',
      description: 'Integrate Unpaywall API (DOI → OA status)',
      completed: true,
    },
    {
      title: 'OA Filter UI',
      description: 'Create OA filter in Source Library UI',
      completed: true,
    },
    {
      title: 'OA Badges',
      description: 'Display OA badges on source cards',
      completed: true,
    },
    {
      title: 'Prioritize OA Setting',
      description: 'Add "Prioritize OA" curator preference',
      completed: true,
    },
  ];

  // Day 11 Deliverables (Critical Infrastructure Gaps)
  const day11Deliverables = [
    {
      title: 'Controlled Vocabularies: units.json',
      description: 'Create /ontologies/units.json with canonical units and conversion rules for all 13 parameters (Y, D, C, M, E, B, N, T, H, L, R, U, C_RU)',
      completed: true,
    },
    {
      title: 'Controlled Vocabularies: context.json',
      description: 'Create /ontologies/context.json with controlled vocabularies for process, stream, region, and scale fields',
      completed: true,
    },
    {
      title: 'Ontology API Endpoints',
      description: 'Implement GET /make-server-17cae920/ontologies/units and GET /make-server-17cae920/ontologies/context endpoints',
      completed: true,
    },
    {
      title: 'Server-Side Unit Validation',
      description: 'Add validation middleware to check units match parameter definitions from ontology before accepting evidence',
      completed: true,
    },
    {
      title: 'RLS Policies for Evidence',
      description: 'Implement Row-Level Security policies: read for all authenticated users, create/update/delete for admins only',
      completed: true,
    },
    {
      title: 'RLS Test Suite',
      description: 'Create automated tests verifying non-admin users cannot modify evidence (expect 403) and admins can (expect 200)',
      completed: true,
    },
    {
      title: 'Signed URLs for File Storage',
      description: 'Implement signed URLs with expiry for PDF and screenshot access (1-hour for PDFs, 24-hour for screenshots)',
      completed: false,
    },
    {
      title: 'Policy Snapshot Fields',
      description: 'Extend parameter_aggregations table with version tracking: transform_version, weight_policy_version, codebook_version, ontology_version, weights_used (JSONB)',
      completed: false,
    },
    {
      title: 'Aggregation Snapshot Storage',
      description: 'Update aggregation computation to store complete version snapshot with miu_ids[] array and weights_used JSON',
      completed: false,
    },
    {
      title: 'Aggregation Snapshot Display',
      description: 'Create AggregationSnapshot.tsx component to display all versions used with links to transforms.json, weight policy, and codebook',
      completed: false,
    },
  ];

  // Backlog (Future Enhancements)
  const backlogItems = [
    {
      title: 'Automated Cron Backups',
      description: 'Implement Deno cron scheduled nightly backups at 2 AM UTC with retention policy (7 daily, 4 weekly, 12 monthly) and failure alerts',
      completed: false,
    },
    {
      title: 'Observability Dashboard',
      description: 'Comprehensive monitoring dashboard with metrics (error rate, latency percentiles, failed jobs), alert rules (CI width >0.3, stale aggregations), and structured logging with Winston',
      completed: false,
    },
    {
      title: 'KV-Backed Pages Manager',
      description: 'Explore KV-backed JSON storage pattern (similar to ontologies) for Pages Manager - store page content in KV store with versioning, serve via API endpoints, maintain JSON files as source of truth for version control',
      completed: false,
    },
    {
      title: 'Curation Queue & Claim Workflow',
      description: 'Priority queue showing materials with <3 MIUs per parameter, with OA filter, claim workflow to prevent duplicate work, and time estimates',
      completed: false,
    },
    {
      title: 'Evidence Heatmap (Coverage Matrix)',
      description: 'Visual matrix showing evidence coverage gaps: rows = materials, columns = parameters, color-coded by MIU count (green ≥3, yellow 1-2, red 0)',
      completed: false,
    },
    {
      title: 'Release Management System',
      description: 'ReleaseManager UI for creating versioned releases with SHA-256 checksumming, changelog generation, and immutable release artifacts',
      completed: false,
    },
    {
      title: 'MIU Deduplication',
      description: 'Duplicate detection for evidence points (MIUs) based on source + locator + parameter + value, with near-match detection (ε=0.05)',
      completed: false,
    },
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
            Completed (Days 1-10)
          </button>
          <button
            onClick={() => setActiveTab('day11')}
            className={`px-4 py-2 font-['Sniglet'] text-[12px] transition-colors ${
              activeTab === 'day11'
                ? 'text-black dark:text-white border-b-2 border-[#211f1c] dark:border-white'
                : 'text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white'
            }`}
          >
            Day 11 (In Progress)
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
            <h3 className="font-['Sniglet'] text-[14px] text-black dark:text-white mb-6">
              Days 1-10: Complete Infrastructure Implementation
            </h3>
            <RoadmapPhaseTab
              phase="Phase 9.0"
              dayNumber="Day 1"
              deliverables={day1Deliverables}
              testingView={<Phase9Day1Testing />}
              showTestingToggle={true}
            />
            <RoadmapPhaseTab
              phase="Phase 9.0"
              dayNumber="Day 2"
              deliverables={day2Deliverables}
              testingView={<Phase9Day2Testing />}
              showTestingToggle={true}
            />
            <RoadmapPhaseTab
              phase="Phase 9.0"
              dayNumber="Day 3"
              deliverables={day3Deliverables}
              testingView={<Phase9Day3Testing />}
              showTestingToggle={true}
            />
            <RoadmapPhaseTab
              phase="Phase 9.0"
              dayNumber="Day 4"
              deliverables={day4Deliverables}
              testingView={<Phase9Day4Testing />}
              showTestingToggle={true}
            />
            <RoadmapPhaseTab
              phase="Phase 9.0"
              dayNumber="Day 5"
              deliverables={day5Deliverables}
              testingView={<Phase9Day5Testing />}
              showTestingToggle={true}
            />
            <RoadmapPhaseTab
              phase="Phase 9.0"
              dayNumber="Day 6"
              deliverables={day6Deliverables}
              testingView={<Phase9Day6Testing />}
              showTestingToggle={true}
            />
            <RoadmapPhaseTab
              phase="Phase 9.0"
              dayNumber="Day 7"
              deliverables={day7Deliverables}
              testingView={<Phase9Day7Testing />}
              showTestingToggle={true}
            />
            <RoadmapPhaseTab
              phase="Phase 9.0"
              dayNumber="Day 8"
              deliverables={day8Deliverables}
              testingView={<Phase9Day8Testing />}
              showTestingToggle={true}
            />
            <RoadmapPhaseTab
              phase="Phase 9.0"
              dayNumber="Day 9"
              deliverables={day9Deliverables}
              testingView={<Phase9Day9Testing />}
              showTestingToggle={true}
            />
            <RoadmapPhaseTab
              phase="Phase 9.0"
              dayNumber="Day 10"
              deliverables={day10Deliverables}
              testingView={<Phase9Day10Testing />}
              showTestingToggle={true}
            />
          </div>
        )}
        {activeTab === 'day11' && (
          <div>
            <h3 className="font-['Sniglet'] text-[14px] text-black dark:text-white mb-6">
              Day 11: Critical Infrastructure Gaps
            </h3>
            <RoadmapPhaseTab
              phase="Phase 9.0"
              dayNumber="Day 11"
              deliverables={day11Deliverables}
              testingView={<Phase9Day11Testing />}
              showTestingToggle={true}
            />
          </div>
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