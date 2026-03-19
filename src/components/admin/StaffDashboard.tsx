import { useState, useEffect } from "react";
import {
  Users,
  FileText,
  Database,
  TestTube,
  LineChart,
  ArrowLeft,
  FlaskConical,
  Package,
  BookOpen,
  Microscope,
  Activity,
  TrendingUp,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import * as api from "../../utils/api";
import { logger as log } from "../../utils/logger";

interface StaffDashboardProps {
  onBack: () => void;
  onNavigateToDataManagement?: () => void;
  onNavigateToSourceLibrary?: () => void;
  onNavigateToEvidenceLab?: () => void;
  onNavigateToCurationWorkbench?: () => void;
  onNavigateToTransformTesting?: () => void;
  onNavigateToCharts?: () => void;
  onNavigateToRoadmapOverview?: () => void;
}

export function StaffDashboard({
  onBack,
  onNavigateToDataManagement,
  onNavigateToSourceLibrary,
  onNavigateToEvidenceLab,
  onNavigateToCurationWorkbench,
  onNavigateToTransformTesting,
  onNavigateToCharts,
  onNavigateToRoadmapOverview,
}: StaffDashboardProps) {
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
      log.error("Error loading staff stats:", error);
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
          Staff Dashboard
        </h2>

        <Accordion type="multiple" className="w-full">
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
                {onNavigateToRoadmapOverview && (
                  <div className="space-y-2">
                    <div className="menu-subheader">Roadmap</div>
                    <button
                      onClick={onNavigateToRoadmapOverview}
                      className="menu-item-nested"
                    >
                      Overview
                    </button>
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
              Staff Dashboard
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
                    {loadingStats ? "..." : (stats?.materials ?? "—")}
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
                    {loadingStats ? "..." : (stats?.articles ?? "—")}
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
                    {loadingStats ? "..." : (stats?.guides ?? "—")}
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
                    {loadingStats ? "..." : (stats?.users ?? "—")}
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
                  onClick={onNavigateToRoadmapOverview}
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
                        View project phases and progress
                      </p>
                    </div>
                  </div>
                </button>
              )}

              {/* Transform Testing Card */}
              {onNavigateToTransformTesting && (
                <button
                  onClick={onNavigateToTransformTesting}
                  className="retro-card p-4 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-waste-science/20 flex items-center justify-center shrink-0">
                      <TestTube size={24} className="text-waste-science" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-sniglet text-[14px] normal mb-1 group-hover:text-waste-recycle transition-colors">
                        Transform Testing
                      </h3>
                      <p className="text-[12px] text-black/60 dark:text-white/60">
                        Test transform formulas and calculations
                      </p>
                    </div>
                  </div>
                </button>
              )}

              {/* Chart Performance Card */}
              {onNavigateToCharts && (
                <button
                  onClick={onNavigateToCharts}
                  className="retro-card p-4 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-waste-reuse/20 flex items-center justify-center shrink-0">
                      <LineChart size={24} className="text-waste-reuse" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-sniglet text-[14px] normal mb-1 group-hover:text-waste-recycle transition-colors">
                        Chart Performance
                      </h3>
                      <p className="text-[12px] text-black/60 dark:text-white/60">
                        Monitor chart rendering performance
                      </p>
                    </div>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
