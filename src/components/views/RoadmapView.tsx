import React from "react";
import { ArrowLeft } from "lucide-react";
import { RoadmapPhaseTab } from "../roadmap/RoadmapPhaseTab";

import { PhaseFilteredTests } from "../roadmap/PhaseFilteredTests";

interface RoadmapViewProps {
  onBack: () => void;
}

export function RoadmapView({ onBack }: RoadmapViewProps) {
  // No longer need activeTab state - Phase 9.0 view only shows completed work
  // Backlog has been moved to Admin > Testing > Roadmap > Overview > Backlog tab

  // Day 1 Deliverables
  const day1Deliverables = [
    {
      title: "Transform Governance System",
      description:
        "Implemented versioned transform definitions for all 13 parameters",
      completed: true,
    },
    {
      title: "Backend API Endpoints",
      description:
        "5 new endpoints for transform management and recompute jobs",
      completed: true,
    },
    {
      title: "Transform Version Manager UI",
      description: "Complete management interface accessible from admin panel",
      completed: true,
    },
  ];

  // Day 2 Deliverables
  const day2Deliverables = [
    {
      title: "Transform Definitions File",
      description:
        "Created transforms.json with version 1.0 definitions for all 13 WasteDB parameters (Y, D, C, M, E, B, N, T, H, L, R, U, C_RU)",
      completed: true,
    },
    {
      title: "Backend API Endpoints",
      description:
        "5 new endpoints for transform management and recompute jobs: GET /transforms, GET /transforms/:parameter, POST /transforms/recompute, GET /transforms/recompute/:jobId, GET /transforms/recompute",
      completed: true,
    },
    {
      title: "Transform Version Manager UI",
      description:
        "Complete management interface with transform overview, recompute dialog, and job history tracking",
      completed: true,
    },
    {
      title: "Navigation Integration",
      description:
        "Integrated Transform Manager into admin dashboard with proper navigation and routing",
      completed: true,
    },
    {
      title: "Admin Dashboard Redesign",
      description:
        "Left accordion menu with organized sections for all admin tools",
      completed: true,
    },
    {
      title: "Menu Reorganization",
      description:
        "New Moderation, Admin, Database, and Testing sections with nested navigation",
      completed: true,
    },
    {
      title: "Admin Button Enhancement",
      description:
        "Toggle for admin mode plus navigation to Admin Dashboard, fixed DOM nesting",
      completed: true,
    },
    {
      title: "Session Expiration Handling",
      description:
        "Comprehensive error handling with toast notifications, auto-redirect, periodic validation, and global error boundary",
      completed: true,
    },
  ];

  // Day 3 Deliverables (Planned)
  const day3Deliverables = [
    {
      title: "Notification Backend Endpoints",
      description:
        "Implement server endpoints: getNotifications, markNotificationAsRead, markAllNotificationsAsRead to support the notification bell UI",
      completed: true,
    },
    {
      title: "Notification Bell Integration",
      description:
        "Connect existing NotificationBell UI to new backend endpoints with real-time notification loading and badge counts",
      completed: true,
    },
    {
      title: "MIU Schema Planning",
      description:
        "Design database schema for evidence_points table (MIUs) and parameter_aggregations table for Phase 9.1 readiness",
      completed: true,
    },
    {
      title: "Evidence Lab Wireframes",
      description:
        "Create component structure and navigation flow for split-pane Evidence Lab UI (preparation for Phase 9.2)",
      completed: true,
    },
    {
      title: "Transform Formula Testing",
      description:
        "Validate current v1.0 transform formulas against existing material parameter values to ensure accuracy",
      completed: true,
    },
    {
      title: "Documentation Update",
      description:
        "Update technical documentation with Phase 9.0 architecture, API reference, and admin workflow guides",
      completed: true,
    },
  ];

  // Day 4 Deliverables (Phase 9.1)
  const day4Deliverables = [
    {
      title: "Evidence Backend CRUD Endpoints",
      description:
        "5 backend endpoints for managing evidence points: POST /evidence, GET /evidence/material/:materialId, GET /evidence/:evidenceId, PUT /evidence/:evidenceId, DELETE /evidence/:evidenceId",
      completed: true,
    },
    {
      title: "Evidence Lab Integration",
      description:
        "Connected Evidence Lab UI to backend with real CRUD operations replacing mock data",
      completed: true,
    },
    {
      title: "Transform Validation System",
      description:
        "Real-time validation of evidence values against transform definitions with parameter-aware unit checking",
      completed: true,
    },
    {
      title: "Source Attribution",
      description:
        "Complete source tracking with type selection (whitepaper/article/external/manual) and confidence levels",
      completed: true,
    },
    {
      title: "Admin Evidence Management",
      description:
        "Full admin interface for adding, editing, and deleting evidence with role-based access control",
      completed: true,
    },
  ];

  // Day 5 Deliverables (Source Deduplication)
  const day5Deliverables = [
    {
      title: "DOI Normalization Function",
      description:
        "Create DOI normalization function to handle various DOI formats (https, http, doi:, plain)",
      completed: true,
    },
    {
      title: "Duplicate Check Endpoint",
      description:
        "Create GET /sources/check-duplicate endpoint for detecting duplicate sources by DOI or title",
      completed: true,
    },
    {
      title: "Fuzzy Title Matching",
      description:
        "Implement fuzzy title matching using Levenshtein distance to catch non-DOI duplicates",
      completed: true,
    },
    {
      title: "Duplicate Warning Modal",
      description:
        "Create DuplicateSourceWarning.tsx modal to alert users of potential duplicates",
      completed: true,
    },
    {
      title: "Source Merge Workflow",
      description:
        "Add merge workflow for confirmed duplicates that preserves all MIU references",
      completed: true,
    },
    {
      title: "Deduplication Testing",
      description:
        "Test with known duplicate cases to ensure 100% DOI accuracy and 90%+ fuzzy match accuracy",
      completed: true,
    },
  ];

  // Day 6 Deliverables (Observability & Audit Logging)
  const day6Deliverables = [
    {
      title: "Audit Log Infrastructure",
      description:
        "Created audit log storage in KV store with AuditLogEntry interface for tracking all data changes",
      completed: true,
    },
    {
      title: "Backend Audit Endpoints",
      description:
        "Implemented 4 endpoints: POST /audit/log, GET /audit/logs (with filters), GET /audit/logs/:id, GET /audit/stats",
      completed: true,
    },
    {
      title: "Audit Log Viewer Component",
      description:
        "Created AuditLogViewer.tsx with statistics dashboard, filtering, pagination, detail modal, and export",
      completed: true,
    },
    {
      title: "Search and Filter UI",
      description:
        "Implemented comprehensive filtering by entity type, user, action type, date range, and search",
      completed: true,
    },
    {
      title: "Navigation Integration",
      description:
        "Added audit log viewer to Admin Dashboard with proper routing and admin-only access",
      completed: true,
    },
    {
      title: "Testing Suite",
      description:
        "Created Phase9Day6Testing component with 5 automated tests for all audit endpoints",
      completed: true,
    },
    {
      title: "Email Notifications",
      description:
        "Implemented email notifications for critical audit events (deletions, role changes) via Resend API",
      completed: true,
    },
    {
      title: "CRUD Instrumentation",
      description:
        "Added createAuditLog calls to all CRUD endpoints: materials, users, sources, evidence, whitepapers",
      completed: true,
    },
  ];

  // Day 7 Deliverables (Data Retention & Deletion)
  const day7Deliverables = [
    {
      title: "Data Retention Policy Document",
      description: "Create data retention policy document",
      completed: true,
    },
    {
      title: "Delete Source Endpoint",
      description:
        "Create DELETE /make-server-17cae920/sources/:id endpoint with referential integrity checks",
      completed: true,
    },
    {
      title: "Referential Integrity Checks",
      description: "Implement checks to prevent deletion if MIUs exist",
      completed: true,
    },
    {
      title: "Screenshot Cleanup Endpoint",
      description: "Create screenshot cleanup endpoint (7-year policy)",
      completed: true,
    },
    {
      title: "Retention Statistics Endpoint",
      description:
        "Create GET /admin/retention/stats endpoint for retention tracking",
      completed: true,
    },
    {
      title: "Deletion Testing",
      description: "Test deletion with dependent MIUs - 6 comprehensive tests",
      completed: true,
    },
  ];

  // Day 8 Deliverables (Backup & Recovery)
  const day8Deliverables = [
    {
      title: "Daily Supabase Backups",
      description: "Configure daily Supabase backups (automatic)",
      completed: true,
    },
    {
      title: "Manual Backup Trigger",
      description: "Create manual backup trigger endpoint",
      completed: true,
    },
    {
      title: "Backup Export Endpoint",
      description:
        "Create POST /make-server-17cae920/backup/export (JSON dump)",
      completed: true,
    },
    {
      title: "Backup Import Endpoint",
      description: "Create POST /make-server-17cae920/backup/import (restore)",
      completed: true,
    },
    {
      title: "Recovery Documentation",
      description: "Document recovery procedures",
      completed: true,
    },
    {
      title: "Restore Testing",
      description: "Test restore from backup",
      completed: true,
    },
  ];

  // Day 9 Deliverables (Research Export Enhancements)
  const day9Deliverables = [
    {
      title: "MIU Export Fields",
      description:
        "Add MIU export fields (snippet, locator, transform_version)",
      completed: true,
    },
    {
      title: "Provenance Metadata",
      description: "Add provenance metadata (curator, extraction_date)",
      completed: true,
    },
    {
      title: "Gzip Compression",
      description: "Implement gzip compression for large exports",
      completed: true,
    },
    {
      title: "Export Versioning",
      description: "Add export versioning (v2.0 format)",
      completed: true,
    },
    {
      title: "Export Format Documentation",
      description: "Create export format documentation",
      completed: true,
    },
    {
      title: "Large Export Testing",
      description: "Test with 100+ material export",
      completed: true,
    },
  ];

  // Day 10 Deliverables (Open Access Triage)
  const day10Deliverables = [
    {
      title: "Open Access Field",
      description: "Add is_open_access BOOLEAN field to sources table",
      completed: true,
    },
    {
      title: "OA Check Endpoint",
      description: "Create GET /make-server-17cae920/sources/check-oa endpoint",
      completed: true,
    },
    {
      title: "Unpaywall API Integration",
      description: "Integrate Unpaywall API (DOI → OA status)",
      completed: true,
    },
    {
      title: "OA Filter UI",
      description: "Create OA filter in Source Library UI",
      completed: true,
    },
    {
      title: "OA Badges",
      description: "Display OA badges on source cards",
      completed: true,
    },
    {
      title: "Prioritize OA Setting",
      description: 'Add "Prioritize OA" curator preference',
      completed: true,
    },
  ];

  // Day 11 Deliverables (Critical Infrastructure Gaps)
  const day11Deliverables = [
    {
      title: "Controlled Vocabularies: units.json",
      description:
        "Create /ontologies/units.json with canonical units and conversion rules for all 13 parameters (Y, D, C, M, E, B, N, T, H, L, R, U, C_RU)",
      completed: true,
    },
    {
      title: "Controlled Vocabularies: context.json",
      description:
        "Create /ontologies/context.json with controlled vocabularies for process, stream, region, and scale fields",
      completed: true,
    },
    {
      title: "Ontology API Endpoints",
      description:
        "Implement GET /make-server-17cae920/ontologies/units and GET /make-server-17cae920/ontologies/context endpoints",
      completed: true,
    },
    {
      title: "Server-Side Unit Validation",
      description:
        "Add validation middleware to check units match parameter definitions from ontology before accepting evidence",
      completed: true,
    },
    {
      title: "RLS Policies for Evidence",
      description:
        "Implement Row-Level Security policies: read for all authenticated users, create/update/delete for admins only",
      completed: true,
    },
    {
      title: "RLS Test Suite",
      description:
        "Create automated tests verifying non-admin users cannot modify evidence (expect 403) and admins can (expect 200)",
      completed: true,
    },
    {
      title: "Signed URLs for File Storage",
      description:
        "Implement signed URLs with expiry for PDF and screenshot access (1-hour for PDFs, 24-hour for screenshots)",
      completed: true,
    },
    {
      title: "Policy Snapshot Fields",
      description:
        "Extend parameter_aggregations table with version tracking: transform_version, weight_policy_version, codebook_version, ontology_version, weights_used (JSONB)",
      completed: true,
    },
    {
      title: "Aggregation Snapshot Storage",
      description:
        "Update aggregation computation to store complete version snapshot with miu_ids[] array and weights_used JSON",
      completed: true,
    },
    {
      title: "Aggregation Snapshot Display",
      description:
        "Create AggregationSnapshot.tsx component to display all versions used with links to transforms.json, weight policy, and codebook",
      completed: true,
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="card-interactive">
          <ArrowLeft size={16} className="text-black" />
        </button>
        <div className="flex-1">
          <h2 className="heading-xl">Roadmap: Phase 9.0</h2>
          <p className="label-muted">
            Transform governance, admin dashboard redesign, and infrastructure
            improvements
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="retro-card !bg-white dark:!bg-[#1a1917] p-6">
        <div>
          <h3 className="font-['Sniglet'] text-[14px] text-black dark:text-white mb-6">
            Days 1-11: Complete Infrastructure Implementation
          </h3>
          <RoadmapPhaseTab
            phase="Phase 9.0"
            dayNumber="Day 1"
            deliverables={day1Deliverables}
            testingView={
              <PhaseFilteredTests
                phase="9.0.1"
                title="Phase 9.0 Day 1 Tests"
                description="Transform Governance System"
              />
            }
            showTestingToggle={true}
          />
          <RoadmapPhaseTab
            phase="Phase 9.0"
            dayNumber="Day 2"
            deliverables={day2Deliverables}
            testingView={
              <PhaseFilteredTests
                phase="9.0.2"
                title="Phase 9.0 Day 2 Tests"
                description="Evidence Wizard & Validation"
              />
            }
            showTestingToggle={true}
          />
          <RoadmapPhaseTab
            phase="Phase 9.0"
            dayNumber="Day 3"
            deliverables={day3Deliverables}
            testingView={
              <PhaseFilteredTests
                phase="9.0.3"
                title="Phase 9.0 Day 3 Tests"
                description="Backend Evidence Storage"
              />
            }
            showTestingToggle={true}
          />
          <RoadmapPhaseTab
            phase="Phase 9.0"
            dayNumber="Day 4"
            deliverables={day4Deliverables}
            testingView={
              <PhaseFilteredTests
                phase="9.0.4"
                title="Phase 9.0 Day 4 Tests"
                description="Backend Source Deduplication"
              />
            }
            showTestingToggle={true}
          />
          <RoadmapPhaseTab
            phase="Phase 9.0"
            dayNumber="Day 5"
            deliverables={day5Deliverables}
            testingView={
              <PhaseFilteredTests
                phase="9.0.5"
                title="Phase 9.0 Day 5 Tests"
                description="Evidence Lab Interface"
              />
            }
            showTestingToggle={true}
          />
          <RoadmapPhaseTab
            phase="Phase 9.0"
            dayNumber="Day 6"
            deliverables={day6Deliverables}
            testingView={
              <PhaseFilteredTests
                phase="9.0.6"
                title="Phase 9.0 Day 6 Tests"
                description="Source Library Manager"
              />
            }
            showTestingToggle={true}
          />
          <RoadmapPhaseTab
            phase="Phase 9.0"
            dayNumber="Day 7"
            deliverables={day7Deliverables}
            testingView={
              <PhaseFilteredTests
                phase="9.0.7"
                title="Phase 9.0 Day 7 Tests"
                description="Legal & Compliance Framework"
              />
            }
            showTestingToggle={true}
          />
          <RoadmapPhaseTab
            phase="Phase 9.0"
            dayNumber="Day 8"
            deliverables={day8Deliverables}
            testingView={
              <PhaseFilteredTests
                phase="9.0.8"
                title="Phase 9.0 Day 8 Tests"
                description="Admin Infrastructure"
              />
            }
            showTestingToggle={true}
          />
          <RoadmapPhaseTab
            phase="Phase 9.0"
            dayNumber="Day 9"
            deliverables={day9Deliverables}
            testingView={
              <PhaseFilteredTests
                phase="9.0.9"
                title="Phase 9.0 Day 9 Tests"
                description="Data Retention & Management"
              />
            }
            showTestingToggle={true}
          />
          <RoadmapPhaseTab
            phase="Phase 9.0"
            dayNumber="Day 10"
            deliverables={day10Deliverables}
            testingView={
              <PhaseFilteredTests
                phase="9.0.10"
                title="Phase 9.0 Day 10 Tests"
                description="Open Access Detection Tests"
              />
            }
            showTestingToggle={true}
          />
          <RoadmapPhaseTab
            phase="Phase 9.0"
            dayNumber="Day 11"
            deliverables={day11Deliverables}
            testingView={
              <PhaseFilteredTests
                phase="9.0.11"
                title="Phase 9.0 Day 11 Tests"
                description="Whitepaper Sync & Management"
              />
            }
            showTestingToggle={true}
          />
        </div>
      </div>
    </div>
  );
}
