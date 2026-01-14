import { useState, useEffect } from "react";
import {
  Users,
  FileText,
  Database,
  TestTube,
  LineChart,
  ArrowLeft,
  AlertTriangle,
  FlaskConical,
  Package,
  BookOpen,
  Microscope,
  Shield,
  Activity,
  TrendingUp,
  Clock,
  CheckCircle,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { PHASE_TABS } from "../roadmap/SimplifiedRoadmap";
import * as api from "../../utils/api";

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
  onNavigateToCurationWorkbench?: () => void;
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
  onNavigateToCurationWorkbench,
  onNavigateToTransformTesting,
}: AdminDashboardProps) {
  const [stats, setStats] = useState<{
    materials: number;
    articles: number;
    guides: number;
    mius: number;
    users: number;
  } | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const data = await api.getAdminStats();
      setStats(data);
    } catch (error) {
      console.error("Error loading admin stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* Left Accordion Menu */}
      <aside className="w-80 border-r border-[#211f1c]/10 dark:border-white/10 p-6 overflow-y-auto">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 normal hover:opacity-70 transition-opacity"
          >
            <ArrowLeft size={16} />
            <span className="font-sniglet text-[14px]">Back</span>
          </button>
        </div>

        <h2 className="font-display text-[24px] normal mb-6">
          Admin Dashboard
        </h2>

        <Accordion type="multiple" className="w-full">
          {/* Moderation Section */}
          <AccordionItem
            value="moderation"
            className="border-[#211f1c]/10 dark:border-white/10"
          >
            <AccordionTrigger className="font-sniglet text-[14px] normal hover:no-underline">
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
                  <button onClick={onNavigateToAuditLog} className="menu-item">
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
              <AccordionTrigger className="font-sniglet text-[14px] normal hover:no-underline">
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
                    <button onClick={onNavigateToAssets} className="menu-item">
                      Assets
                    </button>
                  )}
                  <button className="menu-item-disabled" disabled>
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
            <AccordionTrigger className="font-sniglet text-[14px] normal hover:no-underline">
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
                    <div className="menu-header">Sources</div>
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
                {onNavigateToCurationWorkbench && (
                  <button
                    onClick={onNavigateToCurationWorkbench}
                    className="menu-item"
                  >
                    Curation Workbench
                  </button>
                )}
                {/* Math with nested Transform Version Manager */}
                {(onNavigateToMath || onNavigateToTransformManager) && (
                  <div className="space-y-2">
                    <div className="menu-header">Math</div>
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
            <AccordionTrigger className="font-sniglet text-[14px] normal hover:no-underline">
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
                    <div className="menu-subheader">Performance</div>
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
                    <div className="menu-subheader">Roadmap</div>
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
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </aside>

      {/* Main Content Area - Dashboard */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="font-display text-[28px] normal mb-2">
              Admin Dashboard
            </h1>
            <p className="text-[14px] text-black/60 dark:text-white/60"></p>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="retro-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-waste-recycle/20 flex items-center justify-center">
                  <Package size={20} className="text-waste-recycle" />
                </div>
                <div>
                  <p className="text-[11px] text-black/60 dark:text-white/60 uppercase tracking-wide">
                    Materials
                  </p>
                  <p className="text-xl font-bold arcade-numbers">
                    {loadingStats ? "..." : stats?.materials ?? "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="retro-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-waste-reuse/20 flex items-center justify-center">
                  <FileText size={20} className="text-waste-reuse" />
                </div>
                <div>
                  <p className="text-[11px] text-black/60 dark:text-white/60 uppercase tracking-wide">
                    Articles
                  </p>
                  <p className="text-xl font-bold arcade-numbers">
                    {loadingStats ? "..." : stats?.articles ?? "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="retro-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-waste-compost/20 flex items-center justify-center">
                  <BookOpen size={20} className="text-waste-compost" />
                </div>
                <div>
                  <p className="text-[11px] text-black/60 dark:text-white/60 uppercase tracking-wide">
                    Guides
                  </p>
                  <p className="text-xl font-bold arcade-numbers">
                    {loadingStats ? "..." : stats?.guides ?? "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="retro-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-waste-science/20 flex items-center justify-center">
                  <Users size={20} className="text-waste-science" />
                </div>
                <div>
                  <p className="text-[11px] text-black/60 dark:text-white/60 uppercase tracking-wide">
                    Users
                  </p>
                  <p className="text-xl font-bold arcade-numbers">
                    {loadingStats ? "..." : stats?.users ?? "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div>
            <h2 className="font-sniglet text-[16px] normal mb-4 flex items-center gap-2">
              <Activity size={18} />
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Moderation Card */}
              {onNavigateToReviewCenter && (
                <button
                  onClick={onNavigateToReviewCenter}
                  className="retro-card p-5 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                      <AlertTriangle
                        size={24}
                        className="text-amber-600 dark:text-amber-400"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-sniglet text-[14px] normal mb-1 group-hover:text-waste-recycle transition-colors">
                        Review Center
                      </h3>
                      <p className="text-[12px] text-black/60 dark:text-white/60">
                        Review pending submissions and moderate content
                      </p>
                    </div>
                  </div>
                </button>
              )}

              {/* User Management Card */}
              {onNavigateToUserManagement && (
                <button
                  onClick={onNavigateToUserManagement}
                  className="retro-card p-5 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                      <Users
                        size={24}
                        className="text-blue-600 dark:text-blue-400"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-sniglet text-[14px] normal mb-1 group-hover:text-waste-recycle transition-colors">
                        User Management
                      </h3>
                      <p className="text-[12px] text-black/60 dark:text-white/60">
                        Manage user roles, permissions, and profiles
                      </p>
                    </div>
                  </div>
                </button>
              )}

              {/* Data Management Card */}
              {onNavigateToDataManagement && (
                <button
                  onClick={onNavigateToDataManagement}
                  className="retro-card p-5 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
                      <Database
                        size={24}
                        className="text-green-600 dark:text-green-400"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-sniglet text-[14px] normal mb-1 group-hover:text-waste-recycle transition-colors">
                        Materials Database
                      </h3>
                      <p className="text-[12px] text-black/60 dark:text-white/60">
                        Browse and manage material entries
                      </p>
                    </div>
                  </div>
                </button>
              )}

              {/* Source Library Card */}
              {onNavigateToSourceLibrary && (
                <button
                  onClick={onNavigateToSourceLibrary}
                  className="retro-card p-5 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                      <BookOpen
                        size={24}
                        className="text-purple-600 dark:text-purple-400"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-sniglet text-[14px] normal mb-1 group-hover:text-waste-recycle transition-colors">
                        Source Library
                      </h3>
                      <p className="text-[12px] text-black/60 dark:text-white/60">
                        Manage scientific sources and citations
                      </p>
                    </div>
                  </div>
                </button>
              )}

              {/* Evidence Lab Card */}
              {onNavigateToEvidenceLab && (
                <button
                  onClick={onNavigateToEvidenceLab}
                  className="retro-card p-5 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-waste-science/20 flex items-center justify-center shrink-0">
                      <Microscope size={24} className="text-waste-science" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-sniglet text-[14px] normal mb-1 group-hover:text-waste-recycle transition-colors">
                        Evidence Lab
                      </h3>
                      <p className="text-[12px] text-black/60 dark:text-white/60">
                        Extract and manage MIU evidence points
                      </p>
                    </div>
                  </div>
                </button>
              )}

              {/* Roadmap Card */}
              {onNavigateToRoadmapOverview && (
                <button
                  onClick={() => onNavigateToRoadmapOverview()}
                  className="retro-card p-5 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center shrink-0">
                      <TrendingUp
                        size={24}
                        className="text-cyan-600 dark:text-cyan-400"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-sniglet text-[14px] normal mb-1 group-hover:text-waste-recycle transition-colors">
                        Roadmap
                      </h3>
                      <p className="text-[12px] text-black/60 dark:text-white/60">
                        View project phases, tests, and progress
                      </p>
                    </div>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* System Status Section */}
          <div>
            <h2 className="font-sniglet text-[16px] normal mb-4 flex items-center gap-2">
              <Shield size={18} />
              System Status
            </h2>
            <div className="retro-card p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <CheckCircle size={20} className="text-green-500 shrink-0" />
                  <div>
                    <p className="text-[13px] font-medium normal">Database</p>
                    <p className="text-[11px] text-black/60 dark:text-white/60">
                      Supabase KV operational
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <CheckCircle size={20} className="text-green-500 shrink-0" />
                  <div>
                    <p className="text-[13px] font-medium normal">
                      Edge Functions
                    </p>
                    <p className="text-[11px] text-black/60 dark:text-white/60">
                      API responding normally
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <CheckCircle size={20} className="text-green-500 shrink-0" />
                  <div>
                    <p className="text-[13px] font-medium normal">
                      Authentication
                    </p>
                    <p className="text-[11px] text-black/60 dark:text-white/60">
                      Supabase Auth active
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Tools Grid */}
          <div>
            <h2 className="font-sniglet text-[16px] normal mb-4 flex items-center gap-2">
              <FlaskConical size={18} />
              Developer Tools
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {onNavigateToTransformTesting && (
                <button
                  onClick={onNavigateToTransformTesting}
                  className="retro-card p-4 text-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <TestTube
                    size={20}
                    className="mx-auto mb-2 text-waste-science"
                  />
                  <p className="text-[12px] normal">Transform Testing</p>
                </button>
              )}

              {onNavigateToCharts && (
                <button
                  onClick={onNavigateToCharts}
                  className="retro-card p-4 text-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <LineChart
                    size={20}
                    className="mx-auto mb-2 text-waste-reuse"
                  />
                  <p className="text-[12px] normal">Chart Performance</p>
                </button>
              )}

              {onNavigateToAuditLog && (
                <button
                  onClick={onNavigateToAuditLog}
                  className="retro-card p-4 text-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <Clock
                    size={20}
                    className="mx-auto mb-2 text-waste-compost"
                  />
                  <p className="text-[12px] normal">Audit Log</p>
                </button>
              )}

              {onNavigateToWhitepapers && (
                <button
                  onClick={onNavigateToWhitepapers}
                  className="retro-card p-4 text-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <FileText
                    size={20}
                    className="mx-auto mb-2 text-waste-recycle"
                  />
                  <p className="text-[12px] normal">Whitepapers</p>
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
