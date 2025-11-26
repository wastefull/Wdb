import {
  Briefcase,
  Users,
  FileText,
  Database,
  TestTube,
  MapPin,
  LineChart,
  ArrowLeft,
  AlertTriangle,
  FlaskConical,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { PHASE_TABS } from "../roadmap/SimplifiedRoadmap";

interface AdminDashboardProps {
  onBack: () => void;
  onNavigateToReviewCenter?: () => void;
  onNavigateToDataManagement?: () => void;
  onNavigateToUserManagement?: () => void;
  onNavigateToWhitepaperSync?: () => void;
  onNavigateToTransformManager?: () => void;
  onNavigateToAdminTakedownList?: () => void;
  onNavigateToAuditLog?: () => void;
  onNavigateToDataRetention?: () => void;
  onNavigateToWhitepapers?: () => void;
  onNavigateToAssets?: () => void;
  onNavigateToMath?: () => void;
  onNavigateToCharts?: () => void;
  onNavigateToRoadmap?: () => void;
  onNavigateToRoadmapOverview?: (section?: string) => void;
  onNavigateToSourceLibrary?: () => void;
  onNavigateToSourceComparison?: () => void;
  onNavigateToEvidenceLab?: () => void;
  onNavigateToTransformTesting?: () => void;
}

export function AdminDashboard({
  onBack,
  onNavigateToReviewCenter,
  onNavigateToDataManagement,
  onNavigateToUserManagement,
  onNavigateToTransformManager,
  onNavigateToAdminTakedownList,
  onNavigateToAuditLog,
  onNavigateToDataRetention,
  onNavigateToWhitepapers,
  onNavigateToAssets,
  onNavigateToMath,
  onNavigateToCharts,
  onNavigateToRoadmap,
  onNavigateToRoadmapOverview,
  onNavigateToSourceLibrary,
  onNavigateToSourceComparison,
  onNavigateToEvidenceLab,
  onNavigateToTransformTesting,
}: AdminDashboardProps) {
  return (
    <div className="flex h-full">
      {/* Left Accordion Menu */}
      <aside className="w-80 border-r border-[#211f1c]/10 dark:border-white/10 p-6 overflow-y-auto">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-black dark:text-white hover:opacity-70 transition-opacity"
          >
            <ArrowLeft size={16} />
            <span className="font-sniglet text-[14px]">Back</span>
          </button>
        </div>

        <h2 className="font-display text-[24px] text-black dark:text-white mb-6">
          Admin Dashboard
        </h2>

        <Accordion type="multiple" className="w-full">
          {/* Moderation Section */}
          <AccordionItem
            value="moderation"
            className="border-[#211f1c]/10 dark:border-white/10"
          >
            <AccordionTrigger className="font-sniglet text-[14px] text-black dark:text-white hover:no-underline">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} />
                <span>Moderation</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pl-6">
                {onNavigateToReviewCenter && (
                  <button
                    onClick={onNavigateToReviewCenter}
                    className="menu-item"
                  >
                    Review Center
                  </button>
                )}
                {onNavigateToAdminTakedownList && (
                  <button
                    onClick={onNavigateToAdminTakedownList}
                    className="menu-item"
                  >
                    Takedown Requests
                  </button>
                )}
                {onNavigateToAuditLog && (
                  <button
                    onClick={onNavigateToAuditLog}
                    className="menu-item"
                  >
                    Audit Log
                  </button>
                )}
                {onNavigateToDataRetention && (
                  <button
                    onClick={onNavigateToDataRetention}
                    className="menu-item"
                  >
                    Data Retention
                  </button>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Admin Section */}
          {onNavigateToUserManagement && (
            <AccordionItem
              value="admin"
              className="border-[#211f1c]/10 dark:border-white/10"
            >
              <AccordionTrigger className="font-sniglet text-[14px] text-black dark:text-white hover:no-underline">
                <div className="flex items-center gap-2">
                  <Users size={16} />
                  <span>Admin</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pl-6">
                  <button
                    onClick={onNavigateToUserManagement}
                    className="menu-item"
                  >
                    User Management
                  </button>
                  {onNavigateToAssets && (
                    <button
                      onClick={onNavigateToAssets}
                      className="menu-item"
                    >
                      Assets
                    </button>
                  )}
                  <button
                    className="menu-item-disabled"
                    disabled
                  >
                    Pages (Coming Soon)
                  </button>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Database Section */}
          <AccordionItem
            value="database"
            className="border-[#211f1c]/10 dark:border-white/10"
          >
            <AccordionTrigger className="font-sniglet text-[14px] text-black dark:text-white hover:no-underline">
              <div className="flex items-center gap-2">
                <Database size={16} />
                <span>Database</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pl-6">
                {onNavigateToDataManagement && (
                  <button
                    onClick={onNavigateToDataManagement}
                    className="menu-item"
                  >
                    Materials
                  </button>
                )}
                {/* Sources with nested subtabs */}
                {(onNavigateToSourceLibrary ||
                  onNavigateToSourceComparison) && (
                  <div className="space-y-2">
                    <div className="menu-header">
                      Sources
                    </div>
                    {onNavigateToSourceLibrary && (
                      <button
                        onClick={onNavigateToSourceLibrary}
                        className="menu-item-nested"
                      >
                        Library
                      </button>
                    )}
                    {onNavigateToSourceComparison && (
                      <button
                        onClick={onNavigateToSourceComparison}
                        className="menu-item-nested"
                      >
                        Comparison
                      </button>
                    )}
                  </div>
                )}
                {onNavigateToWhitepapers && (
                  <button
                    onClick={onNavigateToWhitepapers}
                    className="menu-item"
                  >
                    Whitepapers
                  </button>
                )}
                {onNavigateToEvidenceLab && (
                  <button
                    onClick={onNavigateToEvidenceLab}
                    className="menu-item"
                  >
                    Evidence Lab
                  </button>
                )}
                {/* Math with nested Transform Version Manager */}
                {(onNavigateToMath || onNavigateToTransformManager) && (
                  <div className="space-y-2">
                    <div className="menu-header">
                      Math
                    </div>
                    {onNavigateToTransformManager && (
                      <button
                        onClick={onNavigateToTransformManager}
                        className="menu-item-nested"
                      >
                        Transform Version Manager
                      </button>
                    )}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Testing Section */}
          <AccordionItem
            value="testing"
            className="border-[#211f1c]/10 dark:border-white/10"
          >
            <AccordionTrigger className="font-sniglet text-[14px] text-black dark:text-white hover:no-underline">
              <div className="flex items-center gap-2">
                <FlaskConical size={16} />
                <span>Testing</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pl-6">
                {onNavigateToTransformTesting && (
                  <button
                    onClick={onNavigateToTransformTesting}
                    className="menu-item"
                  >
                    Transform Formula Testing
                  </button>
                )}
                {onNavigateToCharts && (
                  <div className="space-y-2">
                    <div className="menu-subheader">
                      Performance
                    </div>
                    <button
                      onClick={onNavigateToCharts}
                      className="menu-item-nested"
                    >
                      Charts
                    </button>
                  </div>
                )}
                {(onNavigateToRoadmap || onNavigateToRoadmapOverview) && (
                  <div className="space-y-2">
                    <div className="menu-subheader">
                      Roadmap
                    </div>
                    {onNavigateToRoadmapOverview && (
                      <button
                        onClick={() => onNavigateToRoadmapOverview}
                        className="menu-item-nested"
                      >
                        Overview
                      </button>
                    )}
                    {onNavigateToRoadmapOverview && (
                      <button
                        onClick={() => onNavigateToRoadmapOverview("tests")}
                        className="menu-item-deep"
                      >
                        ↳ Tests
                      </button>
                    )}
                    {onNavigateToRoadmapOverview && (
                      <button
                        onClick={() =>
                          onNavigateToRoadmapOverview(PHASE_TABS[0].id)
                        }
                        className="menu-item-deep"
                      >
                        ↳ Active Phase
                      </button>
                    )}
                    {onNavigateToRoadmap && (
                      <button
                        onClick={onNavigateToRoadmap}
                        className="menu-item-nested"
                      >
                        Phase 9.0
                      </button>
                    )}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 overflow-y-auto"></main>
    </div>
  );
}
