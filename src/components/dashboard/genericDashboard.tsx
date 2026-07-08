import { useState, useEffect } from "react";
import {
  Users,
  FileText,
  Database,
  TestTube,
  LineChart,
  AlertTriangle,
  FlaskConical,
  BookOpen,
  Microscope,
  Shield,
  Activity,
  TrendingUp,
  Clock,
  CheckCircle,
} from "lucide-react";
import * as api from "../../utils/api";
import { logger as log } from "../../utils/logger";
import { DashboardQuickNumbers } from "./dashboardQuickNumbers";
import { AdminDashboardProps, GenericDashboardProps } from "./data";
import { DashboardMenu } from "./dashboardMenu";

export function GenericDashboard({
  type,
  onBack,
  ...props
}: GenericDashboardProps) {
  const callbacks: Partial<Omit<AdminDashboardProps, "onBack">> = props;

  const {
    onNavigateToReviewCenter,
    onNavigateToDataManagement,
    onNavigateToUserManagement,
    onNavigateToAuditLog,
    onNavigateToWhitepapers,
    onNavigateToCharts,
    onNavigateToRoadmapOverview,
    onNavigateToSourceLibrary,
    onNavigateToContentManagement,
    onNavigateToTransformTesting,
  } = callbacks;

  const dashboardName =
    type === "admin" ? "Admin Dashboard" : "Staff Dashboard";

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
      log.error("Error loading admin stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  return (
    <div className="grid grid-cols-12">
      {/* Left Accordion Menu */}
      <DashboardMenu
        menuType={type}
        onBack={onBack}
        navProps={{ onBack, ...props }}
      />

      <main className="dashboard-content">
        <div>
          <div className="welcome-header">
            <h1>{dashboardName}</h1>
            <p className="text-[14px] text-black/60 dark:text-white/60"></p>
          </div>

          <DashboardQuickNumbers loadingStats={loadingStats} stats={stats} />

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

              {/* Content Management Card */}
              {type === "admin" && onNavigateToContentManagement && (
                <button
                  onClick={onNavigateToContentManagement}
                  className="retro-card p-5 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-waste-science/20 flex items-center justify-center shrink-0">
                      <Microscope size={24} className="text-waste-science" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-sniglet text-[14px] normal mb-1 group-hover:text-waste-recycle transition-colors">
                        Content Management
                      </h3>
                      <p className="text-[12px] text-black/60 dark:text-white/60">
                        Preview, triage, and map graph content
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
                        View development stages, tests, and progress
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
                    <p className="text-sm text-black/60 dark:text-white/60">
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
                    <p className="text-sm text-black/60 dark:text-white/60">
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
                    <p className="text-sm text-black/60 dark:text-white/60">
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
