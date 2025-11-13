import { ArrowLeft, FileText, Database, Users, FileSync, Settings, FlaskConical, AlertTriangle, FileBarChart, Map } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';

interface AdminDashboardProps {
  onBack: () => void;
  onNavigateToReviewCenter?: () => void;
  onNavigateToDataManagement?: () => void;
  onNavigateToUserManagement?: () => void;
  onNavigateToWhitepaperSync?: () => void;
  onNavigateToTransformManager?: () => void;
  onNavigateToPhase9Testing?: () => void;
  onNavigateToAdminTakedownList?: () => void;
  onNavigateToWhitepapers?: () => void;
  onNavigateToAssets?: () => void;
  onNavigateToMath?: () => void;
  onNavigateToCharts?: () => void;
  onNavigateToRoadmap?: () => void;
  onNavigateToSourceLibrary?: () => void;
  onNavigateToSourceComparison?: () => void;
}

export function AdminDashboard({
  onBack,
  onNavigateToReviewCenter,
  onNavigateToDataManagement,
  onNavigateToUserManagement,
  onNavigateToWhitepaperSync,
  onNavigateToTransformManager,
  onNavigateToPhase9Testing,
  onNavigateToAdminTakedownList,
  onNavigateToWhitepapers,
  onNavigateToAssets,
  onNavigateToMath,
  onNavigateToCharts,
  onNavigateToRoadmap,
  onNavigateToSourceLibrary,
  onNavigateToSourceComparison,
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
            <span className="font-['Sniglet:Regular',_sans-serif] text-[14px]">Back</span>
          </button>
        </div>

        <h2 className="font-['Fredoka_One:Regular',_sans-serif] text-[24px] text-black dark:text-white mb-6">
          Admin Dashboard
        </h2>

        <Accordion type="multiple" className="w-full">
          {/* Moderation Section */}
          <AccordionItem value="moderation" className="border-[#211f1c]/10 dark:border-white/10">
            <AccordionTrigger className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black dark:text-white hover:no-underline">
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
                    className="w-full text-left font-['Sniglet:Regular',_sans-serif] text-[12px] text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors py-2 px-3 rounded-md hover:bg-[#ffb3ba]/20"
                  >
                    Review Center
                  </button>
                )}
                {onNavigateToAdminTakedownList && (
                  <button
                    onClick={onNavigateToAdminTakedownList}
                    className="w-full text-left font-['Sniglet:Regular',_sans-serif] text-[12px] text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors py-2 px-3 rounded-md hover:bg-[#ffb3ba]/20"
                  >
                    🚨 Takedown Requests
                  </button>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Admin Section */}
          {onNavigateToUserManagement && (
            <AccordionItem value="admin" className="border-[#211f1c]/10 dark:border-white/10">
              <AccordionTrigger className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black dark:text-white hover:no-underline">
                <div className="flex items-center gap-2">
                  <Users size={16} />
                  <span>Admin</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pl-6">
                  <button
                    onClick={onNavigateToUserManagement}
                    className="w-full text-left font-['Sniglet:Regular',_sans-serif] text-[12px] text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors py-2 px-3 rounded-md hover:bg-[#e6beb5]/20"
                  >
                    User Management
                  </button>
                  <button
                    className="w-full text-left font-['Sniglet:Regular',_sans-serif] text-[12px] text-black/40 dark:text-white/40 py-2 px-3 rounded-md cursor-not-allowed"
                    disabled
                  >
                    Pages (Coming Soon)
                  </button>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Database Section */}
          <AccordionItem value="database" className="border-[#211f1c]/10 dark:border-white/10">
            <AccordionTrigger className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black dark:text-white hover:no-underline">
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
                    className="w-full text-left font-['Sniglet:Regular',_sans-serif] text-[12px] text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors py-2 px-3 rounded-md hover:bg-[#e4e3ac]/20"
                  >
                    Materials
                  </button>
                )}
                {/* Sources with nested subtabs */}
                {(onNavigateToSourceLibrary || onNavigateToSourceComparison) && (
                  <div className="space-y-2">
                    <div className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black dark:text-white px-3 py-2">
                      Sources
                    </div>
                    {onNavigateToSourceLibrary && (
                      <button
                        onClick={onNavigateToSourceLibrary}
                        className="w-full text-left font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors py-2 px-3 pl-6 rounded-md hover:bg-[#e4e3ac]/20"
                      >
                        Library
                      </button>
                    )}
                    {onNavigateToSourceComparison && (
                      <button
                        onClick={onNavigateToSourceComparison}
                        className="w-full text-left font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors py-2 px-3 pl-6 rounded-md hover:bg-[#e4e3ac]/20"
                      >
                        Comparison
                      </button>
                    )}
                  </div>
                )}
                {onNavigateToWhitepapers && (
                  <button
                    onClick={onNavigateToWhitepapers}
                    className="w-full text-left font-['Sniglet:Regular',_sans-serif] text-[12px] text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors py-2 px-3 rounded-md hover:bg-[#e4e3ac]/20"
                  >
                    Whitepapers
                  </button>
                )}
                {onNavigateToAssets && (
                  <button
                    onClick={onNavigateToAssets}
                    className="w-full text-left font-['Sniglet:Regular',_sans-serif] text-[12px] text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors py-2 px-3 rounded-md hover:bg-[#e4e3ac]/20"
                  >
                    Assets
                  </button>
                )}
                {/* Math with nested Transform Version Manager */}
                {(onNavigateToMath || onNavigateToTransformManager) && (
                  <div className="space-y-2">
                    <div className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black dark:text-white px-3 py-2">
                      Math
                    </div>
                    {onNavigateToTransformManager && (
                      <button
                        onClick={onNavigateToTransformManager}
                        className="w-full text-left font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors py-2 px-3 pl-6 rounded-md hover:bg-[#c7ceea]/20"
                      >
                        ⚙️ Transform Version Manager
                      </button>
                    )}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Testing Section */}
          <AccordionItem value="testing" className="border-[#211f1c]/10 dark:border-white/10">
            <AccordionTrigger className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black dark:text-white hover:no-underline">
              <div className="flex items-center gap-2">
                <FlaskConical size={16} />
                <span>Testing</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pl-6">
                {onNavigateToCharts && (
                  <div className="space-y-2">
                    <div className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/50 dark:text-white/50 px-3 py-1">
                      Performance
                    </div>
                    <button
                      onClick={onNavigateToCharts}
                      className="w-full text-left font-['Sniglet:Regular',_sans-serif] text-[12px] text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors py-2 px-3 pl-6 rounded-md hover:bg-[#bae1ff]/20"
                    >
                      Charts
                    </button>
                  </div>
                )}
                {onNavigateToRoadmap && (
                  <div className="space-y-2">
                    <div className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/50 dark:text-white/50 px-3 py-1">
                      Roadmap
                    </div>
                    <button
                      onClick={onNavigateToRoadmap}
                      className="w-full text-left font-['Sniglet:Regular',_sans-serif] text-[12px] text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors py-2 px-3 pl-6 rounded-md hover:bg-[#bae1ff]/20"
                    >
                      📋 Phase 9.0
                    </button>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-[#1a1917] rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] p-8">
            <h1 className="font-['Fredoka_One:Regular',_sans-serif] text-[32px] text-black dark:text-white mb-4">
              Welcome to Admin Dashboard
            </h1>
            <p className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black/70 dark:text-white/70 mb-6">
              Use the menu on the left to access various administration tools and features.
            </p>

            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-[#ffb3ba]/20 rounded-lg p-4 border border-[#211f1c]/10 dark:border-white/10">
                <h3 className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black dark:text-white mb-2">
                  Moderation
                </h3>
                <p className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/60 dark:text-white/60">
                  Review submissions and handle takedown requests
                </p>
              </div>

              <div className="bg-[#e6beb5]/20 rounded-lg p-4 border border-[#211f1c]/10 dark:border-white/10">
                <h3 className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black dark:text-white mb-2">
                  Admin
                </h3>
                <p className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/60 dark:text-white/60">
                  Manage users and system pages
                </p>
              </div>

              <div className="bg-[#e4e3ac]/20 rounded-lg p-4 border border-[#211f1c]/10 dark:border-white/10">
                <h3 className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black dark:text-white mb-2">
                  Database
                </h3>
                <p className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/60 dark:text-white/60">
                  Manage materials, sources, whitepapers, and transforms
                </p>
              </div>

              <div className="bg-[#bae1ff]/20 rounded-lg p-4 border border-[#211f1c]/10 dark:border-white/10">
                <h3 className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black dark:text-white mb-2">
                  Testing
                </h3>
                <p className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/60 dark:text-white/60">
                  Performance monitoring and roadmap tracking
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}