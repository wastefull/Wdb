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
} from "./ui/accordion";
import { PHASE_TABS } from "./SimplifiedRoadmap";

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
            <span className="font-['Sniglet'] text-[14px]">Back</span>
          </button>
        </div>

        <h2 className="font-['Fredoka_One'] text-[24px] text-black dark:text-white mb-6">
          Admin Dashboard
        </h2>

        <Accordion type="multiple" className="w-full">
          {/* Moderation Section */}
          <AccordionItem
            value="moderation"
            className="border-[#211f1c]/10 dark:border-white/10"
          >
            <AccordionTrigger className="font-['Sniglet'] text-[14px] text-black dark:text-white hover:no-underline">
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
                    className="w-full text-left font-['Sniglet'] text-[12px] text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors py-2 px-3 rounded-md hover:bg-[#ffb3ba]/20"
                  >
                    Review Center
                  </button>
                )}
                {onNavigateToAdminTakedownList && (
                  <button
                    onClick={onNavigateToAdminTakedownList}
                    className="w-full text-left font-['Sniglet'] text-[12px] text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors py-2 px-3 rounded-md hover:bg-[#ffb3ba]/20"
                  >
                    Takedown Requests
                  </button>
                )}
                {onNavigateToAuditLog && (
                  <button
                    onClick={onNavigateToAuditLog}
                    className="w-full text-left font-['Sniglet'] text-[12px] text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors py-2 px-3 rounded-md hover:bg-[#ffb3ba]/20"
                  >
                    Audit Log
                  </button>
                )}
                {onNavigateToDataRetention && (
                  <button
                    onClick={onNavigateToDataRetention}
                    className="w-full text-left font-['Sniglet'] text-[12px] text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors py-2 px-3 rounded-md hover:bg-[#ffb3ba]/20"
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
              <AccordionTrigger className="font-['Sniglet'] text-[14px] text-black dark:text-white hover:no-underline">
                <div className="flex items-center gap-2">
                  <Users size={16} />
                  <span>Admin</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pl-6">
                  <button
                    onClick={onNavigateToUserManagement}
                    className="w-full text-left font-['Sniglet'] text-[12px] text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors py-2 px-3 rounded-md hover:bg-[#e6beb5]/20"
                  >
                    User Management
                  </button>
                  {onNavigateToAssets && (
                    <button
                      onClick={onNavigateToAssets}
                      className="w-full text-left font-['Sniglet'] text-[12px] text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors py-2 px-3 rounded-md hover:bg-[#e6beb5]/20"
                    >
                      Assets
                    </button>
                  )}
                  <button
                    className="w-full text-left font-['Sniglet'] text-[12px] text-black/40 dark:text-white/40 py-2 px-3 rounded-md cursor-not-allowed"
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
            <AccordionTrigger className="font-['Sniglet'] text-[14px] text-black dark:text-white hover:no-underline">
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
                    className="w-full text-left font-['Sniglet'] text-[12px] text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors py-2 px-3 rounded-md hover:bg-[#e4e3ac]/20"
                  >
                    Materials
                  </button>
                )}
                {/* Sources with nested subtabs */}
                {(onNavigateToSourceLibrary ||
                  onNavigateToSourceComparison) && (
                  <div className="space-y-2">
                    <div className="font-['Sniglet'] text-[12px] text-black dark:text-white px-3 py-2">
                      Sources
                    </div>
                    {onNavigateToSourceLibrary && (
                      <button
                        onClick={onNavigateToSourceLibrary}
                        className="w-full text-left font-['Sniglet'] text-[11px] text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors py-2 px-3 pl-6 rounded-md hover:bg-[#e4e3ac]/20"
                      >
                        Library
                      </button>
                    )}
                    {onNavigateToSourceComparison && (
                      <button
                        onClick={onNavigateToSourceComparison}
                        className="w-full text-left font-['Sniglet'] text-[11px] text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors py-2 px-3 pl-6 rounded-md hover:bg-[#e4e3ac]/20"
                      >
                        Comparison
                      </button>
                    )}
                  </div>
                )}
                {onNavigateToWhitepapers && (
                  <button
                    onClick={onNavigateToWhitepapers}
                    className="w-full text-left font-['Sniglet'] text-[12px] text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors py-2 px-3 rounded-md hover:bg-[#e4e3ac]/20"
                  >
                    Whitepapers
                  </button>
                )}
                {onNavigateToEvidenceLab && (
                  <button
                    onClick={onNavigateToEvidenceLab}
                    className="w-full text-left font-['Sniglet'] text-[12px] text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors py-2 px-3 rounded-md hover:bg-[#e4e3ac]/20"
                  >
                    Evidence Lab
                  </button>
                )}
                {/* Math with nested Transform Version Manager */}
                {(onNavigateToMath || onNavigateToTransformManager) && (
                  <div className="space-y-2">
                    <div className="font-['Sniglet'] text-[12px] text-black dark:text-white px-3 py-2">
                      Math
                    </div>
                    {onNavigateToTransformManager && (
                      <button
                        onClick={onNavigateToTransformManager}
                        className="w-full text-left font-['Sniglet'] text-[11px] text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors py-2 px-3 pl-6 rounded-md hover:bg-[#c7ceea]/20"
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
            <AccordionTrigger className="font-['Sniglet'] text-[14px] text-black dark:text-white hover:no-underline">
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
                    className="w-full text-left font-['Sniglet'] text-[12px] text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors py-2 px-3 rounded-md hover:bg-[#bae1ff]/20"
                  >
                    Transform Formula Testing
                  </button>
                )}
                {onNavigateToCharts && (
                  <div className="space-y-2">
                    <div className="font-['Sniglet'] text-[11px] text-black/50 dark:text-white/50 px-3 py-1">
                      Performance
                    </div>
                    <button
                      onClick={onNavigateToCharts}
                      className="w-full text-left font-['Sniglet'] text-[12px] text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors py-2 px-3 pl-6 rounded-md hover:bg-[#bae1ff]/20"
                    >
                      Charts
                    </button>
                  </div>
                )}
                {(onNavigateToRoadmap || onNavigateToRoadmapOverview) && (
                  <div className="space-y-2">
                    <div className="font-['Sniglet'] text-[11px] text-black/50 dark:text-white/50 px-3 py-1">
                      Roadmap
                    </div>
                    {onNavigateToRoadmapOverview && (
                      <button
                        onClick={() => onNavigateToRoadmapOverview}
                        className="w-full text-left font-['Sniglet'] text-[12px] text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors py-2 px-3 pl-6 rounded-md hover:bg-[#bae1ff]/20"
                      >
                        Overview
                      </button>
                    )}
                    {onNavigateToRoadmapOverview && (
                      <button
                        onClick={() => onNavigateToRoadmapOverview("tests")}
                        className="w-full text-left font-['Sniglet'] text-[12px] text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors py-2 px-3 pl-8 rounded-md hover:bg-[#bae1ff]/20"
                      >
                        ↳ Tests
                      </button>
                    )}
                    {onNavigateToRoadmapOverview && (
                      <button
                        onClick={() =>
                          onNavigateToRoadmapOverview(PHASE_TABS[0].id)
                        }
                        className="w-full text-left font-['Sniglet'] text-[12px] text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors py-2 px-3 pl-8 rounded-md hover:bg-[#bae1ff]/20"
                      >
                        ↳ Active Phase
                      </button>
                    )}
                    {onNavigateToRoadmap && (
                      <button
                        onClick={onNavigateToRoadmap}
                        className="w-full text-left font-['Sniglet'] text-[12px] text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors py-2 px-3 pl-6 rounded-md hover:bg-[#bae1ff]/20"
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
