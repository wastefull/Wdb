import { useState, useEffect } from 'react';
import svgPaths from "./imports/svg-qhqftidoeu";
import { Plus, Edit2, Trash2, Search, ArrowLeft, Upload, Image as ImageIcon, ChevronDown, Copy, Check, Type, Eye, RotateCcw, Moon, Save, X, Download, FileUp, Cloud, CloudOff, LogOut, User, Code } from 'lucide-react';
import * as api from './utils/api';
import { logger, setTestMode, getTestMode, loggerInfo } from './utils/logger';
import { AuthView } from './components/AuthView';
import { NavigationProvider, useNavigationContext } from './contexts/NavigationContext';
import { AuthProvider, useAuthContext } from './contexts/AuthContext';
import { MaterialsProvider, useMaterialsContext } from './contexts/MaterialsContext';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './components/ui/collapsible';
import { RadialBarChart, RadialBar, ResponsiveContainer, Legend, Tooltip, PolarAngleAxis, Cell, Text } from 'recharts';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { MethodologyListView, WhitepaperView } from './components/WhitepaperViews';
import { AnimatedWasteChart } from './components/AnimatedWasteChart';
import { AccessibilityProvider, useAccessibility } from './components/AccessibilityContext';
import { UserManagementView } from './components/UserManagementView';
import { LoadingPlaceholder } from './components/LoadingPlaceholder';
import { ScientificMetadataView } from './components/ScientificMetadataView';
import { NotificationBell } from './components/NotificationBell';
import { UserProfileView } from './components/UserProfileView';
import { ScientificDataEditor } from './components/scientific-editor';
import { BatchScientificOperations } from './components/BatchScientificOperations';
import { DataProcessingView } from './components/DataProcessingView';
import { PublicExportView } from './components/PublicExportView';
import { DataMigrationTool } from './components/DataMigrationTool';
import { SourceLibraryManager } from './components/SourceLibraryManager';
import { AssetUploadManager } from './components/AssetUploadManager';
import { QuantileVisualization } from './components/QuantileVisualization';
import { ChartRasterizationDemo } from './components/ChartRasterizationDemo';
import { WhitepaperSyncTool } from './components/WhitepaperSyncTool';
import { SOURCE_LIBRARY, getSourcesByTag } from './data/sources';
import { CookieConsent } from './components/CookieConsent';
import { SubmitMaterialForm } from './components/SubmitMaterialForm';
import { SuggestMaterialEditForm } from './components/SuggestMaterialEditForm';
import { SubmitArticleForm } from './components/SubmitArticleForm';
import { MySubmissionsView } from './components/MySubmissionsView';
import { ContentReviewCenter } from './components/ContentReviewCenter';
import { ApiDocumentation } from './components/ApiDocumentation';
import { Popover, PopoverContent, PopoverTrigger } from './components/ui/popover';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './components/ui/tooltip';
import { Switch } from './components/ui/switch';
import { motion } from 'motion/react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './components/ui/alert-dialog';
import { Input } from './components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { toast } from 'sonner@2.0.3';
import { Toaster } from './components/ui/sonner';
import { Textarea } from './components/ui/textarea';

interface ArticleSection {
  image?: string; // base64 encoded image
  content: string;
}

interface Article {
  id: string;
  title: string;
  category: 'DIY' | 'Industrial' | 'Experimental';
  overview: {
    image?: string;
  };
  introduction: ArticleSection;
  supplies: ArticleSection;
  step1: ArticleSection;
  dateAdded: string;
  
  // Content attribution
  created_by?: string;               // User ID of original creator
  edited_by?: string;                // User ID of editor (if edited directly by admin)
  writer_name?: string;              // Display name of original writer
  editor_name?: string;              // Display name of editor
}

interface Material {
  id: string;
  name: string;
  category: 'Plastics' | 'Metals' | 'Glass' | 'Paper & Cardboard' | 'Fabrics & Textiles' | 'Electronics & Batteries' | 'Building Materials' | 'Organic/Natural Waste';
  compostability: number;
  recyclability: number;
  reusability: number;
  description?: string;
  articles: {
    compostability: Article[];
    recyclability: Article[];
    reusability: Article[];
  };
  
  // Scientific parameters (normalized 0-1)
  // Recyclability (CR)
  Y_value?: number;  // Yield (recovery rate)
  D_value?: number;  // Degradation (quality loss)
  C_value?: number;  // Contamination tolerance
  M_value?: number;  // Maturity (infrastructure availability) - shared across all dimensions
  E_value?: number;  // Energy demand (normalized)
  
  // Compostability (CC)
  B_value?: number;  // Biodegradation rate
  N_value?: number;  // Nutrient balance
  T_value?: number;  // Toxicity / Residue index
  H_value?: number;  // Habitat adaptability
  
  // Reusability (RU)
  L_value?: number;  // Lifetime - functional cycles
  R_value?: number;  // Repairability
  U_value?: number;  // Upgradability
  C_RU_value?: number;  // Contamination susceptibility (for reusability)
  
  // Calculated composite scores - Recyclability
  CR_practical_mean?: number;      // Practical recyclability (0-1)
  CR_theoretical_mean?: number;    // Theoretical recyclability (0-1)
  CR_practical_CI95?: {            // 95% confidence interval
    lower: number;
    upper: number;
  };
  CR_theoretical_CI95?: {
    lower: number;
    upper: number;
  };
  
  // Calculated composite scores - Compostability
  CC_practical_mean?: number;
  CC_theoretical_mean?: number;
  CC_practical_CI95?: {
    lower: number;
    upper: number;
  };
  CC_theoretical_CI95?: {
    lower: number;
    upper: number;
  };
  
  // Calculated composite scores - Reusability
  RU_practical_mean?: number;
  RU_theoretical_mean?: number;
  RU_practical_CI95?: {
    lower: number;
    upper: number;
  };
  RU_theoretical_CI95?: {
    lower: number;
    upper: number;
  };
  
  // Confidence and provenance
  confidence_level?: 'High' | 'Medium' | 'Low';  // Based on data quality
  sources?: Array<{                               // Citation metadata
    title: string;
    authors?: string;
    year?: number;
    doi?: string;
    url?: string;
    weight?: number;  // Source weight in aggregation
    parameters?: string[];  // Which parameters this source contributed to
  }>;
  
  // Versioning and audit trail
  whitepaper_version?: string;      // e.g., "2025.1"
  calculation_timestamp?: string;   // ISO 8601 timestamp
  method_version?: string;           // e.g., "CR-v1"
  
  // Content attribution
  created_by?: string;               // User ID of original creator
  edited_by?: string;                // User ID of editor (if edited directly by admin)
  writer_name?: string;              // Display name of original writer
  editor_name?: string;              // Display name of editor
}

type CategoryType = 'compostability' | 'recyclability' | 'reusability';

function AdminModeButton({ currentView, onViewChange }: { currentView: any; onViewChange: (view: any) => void }) {
  const { settings, toggleAdminMode } = useAccessibility();
  
  const handleAdminToggle = () => {
    // If turning off admin mode and currently on admin-only pages, go back to materials
    if (settings.adminMode && (currentView.type === 'data-management' || currentView.type === 'user-management' || currentView.type === 'scientific-editor' || currentView.type === 'whitepaper-sync' || currentView.type === 'review-center')) {
      onViewChange({ type: 'materials' });
    }
    toggleAdminMode();
  };

  return (
    <button
      onClick={handleAdminToggle}
      className={`px-2 py-1 rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all font-['Sniglet:Regular',_sans-serif] text-[10px] text-black dark:text-white uppercase ${
        settings.adminMode 
          ? 'bg-[#bdd4b7] dark:bg-[#2a2f27] shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]' 
          : 'bg-[#e6beb5]'
      }`}
    >
      Admin
    </button>
  );
}

function RetroButtons({ title }: { title: string }) {
  const { settings, setFontSize, toggleHighContrast, toggleNoPastel, toggleReduceMotion, toggleDarkMode, resetSettings } = useAccessibility();
  const [redOpen, setRedOpen] = useState(false);
  const [yellowOpen, setYellowOpen] = useState(false);
  const [blueOpen, setBlueOpen] = useState(false);

  return (
    <div className="basis-0 grow h-full min-h-px min-w-px relative shrink-0">
      <div className="flex flex-row items-center justify-start md:justify-center size-full">
        <div className="box-border content-stretch flex gap-[6px] md:gap-[10px] items-center justify-start md:justify-center px-[3px] md:px-[7px] py-[2px] relative size-full">
          <TooltipProvider delayDuration={300}>
            <div className="flex flex-row gap-[6px] md:gap-[10px] items-center h-full">
              {/* Red Button - Reset Settings */}
              <UITooltip>
              <TooltipTrigger asChild>
                <div className="relative shrink-0 w-[13px] h-[13px] overflow-visible flex items-center justify-center">
                  <Popover open={redOpen} onOpenChange={setRedOpen}>
                    <PopoverTrigger 
                      className="relative size-full hover:scale-110 transition-transform cursor-pointer"
                      aria-label="Reset accessibility settings"
                    >
                      <div className="absolute inset-[-8.333%]" style={{ "--fill-0": "rgba(230, 188, 181, 1)", "--stroke-0": "rgba(33, 31, 28, 1)" } as React.CSSProperties}>
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
                          <circle cx="7" cy="7" fill="var(--fill-0, #E6BCB5)" r="6.5" stroke="var(--stroke-0, #211F1C)" />
                        </svg>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-4 bg-white dark:bg-[#1a1917] border-[1.5px] border-[#211f1c] rounded-[11.464px] shadow-[3px_4px_0px_-1px_#000000]">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <RotateCcw size={16} />
                          <h3 className="font-['Sniglet:Regular',_sans-serif] text-[14px]">Reset Settings</h3>
                        </div>
                        <p className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/70 dark:text-white/70">
                          Reset all accessibility settings to default
                        </p>
                        <button
                          onClick={() => {
                            resetSettings();
                            setRedOpen(false);
                          }}
                          className="w-full bg-[#e6beb5] h-[36px] rounded-[6px] border border-[#211f1c] shadow-[2px_2px_0px_0px_#000000] font-['Sniglet:Regular',_sans-serif] text-[12px] text-black hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000000] transition-all flex items-center justify-center"
                        >
                          Reset All
                        </button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-black text-white border-black">
                <p className="font-['Sniglet:Regular',_sans-serif] text-[11px]">Reset accessibility</p>
              </TooltipContent>
            </UITooltip>

            {/* Yellow Button - Font Size */}
            <UITooltip>
              <TooltipTrigger asChild>
                <div className="relative shrink-0 w-[13px] h-[13px] overflow-visible flex items-center justify-center">
                  <Popover open={yellowOpen} onOpenChange={setYellowOpen}>
                    <PopoverTrigger 
                      className="relative size-full hover:scale-110 transition-transform cursor-pointer"
                      aria-label="Font size settings"
                    >
                      <div className="absolute inset-[-8.333%]" style={{ "--fill-0": "rgba(228, 227, 172, 1)", "--stroke-0": "rgba(33, 31, 28, 1)" } as React.CSSProperties}>
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
                          <circle cx="7" cy="7" fill="var(--fill-0, #E4E3AC)" r="6.5" stroke="var(--stroke-0, #211F1C)" />
                        </svg>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-4 bg-white dark:bg-[#1a1917] border-[1.5px] border-[#211f1c] rounded-[11.464px] shadow-[3px_4px_0px_-1px_#000000]">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Type size={16} />
                          <h3 className="font-['Sniglet:Regular',_sans-serif] text-[14px]">Font Size</h3>
                        </div>
                        <div className="space-y-2">
                          <button
                            onClick={() => setFontSize('normal')}
                            className={`w-full h-[36px] rounded-[6px] border border-[#211f1c] font-['Sniglet:Regular',_sans-serif] text-[12px] dark:text-white transition-all flex items-center justify-center ${
                              settings.fontSize === 'normal' 
                                ? 'bg-[#e4e3ac] text-black shadow-[2px_2px_0px_0px_#000000]' 
                                : 'bg-white dark:bg-[#2a2825] hover:bg-[#e4e3ac]/20'
                            }`}
                          >
                            Normal
                          </button>
                          <button
                            onClick={() => setFontSize('large')}
                            className={`w-full h-[36px] rounded-[6px] border border-[#211f1c] font-['Sniglet:Regular',_sans-serif] text-[13px] dark:text-white transition-all flex items-center justify-center ${
                              settings.fontSize === 'large' 
                                ? 'bg-[#e4e3ac] text-black shadow-[2px_2px_0px_0px_#000000]' 
                                : 'bg-white dark:bg-[#2a2825] hover:bg-[#e4e3ac]/20'
                            }`}
                          >
                            Large
                          </button>
                          <button
                            onClick={() => setFontSize('xlarge')}
                            className={`w-full h-[36px] rounded-[6px] border border-[#211f1c] font-['Sniglet:Regular',_sans-serif] text-[14px] dark:text-white transition-all flex items-center justify-center ${
                              settings.fontSize === 'xlarge' 
                                ? 'bg-[#e4e3ac] text-black shadow-[2px_2px_0px_0px_#000000]' 
                                : 'bg-white dark:bg-[#2a2825] hover:bg-[#e4e3ac]/20'
                            }`}
                          >
                            Extra Large
                          </button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-black text-white border-black">
                <p className="font-['Sniglet:Regular',_sans-serif] text-[11px]">Font size</p>
              </TooltipContent>
            </UITooltip>

            {/* Blue Button - Display Controls */}
            <UITooltip>
              <TooltipTrigger asChild>
                <div className="relative shrink-0 w-[13px] h-[13px] overflow-visible flex items-center justify-center">
                  <Popover open={blueOpen} onOpenChange={setBlueOpen}>
                    <PopoverTrigger 
                      className="relative size-full hover:scale-110 transition-transform cursor-pointer"
                      aria-label="Display settings"
                    >
                      <div className="absolute inset-[-8.333%]" style={{ "--fill-0": "rgba(184, 200, 203, 1)", "--stroke-0": "rgba(33, 31, 28, 1)" } as React.CSSProperties}>
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
                          <circle cx="7" cy="7" fill="var(--fill-0, #B8C8CB)" r="6.5" stroke="var(--stroke-0, #211F1C)" />
                        </svg>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-4 bg-white dark:bg-[#1a1917] border-[1.5px] border-[#211f1c] rounded-[11.464px] shadow-[3px_4px_0px_-1px_#000000]">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Eye size={16} />
                          <h3 className="font-['Sniglet:Regular',_sans-serif] text-[14px]">Display</h3>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="font-['Sniglet:Regular',_sans-serif] text-[12px] flex items-center gap-2">
                              <Moon size={14} />
                              Dark Mode
                            </label>
                            <Switch 
                              checked={settings.darkMode} 
                              onCheckedChange={toggleDarkMode}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <label className="font-['Sniglet:Regular',_sans-serif] text-[12px]">
                              High Contrast
                            </label>
                            <Switch 
                              checked={settings.highContrast} 
                              onCheckedChange={toggleHighContrast}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <label className="font-['Sniglet:Regular',_sans-serif] text-[12px]">
                              No Pastel
                            </label>
                            <Switch 
                              checked={settings.noPastel} 
                              onCheckedChange={toggleNoPastel}
                              disabled={settings.highContrast}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <label className="font-['Sniglet:Regular',_sans-serif] text-[12px]">
                              Reduce Motion
                            </label>
                            <Switch 
                              checked={settings.reduceMotion} 
                              onCheckedChange={toggleReduceMotion}
                            />
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-black text-white border-black">
                <p className="font-['Sniglet:Regular',_sans-serif] text-[11px]">Display options</p>
              </TooltipContent>
            </UITooltip>
            </div>
          </TooltipProvider>

          <div className="basis-0 grow min-h-px min-w-px flex items-center justify-center gap-2">
            <h1 className="font-['Sniglet:Regular',_sans-serif] leading-[25px] not-italic text-[14px] md:text-[20px] text-black dark:text-white text-center uppercase">{title}</h1>
            <span className="font-['Sniglet:Regular',_sans-serif] text-[8px] md:text-[10px] px-1.5 md:px-2 py-0.5 md:py-1 rounded-full bg-[#bdd4b7] dark:bg-[#2a2f27] border border-[#211f1c] dark:border-white/20 text-black dark:text-white uppercase">Beta</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBar({ title, currentView, onViewChange, syncStatus, user, userRole, onLogout, onSignIn }: { title: string; currentView: any; onViewChange: (view: any) => void; syncStatus?: 'synced' | 'syncing' | 'offline' | 'error'; user?: { id: string; email: string; name?: string }; userRole?: 'user' | 'admin'; onLogout?: () => void; onSignIn?: () => void }) {
  return (
    <header className="h-[42px] md:min-w-[400px] relative shrink-0 w-full" role="banner">
      <div aria-hidden="true" className="absolute border-[#211f1c] dark:border-white/20 border-[0px_0px_1.5px] border-solid inset-0 pointer-events-none" />
      <div className="size-full">
        <div className="box-border content-stretch flex h-[42px] items-center justify-between px-[5px] py-0 relative w-full">
          <RetroButtons title={title} />
          
          <div className="flex items-center gap-2">
            {/* User Controls */}
            {!user && onSignIn && (
              <button
                onClick={onSignIn}
                className="px-3 py-1.5 rounded-md border border-[#211f1c] dark:border-white/20 bg-[#b8c8cb] hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all font-['Sniglet:Regular',_sans-serif] text-[11px] text-black"
              >
                Sign In
              </button>
            )}
            {user && (
              <>
                <TooltipProvider delayDuration={300}>
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onViewChange({ type: 'user-profile', userId: user.id })}
                        className="flex items-center gap-1 px-2 py-1 bg-white/50 dark:bg-black/20 rounded-md border border-[#211f1c]/20 dark:border-white/20 hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all cursor-pointer"
                      >
                        <User size={12} className="text-black dark:text-white" />
                        <span className="font-['Sniglet:Regular',_sans-serif] text-[10px] text-black dark:text-white max-w-[100px] truncate">
                          {user.name || user.email.split('@')[0]}
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-black text-white border-black">
                      <p className="font-['Sniglet:Regular',_sans-serif] text-[11px]">View profile</p>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
                <NotificationBell userId={user.id} isAdmin={userRole === 'admin'} />
                {userRole === 'admin' && (
                  <div className="hidden md:block">
                    <AdminModeButton currentView={currentView} onViewChange={onViewChange} />
                  </div>
                )}
                {onLogout && (
                  <TooltipProvider delayDuration={300}>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={onLogout}
                          className="p-1.5 rounded-md border border-[#211f1c] dark:border-white/20 bg-[#e6beb5] hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all"
                          aria-label="Sign out"
                        >
                          <LogOut size={12} className="text-black" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="bg-black text-white border-black">
                        <p className="font-['Sniglet:Regular',_sans-serif] text-[11px]">Sign out</p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                )}
              </>
            )}
          </div>
          {user && syncStatus && (
            <div className="flex items-center justify-center gap-2 px-3 h-full">
              <TooltipProvider delayDuration={300}>
                <UITooltip>
                  <TooltipTrigger 
                    aria-label={`Sync status: ${syncStatus === 'synced' ? 'Synced to cloud' : syncStatus === 'syncing' ? 'Syncing' : syncStatus === 'offline' ? 'Working offline' : 'Sync error'}`}
                  >
                    {syncStatus === 'synced' && <Cloud size={14} className="text-[#4a90a4] dark:text-[#6bb6d0]" aria-hidden="true" />}
                    {syncStatus === 'syncing' && <Cloud size={14} className="text-[#d4b400] dark:text-[#ffd700] animate-pulse" aria-hidden="true" />}
                    {syncStatus === 'offline' && <CloudOff size={14} className="text-black/40 dark:text-white/40" aria-hidden="true" />}
                    {syncStatus === 'error' && <CloudOff size={14} className="text-[#c74444] dark:text-[#ff6b6b]" aria-hidden="true" />}
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-black text-white border-black">
                    <p className="font-['Sniglet:Regular',_sans-serif] text-[11px]">
                      {syncStatus === 'synced' && 'Synced to cloud'}
                      {syncStatus === 'syncing' && 'Syncing...'}
                      {syncStatus === 'offline' && 'Working offline'}
                      {syncStatus === 'error' && 'Sync error - saved locally'}
                    </p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function SearchIcon() {
  return (
    <div className="h-[16px] relative shrink-0 w-[18px]">
      <div className="absolute inset-[-3.11%_-4.26%_-1.44%_-2.92%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 18">
          <g>
            <path d={svgPaths.p3623ed00} fill="var(--stroke-0, #211F1C)" />
            <path d={svgPaths.p3c786300} fill="var(--stroke-0, #211F1C)" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function SearchBar({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent Figma from intercepting text editing shortcuts
    if (e.metaKey || e.ctrlKey) {
      e.stopPropagation();
    }
  };

  return (
    <div 
      className="relative rounded-[11.46px] shrink-0 w-full bg-white dark:bg-[#2a2825]"
    >
      <div aria-hidden="true" className="absolute border-[#211f1c] dark:border-white/20 border-[1.5px] border-solid inset-[-0.75px] pointer-events-none rounded-[12.21px]" />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="box-border content-stretch flex gap-[15px] items-center justify-start px-[12px] py-[8px] relative w-full">
          <SearchIcon />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDownCapture={handleKeyDown}
            placeholder="Search materials..."
            className="font-['Sniglet:Regular',_sans-serif] bg-transparent border-none outline-none text-[15px] text-black dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50 flex-1"
            aria-label="Search materials"
          />
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ 
  score, 
  label, 
  color, 
  articleCount,
  onClick 
}: { 
  score: number; 
  label: string; 
  color: string; 
  articleCount?: number;
  onClick?: () => void;
}) {
  const { settings } = useAccessibility();

  // Map pastel colors to high-contrast colors
  const getHighContrastColor = (originalColor: string): string => {
    const isDark = settings.darkMode;
    const colorMap: { [key: string]: { light: string; dark: string } } = {
      '#e6beb5': { light: '#c74444', dark: '#ff6b6b' }, // Compostability
      '#e4e3ac': { light: '#d4b400', dark: '#ffd700' }, // Recyclability
      '#b8c8cb': { light: '#4a90a4', dark: '#6bb6d0' }, // Reusability
    };
    
    const mapping = colorMap[originalColor.toLowerCase()];
    if (mapping) {
      return isDark ? mapping.dark : mapping.light;
    }
    return originalColor;
  };

  // Use high-contrast color if high contrast or no pastel mode is enabled
  const displayColor = (settings.highContrast || settings.noPastel) 
    ? getHighContrastColor(color) 
    : color;

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between items-center">
        <button
          onClick={onClick}
          className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black dark:text-white hover:underline cursor-pointer text-left flex items-center gap-1"
          aria-label={`View ${label.toLowerCase()} articles (${articleCount || 0} articles, score: ${score})`}
        >
          <span className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black dark:text-white">{label}</span>
          {articleCount !== undefined && articleCount > 0 && (
            <span className="font-['Sniglet:Regular',_sans-serif] text-[9px] text-black/60 dark:text-white/60">({articleCount})</span>
          )}
        </button>
        <span className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black dark:text-white">{score}</span>
      </div>
      <div 
        className="h-[8px] bg-[#211f1c]/10 dark:bg-white/10 rounded-full overflow-hidden border border-[#211f1c] dark:border-white/20"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} score: ${score} out of 100`}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${score}%`, backgroundColor: displayColor }}
        />
      </div>
    </div>
  );
}

// Custom label component for clickable chart labels
const ClickableChartLabel = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, value, name, categoryKey, onLabelClick } = props;
  
  // Calculate the middle of the radial bar
  const radius = innerRadius + (outerRadius - innerRadius) * 0.3; // Position closer to inner edge
  const angle = startAngle + (endAngle - startAngle) / 2;
  const angleInRadians = (Math.PI / 180) * -angle;
  
  const x = cx + radius * Math.cos(angleInRadians);
  const y = cy + radius * Math.sin(angleInRadians);
  
  return (
    <text
      x={x}
      y={y}
      fill="#211f1c"
      fontFamily="Sniglet:Regular, sans-serif"
      fontSize="13px"
      textAnchor="middle"
      dominantBaseline="middle"
      style={{ cursor: 'pointer' }}
      onClick={(e) => {
        e.stopPropagation();
        if (onLabelClick && categoryKey) {
          onLabelClick(categoryKey);
        }
      }}
    >
      {value}% {name}
    </text>
  );
};

function MaterialCard({ 
  material, 
  onEdit, 
  onDelete,
  onViewArticles,
  onViewMaterial,
  onEditScientific,
  onSuggestEdit,
  isAdminModeActive,
  isAuthenticated
}: { 
  material: Material; 
  onEdit: () => void; 
  onDelete: () => void;
  onViewArticles: (category: CategoryType) => void;
  onViewMaterial: () => void;
  onEditScientific?: () => void;
  onSuggestEdit?: () => void;
  isAdminModeActive?: boolean;
  isAuthenticated?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-[#2a2825] relative rounded-[11.464px] p-4 shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] border-[1.5px] border-[#211f1c] dark:border-white/20">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <button
            onClick={onViewMaterial}
            className="font-['Sniglet:Regular',_sans-serif] text-[16px] text-black dark:text-white mb-1 hover:underline cursor-pointer text-left block"
            aria-label={`View details for ${material.name}`}
          >
            {material.name}
          </button>
          
          {/* Writer/Editor Attribution */}
          {(material.writer_name || material.editor_name) && (
            <div className="mt-1 flex items-center gap-1 flex-wrap font-['Sniglet:Regular',_sans-serif] text-[8px] text-black/40 dark:text-white/40">
              {material.writer_name && material.editor_name ? (
                <>
                  <span>by {material.writer_name}</span>
                  <span>•</span>
                  <span>ed. {material.editor_name}</span>
                </>
              ) : material.writer_name ? (
                <span>by {material.writer_name}</span>
              ) : material.editor_name ? (
                <span>ed. {material.editor_name}</span>
              ) : null}
            </div>
          )}
          <span className="inline-block px-2 py-0.5 bg-[#b8c8cb] rounded-md border border-[#211f1c] dark:border-white/20 font-['Sniglet:Regular',_sans-serif] text-[9px] text-black">
            {material.category}
          </span>
        </div>
        {isAdminModeActive ? (
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="p-1.5 bg-[#e4e3ac] rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all"
              aria-label={`Edit ${material.name}`}
            >
              <Edit2 size={14} className="text-black" aria-hidden="true" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 bg-[#e6beb5] rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all"
              aria-label={`Delete ${material.name}`}
            >
              <Trash2 size={14} className="text-black" aria-hidden="true" />
            </button>
          </div>
        ) : isAuthenticated && onSuggestEdit ? (
          <button
            onClick={onSuggestEdit}
            className="p-1.5 bg-[#b8c8cb] rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all"
            aria-label={`Suggest edit for ${material.name}`}
            title="Suggest an edit"
          >
            <Edit2 size={14} className="text-black" aria-hidden="true" />
          </button>
        ) : null}
      </div>
      
      {material.description && (
        <p className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/70 dark:text-white/70 mb-3 line-clamp-2">{material.description}</p>
      )}
      
      <div className="flex flex-col gap-2 mb-3">
        <QuantileVisualization
          scoreType="compostability"
          data={{
            practical_mean: material.CC_practical_mean,
            theoretical_mean: material.CC_theoretical_mean,
            practical_CI95: material.CC_practical_CI95,
            theoretical_CI95: material.CC_theoretical_CI95,
            confidence_level: material.confidence_level,
            category: material.category
          }}
          fallbackScore={material.compostability}
          simplified={!material.CC_practical_mean || !material.CC_theoretical_mean}
          height={50}
          onClick={() => onViewArticles('compostability')}
          articleCount={material.articles.compostability.length}
        />
        <QuantileVisualization
          scoreType="recyclability"
          data={{
            practical_mean: material.CR_practical_mean,
            theoretical_mean: material.CR_theoretical_mean,
            practical_CI95: material.CR_practical_CI95,
            theoretical_CI95: material.CR_theoretical_CI95,
            confidence_level: material.confidence_level,
            category: material.category
          }}
          fallbackScore={material.recyclability}
          simplified={!material.CR_practical_mean || !material.CR_theoretical_mean}
          height={50}
          onClick={() => onViewArticles('recyclability')}
          articleCount={material.articles.recyclability.length}
        />
        <QuantileVisualization
          scoreType="reusability"
          data={{
            practical_mean: material.RU_practical_mean,
            theoretical_mean: material.RU_theoretical_mean,
            practical_CI95: material.RU_practical_CI95,
            theoretical_CI95: material.RU_theoretical_CI95,
            confidence_level: material.confidence_level,
            category: material.category
          }}
          fallbackScore={material.reusability}
          simplified={!material.RU_practical_mean || !material.RU_theoretical_mean}
          height={50}
          onClick={() => onViewArticles('reusability')}
          articleCount={material.articles.reusability.length}
        />
      </div>
      
      <ScientificMetadataView 
        material={material} 
        onEditScientific={onEditScientific}
        isAdminModeActive={isAdminModeActive}
      />
    </div>
  );
}

function MaterialForm({ material, onSave, onCancel }: { material?: Material; onSave: (material: Omit<Material, 'id'>) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    name: material?.name || '',
    category: material?.category || 'Plastics' as 'Plastics' | 'Metals' | 'Glass' | 'Paper & Cardboard' | 'Fabrics & Textiles' | 'Electronics & Batteries' | 'Building Materials' | 'Organic/Natural Waste',
    compostability: material?.compostability || 0,
    recyclability: material?.recyclability || 0,
    reusability: material?.reusability || 0,
    description: material?.description || '',
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Prevent Figma from intercepting text editing shortcuts
    if (e.metaKey || e.ctrlKey) {
      e.stopPropagation();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      articles: material?.articles || {
        compostability: [],
        recyclability: [],
        reusability: []
      }
    });
  };

  return (
    <div className="bg-white relative rounded-[11.464px] p-6 border-[1.5px] border-[#211f1c]">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black block mb-1">Material Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            onKeyDownCapture={handleKeyDown}
            required
            className="w-full px-3 py-2 bg-white border-[1.5px] border-[#211f1c] rounded-[8px] font-['Sniglet:Regular',_sans-serif] text-[14px] outline-none focus:shadow-[2px_2px_0px_0px_#000000] transition-all"
          />
        </div>

        <div>
          <label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black block mb-1">Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as typeof formData.category })}
            className="w-full px-3 py-2 bg-white border-[1.5px] border-[#211f1c] rounded-[8px] font-['Sniglet:Regular',_sans-serif] text-[14px] outline-none focus:shadow-[2px_2px_0px_0px_#000000] transition-all"
          >
            <option value="Plastics">Plastics</option>
            <option value="Metals">Metals</option>
            <option value="Glass">Glass</option>
            <option value="Paper & Cardboard">Paper & Cardboard</option>
            <option value="Fabrics & Textiles">Fabrics & Textiles</option>
            <option value="Electronics & Batteries">Electronics & Batteries</option>
            <option value="Building Materials">Building Materials</option>
            <option value="Organic/Natural Waste">Organic/Natural Waste</option>
          </select>
        </div>

        <div>
          <label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black block mb-1">Description (optional)</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            onKeyDownCapture={handleKeyDown}
            rows={3}
            className="w-full px-3 py-2 bg-white border-[1.5px] border-[#211f1c] rounded-[8px] font-['Sniglet:Regular',_sans-serif] text-[12px] outline-none focus:shadow-[2px_2px_0px_0px_#000000] transition-all resize-none"
          />
        </div>

        {/* Note about sustainability scores */}
        <div className="bg-[#e5e4dc] dark:bg-[#3a3835] rounded-[8px] p-3 border border-[#211f1c]/20 dark:border-white/20">
          <p className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/70 dark:text-white/70">
            ℹ️ Sustainability scores (Compostability, Recyclability, Reusability) will be calculated by admins in the Data Management area based on scientific parameters.
          </p>
        </div>

        <div className="flex gap-3 mt-2 justify-center">
          <button
            type="submit"
            className="bg-[#e4e3ac] h-[40px] px-8 rounded-[6px] border border-[#211f1c] shadow-[3px_4px_0px_-1px_#000000] font-['Sniglet:Regular',_sans-serif] text-[14px] text-black hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] transition-all"
          >
            {material ? 'Update' : 'Create'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-[#e6beb5] h-[40px] px-8 rounded-[6px] border border-[#211f1c] shadow-[3px_4px_0px_-1px_#000000] font-['Sniglet:Regular',_sans-serif] text-[14px] text-black hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function ImageUploadArea({ 
  image, 
  onImageChange,
  label 
}: { 
  image?: string; 
  onImageChange: (image: string | undefined) => void;
  label?: string;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black block mb-2">{label}</label>
      )}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-[1.5px] border-dashed rounded-[8px] p-4 transition-all ${
          isDragging 
            ? 'border-[#211f1c] bg-[#211f1c]/5' 
            : 'border-[#211f1c]/30 bg-white'
        }`}
      >
        {image ? (
          <div className="relative">
            <img 
              src={image} 
              alt="Preview" 
              className="w-full h-auto rounded-[4px] border border-[#211f1c]"
            />
            <button
              type="button"
              onClick={() => onImageChange(undefined)}
              className="absolute top-2 right-2 bg-[#e6beb5] px-3 py-1 rounded-md border border-[#211f1c] shadow-[2px_2px_0px_0px_#000000] font-['Sniglet:Regular',_sans-serif] text-[11px] text-black hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000000] transition-all"
            >
              Remove
            </button>
          </div>
        ) : (
          <label className="cursor-pointer flex flex-row items-center justify-center gap-2 py-3">
            <ImageIcon size={18} className="text-black/40" />
            <p className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/60">
              Drop image here or click to upload
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              className="hidden"
            />
          </label>
        )}
      </div>
    </div>
  );
}

function ArticleCard({ 
  article, 
  onEdit, 
  onDelete,
  hideActions = false,
  sustainabilityCategory,
  onReadMore,
  isAdminModeActive
}: { 
  article: Article; 
  onEdit: () => void; 
  onDelete: () => void;
  hideActions?: boolean;
  sustainabilityCategory?: { label: string; color: string };
  onReadMore?: () => void;
  isAdminModeActive?: boolean;
}) {
  return (
    <div className="bg-white relative rounded-[11.464px] p-4 shadow-[3px_4px_0px_-1px_#000000] border-[1.5px] border-[#211f1c]">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          {onReadMore ? (
            <button
              onClick={onReadMore}
              className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black hover:underline cursor-pointer text-left block"
            >
              {article.title}
            </button>
          ) : (
            <h4 className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black">
              {article.title}
            </h4>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-block px-2 py-0.5 bg-[#e4e3ac] rounded-md border border-[#211f1c] font-['Sniglet:Regular',_sans-serif] text-[9px] text-black">
              {article.category}
            </span>
            {sustainabilityCategory && (
              <span 
                className="inline-block px-2 py-0.5 rounded-md border border-[#211f1c] font-['Sniglet:Regular',_sans-serif] text-[9px] text-black"
                style={{ backgroundColor: sustainabilityCategory.color }}
              >
                {sustainabilityCategory.label}
              </span>
            )}
          </div>
        </div>
        {!hideActions && isAdminModeActive && (
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="p-1.5 bg-[#e4e3ac] rounded-md border border-[#211f1c] hover:shadow-[2px_2px_0px_0px_#000000] transition-all"
            >
              <Edit2 size={12} />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 bg-[#e6beb5] rounded-md border border-[#211f1c] hover:shadow-[2px_2px_0px_0px_#000000] transition-all"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {/* Overview Section */}
        {article.overview.image && (
          <div>
            <h5 className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black mb-1">Overview</h5>
            <img 
              src={article.overview.image} 
              alt="Overview"
              className="w-full h-auto rounded-[4px] border border-[#211f1c]"
            />
          </div>
        )}

        {/* Introduction Section */}
        <div>
          <h5 className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black mb-1">Introduction</h5>
          {article.introduction.image && (
            <img 
              src={article.introduction.image} 
              alt="Introduction"
              className="w-full h-auto rounded-[4px] border border-[#211f1c] mb-2"
            />
          )}
          <p className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/70 whitespace-pre-wrap">
            {article.introduction.content}
          </p>
        </div>

        {/* Supplies Section */}
        <div>
          <h5 className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black mb-1">Supplies</h5>
          {article.supplies.image && (
            <img 
              src={article.supplies.image} 
              alt="Supplies"
              className="w-full h-auto rounded-[4px] border border-[#211f1c] mb-2"
            />
          )}
          <p className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/70 whitespace-pre-wrap">
            {article.supplies.content}
          </p>
        </div>

        {/* Read more link */}
        {onReadMore && (
          <button
            onClick={onReadMore}
            className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black hover:underline"
          >
            Read more...
          </button>
        )}
      </div>
    </div>
  );
}

function ArticleForm({ 
  article, 
  onSave, 
  onCancel 
}: { 
  article?: Article; 
  onSave: (article: Omit<Article, 'id' | 'dateAdded'>) => void; 
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    title: article?.title || '',
    category: article?.category || 'DIY' as 'DIY' | 'Industrial' | 'Experimental',
    overview: {
      image: article?.overview.image || undefined,
    },
    introduction: {
      image: article?.introduction.image || undefined,
      content: article?.introduction.content || '',
    },
    supplies: {
      image: article?.supplies.image || undefined,
      content: article?.supplies.content || '',
    },
    step1: {
      image: article?.step1.image || undefined,
      content: article?.step1.content || '',
    },
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Prevent Figma from intercepting text editing shortcuts
    if (e.metaKey || e.ctrlKey) {
      e.stopPropagation();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="bg-white relative rounded-[11.464px] p-6 border-[1.5px] border-[#211f1c] mb-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Overview Section */}
        <div className="bg-white rounded-[8px] border-[1.5px] border-[#211f1c] p-4">
          <h3 className="font-['Sniglet:Regular',_sans-serif] text-[15px] text-black mb-4">Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <ImageUploadArea
                image={formData.overview.image}
                onImageChange={(img) => setFormData({
                  ...formData,
                  overview: { ...formData.overview, image: img }
                })}
              />
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black block mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  onKeyDownCapture={handleKeyDown}
                  required
                  className="w-full px-3 py-2 bg-white border-[1.5px] border-[#211f1c] rounded-[8px] font-['Sniglet:Regular',_sans-serif] text-[14px] outline-none focus:shadow-[2px_2px_0px_0px_#000000] transition-all"
                />
              </div>
              <div>
                <label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black block mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as 'DIY' | 'Industrial' | 'Experimental' })}
                  className="w-full px-3 py-2 bg-white border-[1.5px] border-[#211f1c] rounded-[8px] font-['Sniglet:Regular',_sans-serif] text-[14px] outline-none focus:shadow-[2px_2px_0px_0px_#000000] transition-all"
                >
                  <option value="DIY">DIY</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Experimental">Experimental</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Introduction Section */}
        <div className="bg-white rounded-[8px] border-[1.5px] border-[#211f1c] p-4">
          <h3 className="font-['Sniglet:Regular',_sans-serif] text-[15px] text-black mb-4">Introduction</h3>
          <div className="flex flex-col gap-4">
            <ImageUploadArea
              image={formData.introduction.image}
              onImageChange={(img) => setFormData({
                ...formData,
                introduction: { ...formData.introduction, image: img }
              })}
            />
            <div>
              <label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black block mb-1">Content</label>
              <textarea
                value={formData.introduction.content}
                onChange={(e) => setFormData({
                  ...formData,
                  introduction: { ...formData.introduction, content: e.target.value }
                })}
                onKeyDownCapture={handleKeyDown}
                required
                rows={6}
                className="w-full px-3 py-2 bg-white border-[1.5px] border-[#211f1c] rounded-[8px] font-['Sniglet:Regular',_sans-serif] text-[12px] outline-none focus:shadow-[2px_2px_0px_0px_#000000] transition-all resize-none"
                placeholder="Describe what this guide is about..."
              />
            </div>
          </div>
        </div>

        {/* Supplies Section */}
        <div className="bg-white rounded-[8px] border-[1.5px] border-[#211f1c] p-4">
          <h3 className="font-['Sniglet:Regular',_sans-serif] text-[15px] text-black mb-4">Supplies</h3>
          <div className="flex flex-col gap-4">
            <ImageUploadArea
              image={formData.supplies.image}
              onImageChange={(img) => setFormData({
                ...formData,
                supplies: { ...formData.supplies, image: img }
              })}
            />
            <div>
              <label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black block mb-1">Content</label>
              <textarea
                value={formData.supplies.content}
                onChange={(e) => setFormData({
                  ...formData,
                  supplies: { ...formData.supplies, content: e.target.value }
                })}
                onKeyDownCapture={handleKeyDown}
                required
                rows={6}
                className="w-full px-3 py-2 bg-white border-[1.5px] border-[#211f1c] rounded-[8px] font-['Sniglet:Regular',_sans-serif] text-[12px] outline-none focus:shadow-[2px_2px_0px_0px_#000000] transition-all resize-none"
                placeholder="List the supplies needed..."
              />
            </div>
          </div>
        </div>

        {/* Step 1 Section */}
        <div className="bg-white rounded-[8px] border-[1.5px] border-[#211f1c] p-4">
          <h3 className="font-['Sniglet:Regular',_sans-serif] text-[15px] text-black mb-4">Step 1</h3>
          <div className="flex flex-col gap-4">
            <ImageUploadArea
              image={formData.step1.image}
              onImageChange={(img) => setFormData({
                ...formData,
                step1: { ...formData.step1, image: img }
              })}
            />
            <div>
              <label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black block mb-1">Content</label>
              <textarea
                value={formData.step1.content}
                onChange={(e) => setFormData({
                  ...formData,
                  step1: { ...formData.step1, content: e.target.value }
                })}
                onKeyDownCapture={handleKeyDown}
                required
                rows={6}
                className="w-full px-3 py-2 bg-white border-[1.5px] border-[#211f1c] rounded-[8px] font-['Sniglet:Regular',_sans-serif] text-[12px] outline-none focus:shadow-[2px_2px_0px_0px_#000000] transition-all resize-none"
                placeholder="Describe the first step..."
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            type="submit"
            className="bg-[#e4e3ac] h-[40px] px-8 rounded-[6px] border border-[#211f1c] shadow-[3px_4px_0px_-1px_#000000] font-['Sniglet:Regular',_sans-serif] text-[14px] text-black hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] transition-all"
          >
            {article ? 'Update' : 'Add Article'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-[#e6beb5] h-[40px] px-8 rounded-[6px] border border-[#211f1c] shadow-[3px_4px_0px_-1px_#000000] font-['Sniglet:Regular',_sans-serif] text-[14px] text-black hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function ArticlesView({ 
  material, 
  category, 
  onBack,
  onUpdateMaterial,
  onViewArticleStandalone,
  isAdminModeActive,
  user,
  onSignUp
}: { 
  material: Material; 
  category: CategoryType;
  onBack: () => void;
  onUpdateMaterial: (material: Material) => void;
  onViewArticleStandalone: (articleId: string) => void;
  isAdminModeActive?: boolean;
  user: { id: string; email: string; name?: string } | null;
  onSignUp: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  const categoryColors = {
    compostability: '#e6beb5',
    recyclability: '#e4e3ac',
    reusability: '#b8c8cb',
  };

  const categoryLabels = {
    compostability: 'Compostability',
    recyclability: 'Recyclability',
    reusability: 'Reusability',
  };

  const articles = material.articles[category];

  const handleAddArticle = (articleData: Omit<Article, 'id' | 'dateAdded'>) => {
    const newArticle: Article = {
      ...articleData,
      id: Date.now().toString(),
      dateAdded: new Date().toISOString(),
    };
    
    const updatedMaterial = {
      ...material,
      articles: {
        ...material.articles,
        [category]: [...material.articles[category], newArticle]
      }
    };
    
    onUpdateMaterial(updatedMaterial);
    setShowForm(false);
  };

  const handleUpdateArticle = (articleData: Omit<Article, 'id' | 'dateAdded'>) => {
    if (!editingArticle) return;
    
    const updatedArticles = material.articles[category].map(a => 
      a.id === editingArticle.id 
        ? { ...articleData, id: a.id, dateAdded: a.dateAdded } 
        : a
    );
    
    const updatedMaterial = {
      ...material,
      articles: {
        ...material.articles,
        [category]: updatedArticles
      }
    };
    
    onUpdateMaterial(updatedMaterial);
    setEditingArticle(null);
    setShowForm(false);
  };

  const handleDeleteArticle = (id: string) => {
    if (confirm('Are you sure you want to delete this article?')) {
      const updatedMaterial = {
        ...material,
        articles: {
          ...material.articles,
          [category]: material.articles[category].filter(a => a.id !== id)
        }
      };
      
      onUpdateMaterial(updatedMaterial);
    }
  };

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
          <h2 className="font-['Sniglet:Regular',_sans-serif] text-[18px] text-black dark:text-white">
            {material.name} - {categoryLabels[category]}
          </h2>
          <p className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black/60 dark:text-white/60">
            {articles.length} article{articles.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isAdminModeActive && (
          <button
            onClick={() => {
              setShowForm(true);
              setEditingArticle(null);
            }}
            className="bg-[#b8c8cb] h-[40px] px-6 rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] font-['Sniglet:Regular',_sans-serif] text-[14px] text-black hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] dark:hover:shadow-[2px_3px_0px_-1px_rgba(255,255,255,0.2)] transition-all flex items-center gap-2"
            style={{ backgroundColor: categoryColors[category] }}
          >
            <Plus size={16} className="text-black" />
            Add Article
          </button>
        )}
      </div>

      {showForm && (
        <ArticleForm
          article={editingArticle || undefined}
          onSave={editingArticle ? handleUpdateArticle : handleAddArticle}
          onCancel={() => {
            setShowForm(false);
            setEditingArticle(null);
          }}
        />
      )}

      {/* Recyclability Visualization - only for recyclability category */}
      {category === 'recyclability' && material.CR_practical_mean && material.CR_theoretical_mean && (
        <div className="mb-6 bg-white dark:bg-[#2a2825] rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 p-6 shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)]">
          <div className="max-w-2xl mx-auto">
            <h3 className="font-['Sniglet:Regular',_sans-serif] text-[16px] text-black dark:text-white mb-4">
              Recyclability Score Overview
            </h3>
            <QuantileVisualization
              scoreType="recyclability"
              data={{
                practical_mean: material.CR_practical_mean,
                theoretical_mean: material.CR_theoretical_mean,
                practical_CI95: material.CR_practical_CI95,
                theoretical_CI95: material.CR_theoretical_CI95,
                confidence_level: material.confidence_level,
                category: material.category
              }}
              width={600}
              height={80}
              articleCount={articles.length}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {articles.map(article => (
          <ArticleCard
            key={article.id}
            article={article}
            onEdit={() => {
              setEditingArticle(article);
              setShowForm(true);
            }}
            onDelete={() => handleDeleteArticle(article.id)}
            onReadMore={() => onViewArticleStandalone(article.id)}
            isAdminModeActive={isAdminModeActive}
          />
        ))}
      </div>

      {articles.length === 0 && (
        <div className="text-center py-12">
          <p className="font-['Sniglet:Regular',_sans-serif] text-[16px] text-black/50">
            {user ? (
              'No articles yet. Add your first one!'
            ) : (
              <>
                No articles yet.{' '}
                <button
                  onClick={onSignUp}
                  className="text-black dark:text-white underline hover:no-underline transition-all"
                >
                  Sign up
                </button>
                {' '}to become a contributor!
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

function MaterialDetailView({
  material,
  onBack,
  onViewArticles,
  onUpdateMaterial,
  onViewArticleStandalone,
  isAdminModeActive
}: {
  material: Material;
  onBack: () => void;
  onViewArticles: (category: CategoryType) => void;
  onUpdateMaterial: (material: Material) => void;
  onViewArticleStandalone: (articleId: string, category: CategoryType) => void;
  isAdminModeActive?: boolean;
}) {
  const categoryLabels = {
    compostability: 'Compostability',
    recyclability: 'Recyclability',
    reusability: 'Reusability',
  };

  const categoryColors = {
    compostability: '#e6beb5',
    recyclability: '#e4e3ac',
    reusability: '#b8c8cb',
  };

  const allArticles = [
    ...material.articles.compostability.map(a => ({ article: a, category: 'compostability' as CategoryType })),
    ...material.articles.recyclability.map(a => ({ article: a, category: 'recyclability' as CategoryType })),
    ...material.articles.reusability.map(a => ({ article: a, category: 'reusability' as CategoryType })),
  ].sort((a, b) => new Date(b.article.dateAdded).getTime() - new Date(a.article.dateAdded).getTime());

  const totalArticles = allArticles.length;

  const handleDeleteArticle = (articleId: string, category: CategoryType) => {
    if (confirm('Are you sure you want to delete this article?')) {
      const updatedMaterial = {
        ...material,
        articles: {
          ...material.articles,
          [category]: material.articles[category].filter(a => a.id !== articleId)
        }
      };
      onUpdateMaterial(updatedMaterial);
    }
  };

  const [editingArticle, setEditingArticle] = useState<{ article: Article; category: CategoryType } | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleUpdateArticle = (articleData: Omit<Article, 'id' | 'dateAdded'>) => {
    if (!editingArticle) return;
    
    const updatedArticles = material.articles[editingArticle.category].map(a => 
      a.id === editingArticle.article.id 
        ? { ...articleData, id: a.id, dateAdded: a.dateAdded } 
        : a
    );
    
    const updatedMaterial = {
      ...material,
      articles: {
        ...material.articles,
        [editingArticle.category]: updatedArticles
      }
    };
    
    onUpdateMaterial(updatedMaterial);
    setEditingArticle(null);
    setShowForm(false);
  };

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
          <h2 className="font-['Sniglet:Regular',_sans-serif] text-[20px] text-black dark:text-white">
            {material.name}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-block px-2 py-0.5 bg-[#b8c8cb] rounded-md border border-[#211f1c] dark:border-white/20 font-['Sniglet:Regular',_sans-serif] text-[9px] text-black">
              {material.category}
            </span>
            <p className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black/60 dark:text-white/60">
              {totalArticles} article{totalArticles !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {material.description && (
        <div className="bg-white rounded-[11.464px] border-[1.5px] border-[#211f1c] p-4 mb-6">
          <p className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black/80">{material.description}</p>
        </div>
      )}

      <div className="bg-white dark:bg-[#2a2825] rounded-[11.464px] border-[1.5px] border-[#211f1c] dark:border-white/20 p-4 mb-6">
        <h3 className="font-['Sniglet:Regular',_sans-serif] text-[15px] text-black dark:text-white mb-4">Sustainability Scores</h3>
        <div className="flex flex-col gap-3">
          <QuantileVisualization
            scoreType="compostability"
            data={{
              practical_mean: material.CC_practical_mean,
              theoretical_mean: material.CC_theoretical_mean,
              practical_CI95: material.CC_practical_CI95,
              theoretical_CI95: material.CC_theoretical_CI95,
              confidence_level: material.confidence_level,
              category: material.category
            }}
            fallbackScore={material.compostability}
            simplified={!material.CC_practical_mean || !material.CC_theoretical_mean}
            height={50}
            onClick={() => onViewArticles('compostability')}
            articleCount={material.articles.compostability.length}
          />
          <QuantileVisualization
            scoreType="recyclability"
            data={{
              practical_mean: material.CR_practical_mean,
              theoretical_mean: material.CR_theoretical_mean,
              practical_CI95: material.CR_practical_CI95,
              theoretical_CI95: material.CR_theoretical_CI95,
              confidence_level: material.confidence_level,
              category: material.category
            }}
            fallbackScore={material.recyclability}
            simplified={!material.CR_practical_mean || !material.CR_theoretical_mean}
            height={50}
            onClick={() => onViewArticles('recyclability')}
            articleCount={material.articles.recyclability.length}
          />
          <QuantileVisualization
            scoreType="reusability"
            data={{
              practical_mean: material.RU_practical_mean,
              theoretical_mean: material.RU_theoretical_mean,
              practical_CI95: material.RU_practical_CI95,
              theoretical_CI95: material.RU_theoretical_CI95,
              confidence_level: material.confidence_level,
              category: material.category
            }}
            fallbackScore={material.reusability}
            simplified={!material.RU_practical_mean || !material.RU_theoretical_mean}
            height={50}
            onClick={() => onViewArticles('reusability')}
            articleCount={material.articles.reusability.length}
          />
        </div>
      </div>

      {showForm && editingArticle && (
        <ArticleForm
          article={editingArticle.article}
          onSave={handleUpdateArticle}
          onCancel={() => {
            setShowForm(false);
            setEditingArticle(null);
          }}
        />
      )}

      {totalArticles > 0 ? (
        <div>
          <h3 className="font-['Sniglet:Regular',_sans-serif] text-[16px] text-black mb-4">All Articles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allArticles.map(({ article, category }) => (
              <ArticleCard
                key={`${category}-${article.id}`}
                article={article}
                onEdit={() => {
                  setEditingArticle({ article, category });
                  setShowForm(true);
                }}
                onDelete={() => handleDeleteArticle(article.id, category)}
                sustainabilityCategory={{
                  label: categoryLabels[category],
                  color: categoryColors[category]
                }}
                onReadMore={() => onViewArticleStandalone(article.id, category)}
                isAdminModeActive={isAdminModeActive}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="font-['Sniglet:Regular',_sans-serif] text-[16px] text-black/50">
            No articles yet. Click on a category score above to add one!
          </p>
        </div>
      )}
    </div>
  );
}

function AllArticlesView({ 
  category, 
  materials, 
  onBack,
  onViewArticleStandalone
}: { 
  category: CategoryType; 
  materials: Material[]; 
  onBack: () => void;
  onViewArticleStandalone: (articleId: string, materialId: string) => void;
}) {
  const categoryLabels = {
    compostability: 'Compost',
    recyclability: 'Recycling',
    reusability: 'Reuse'
  };

  // Collect all articles for this category across all materials
  const articlesWithMaterial = materials.flatMap(material => {
    const categoryArticles = material.articles?.[category];
    if (!categoryArticles || !Array.isArray(categoryArticles)) return [];
    return categoryArticles.map(article => ({
      article,
      material
    }));
  });

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 bg-[#b8c8cb] rounded-md border border-[#211f1c] hover:shadow-[2px_2px_0px_0px_#000000] transition-all"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <h2 className="font-['Sniglet:Regular',_sans-serif] text-[18px] text-black">
            All {categoryLabels[category]} Articles
          </h2>
          <p className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black/60">
            {articlesWithMaterial.length} article{articlesWithMaterial.length !== 1 ? 's' : ''} across all materials
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {articlesWithMaterial.map(({ article, material }) => (
          <div key={`${material.id}-${article.id}`} className="relative">
            <div className="absolute top-3 right-3 bg-white/90 px-2 py-1 rounded-md border border-[#211f1c] z-10">
              <p className="font-['Sniglet:Regular',_sans-serif] text-[10px] text-black">
                {material.name}
              </p>
            </div>
            <ArticleCard
              article={article}
              onEdit={() => {}}
              onDelete={() => {}}
              hideActions
              onReadMore={() => onViewArticleStandalone(article.id, material.id)}
            />
          </div>
        ))}
      </div>

      {articlesWithMaterial.length === 0 && (
        <div className="text-center py-12">
          <p className="font-['Sniglet:Regular',_sans-serif] text-[16px] text-black/50">
            No {categoryLabels[category].toLowerCase()} articles yet.
          </p>
        </div>
      )}
    </div>
  );
}

function RecyclabilityCalculationView({ onBack }: { onBack: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [markdownContent, setMarkdownContent] = useState('');

  useEffect(() => {
    // Add KaTeX CSS to document head
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
    link.integrity = 'sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);

    // Load markdown content from localStorage or use default
    const storedContent = localStorage.getItem('recyclabilityMarkdown');
    if (storedContent) {
      setMarkdownContent(storedContent);
    } else {
      const defaultContent = `# How is recyclability calculated?

1234

The recyclability category score is calculated using the following formula:

$
R_{category} = \\frac{\\sum_i R_{s,i} \\times \\text{Market Share}_i}{\\sum_i \\text{Market Share}_i}
$

Where:
- $R_{category}$ is the recyclability score for the category
- $R_{s,i}$ is the recyclability score for each subcategory $i$
- $\\text{Market Share}_i$ is the market share of subcategory $i$
`;
      setMarkdownContent(defaultContent);
    }

    return () => {
      // Cleanup: remove the link when component unmounts
      document.head.removeChild(link);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Prevent Figma from intercepting text editing shortcuts
    if (e.metaKey || e.ctrlKey) {
      e.stopPropagation();
    }
  };

  const handleSave = () => {
    localStorage.setItem('recyclabilityMarkdown', markdownContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reload from localStorage
    const storedContent = localStorage.getItem('recyclabilityMarkdown');
    if (storedContent) {
      setMarkdownContent(storedContent);
    }
    setIsEditing(false);
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 bg-[#b8c8cb] rounded-md border border-[#211f1c] hover:shadow-[2px_2px_0px_0px_#000000] transition-all"
        >
          <ArrowLeft size={16} />
        </button>
        <h2 className="font-['Sniglet:Regular',_sans-serif] text-[18px] text-black flex-1">
          Recyclability Calculation
        </h2>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 bg-[#e4e3ac] rounded-md border border-[#211f1c] hover:shadow-[2px_2px_0px_0px_#000000] transition-all"
          >
            <Edit2 size={14} />
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="bg-[#e4e3ac] h-[36px] px-6 rounded-[6px] border border-[#211f1c] shadow-[3px_4px_0px_-1px_#000000] font-['Sniglet:Regular',_sans-serif] text-[13px] text-black hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] transition-all"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="bg-[#e6beb5] h-[36px] px-6 rounded-[6px] border border-[#211f1c] shadow-[3px_4px_0px_-1px_#000000] font-['Sniglet:Regular',_sans-serif] text-[13px] text-black hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] transition-all"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[11.464px] border-[1.5px] border-[#211f1c] p-6 max-w-3xl mx-auto">
        {isEditing ? (
          <div>
            <label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black block mb-2">
              Markdown Content (use $...$ for inline math, $...$ for block math)
            </label>
            <textarea
              value={markdownContent}
              onChange={(e) => setMarkdownContent(e.target.value)}
              onKeyDownCapture={handleKeyDown}
              rows={20}
              className="w-full px-3 py-2 bg-white border-[1.5px] border-[#211f1c] rounded-[8px] font-mono text-[12px] outline-none focus:shadow-[2px_2px_0px_0px_#000000] transition-all resize-y"
              placeholder="Enter markdown content..."
            />
          </div>
        ) : (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkMath, remarkGfm]}
              rehypePlugins={[rehypeKatex]}
              components={{
                h1: ({node, ...props}) => <h1 className="font-['Sniglet:Regular',_sans-serif] text-[20px] text-black mb-4" {...props} />,
                h2: ({node, ...props}) => <h2 className="font-['Sniglet:Regular',_sans-serif] text-[18px] text-black mb-3" {...props} />,
                h3: ({node, ...props}) => <h3 className="font-['Sniglet:Regular',_sans-serif] text-[16px] text-black mb-2" {...props} />,
                p: ({node, ...props}) => <p className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black/80 mb-4 leading-relaxed" {...props} />,
                ul: ({node, ...props}) => <ul className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black/80 mb-4 list-disc pl-6" {...props} />,
                li: ({node, ...props}) => <li className="mb-1" {...props} />,
                table: ({node, ...props}) => (
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-[1.5px] border-[#211f1c] rounded-[8px]" {...props} />
                  </div>
                ),
                thead: ({node, ...props}) => <thead className="bg-[#e4e3ac] border-b-[1.5px] border-[#211f1c]" {...props} />,
                tbody: ({node, ...props}) => <tbody {...props} />,
                tr: ({node, ...props}) => <tr className="border-b border-[#211f1c]/20" {...props} />,
                th: ({node, ...props}) => <th className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black px-3 py-2 text-left border-r border-[#211f1c]/20 last:border-r-0" {...props} />,
                td: ({node, ...props}) => <td className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/80 px-3 py-2 border-r border-[#211f1c]/20 last:border-r-0" {...props} />,
                code: ({node, inline, ...props}) => 
                  inline ? (
                    <code className="bg-[#211f1c]/5 px-1.5 py-0.5 rounded border border-[#211f1c]/20 text-black" style={{ fontSize: '14px', fontFamily: 'DaddyTimeMono Nerd Font Mono, Press Start 2P, monospace' }} {...props} />
                  ) : (
                    <code className="text-black block" style={{ fontSize: '12px', fontFamily: 'DaddyTimeMono Nerd Font Mono, Press Start 2P, monospace' }} {...props} />
                  ),
                pre: ({node, ...props}) => (
                  <pre className="bg-[#211f1c]/5 border-[1.5px] border-[#211f1c] rounded-[8px] p-4 mb-4 overflow-x-auto" style={{ fontFamily: 'DaddyTimeMono Nerd Font Mono, Press Start 2P, monospace' }} {...props} />
                ),
              }}
            >
              {markdownContent}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

function StandaloneArticleView({
  article,
  sustainabilityCategory,
  materialName,
  onBack,
  onEdit,
  onDelete,
  isAdminModeActive
}: {
  article: Article;
  sustainabilityCategory?: { label: string; color: string };
  materialName?: string;
  onBack: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isAdminModeActive?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const permalink = `${window.location.origin}${window.location.pathname}?article=${article.id}`;

  const copyPermalink = () => {
    navigator.clipboard.writeText(permalink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
          <h2 className="font-['Sniglet:Regular',_sans-serif] text-[18px] text-black dark:text-white">
            {article.title}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-block px-2 py-0.5 bg-[#e4e3ac] rounded-md border border-[#211f1c] dark:border-white/20 font-['Sniglet:Regular',_sans-serif] text-[9px] text-black">
              {article.category}
            </span>
            {sustainabilityCategory && (
              <span 
                className="inline-block px-2 py-0.5 rounded-md border border-[#211f1c] dark:border-white/20 font-['Sniglet:Regular',_sans-serif] text-[9px] text-black"
                style={{ backgroundColor: sustainabilityCategory.color }}
              >
                {sustainabilityCategory.label}
              </span>
            )}
            {materialName && (
              <span className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/60 dark:text-white/60">
                from {materialName}
              </span>
            )}
          </div>
        </div>
        {onEdit && onDelete && isAdminModeActive && (
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="p-2 bg-[#e4e3ac] rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all"
            >
              <Edit2 size={14} className="text-black" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 bg-[#e6beb5] rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all"
            >
              <Trash2 size={14} className="text-black" />
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[11.464px] border-[1.5px] border-[#211f1c] p-6 max-w-3xl mx-auto">
        <div className="space-y-6">
          {/* Overview Section */}
          {article.overview.image && (
            <div>
              <h3 className="font-['Sniglet:Regular',_sans-serif] text-[15px] text-black mb-3">Overview</h3>
              <img 
                src={article.overview.image} 
                alt="Overview"
                className="w-full h-auto rounded-[4px] border border-[#211f1c]"
              />
            </div>
          )}

          {/* Introduction Section */}
          <div>
            <h3 className="font-['Sniglet:Regular',_sans-serif] text-[15px] text-black mb-3">Introduction</h3>
            {article.introduction.image && (
              <img 
                src={article.introduction.image} 
                alt="Introduction"
                className="w-full h-auto rounded-[4px] border border-[#211f1c] mb-3"
              />
            )}
            <p className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black/80 whitespace-pre-wrap leading-relaxed">
              {article.introduction.content}
            </p>
          </div>

          {/* Supplies Section */}
          <div>
            <h3 className="font-['Sniglet:Regular',_sans-serif] text-[15px] text-black mb-3">Supplies</h3>
            {article.supplies.image && (
              <img 
                src={article.supplies.image} 
                alt="Supplies"
                className="w-full h-auto rounded-[4px] border border-[#211f1c] mb-3"
              />
            )}
            <p className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black/80 whitespace-pre-wrap leading-relaxed">
              {article.supplies.content}
            </p>
          </div>

          {/* Step 1 Section */}
          <div>
            <h3 className="font-['Sniglet:Regular',_sans-serif] text-[15px] text-black mb-3">Step 1</h3>
            {article.step1.image && (
              <img 
                src={article.step1.image} 
                alt="Step 1"
                className="w-full h-auto rounded-[4px] border border-[#211f1c] mb-3"
              />
            )}
            <p className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black/80 whitespace-pre-wrap leading-relaxed">
              {article.step1.content}
            </p>
          </div>

          <div className="pt-4 border-t border-[#211f1c]/20 space-y-2">
            <p className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/50">
              Added: {new Date(article.dateAdded).toLocaleDateString()}
            </p>
            <div className="flex items-center gap-2">
              <p className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/50 truncate flex-1">
                Permalink: {permalink}
              </p>
              <button
                onClick={copyPermalink}
                className="p-1.5 bg-[#e4e3ac] rounded-md border border-[#211f1c] hover:shadow-[2px_2px_0px_0px_#000000] transition-all shrink-0"
                title="Copy permalink"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DataManagementView({
  materials,
  onBack,
  onUpdateMaterial,
  onUpdateMaterials,
  onBulkImport,
  onDeleteAllData,
  onDeleteMaterial,
  onViewMaterial
}: {
  materials: Material[];
  onBack: () => void;
  onUpdateMaterial: (material: Material) => void;
  onUpdateMaterials: (materials: Material[]) => void;
  onBulkImport: (materials: Material[]) => void;
  onDeleteAllData: () => void;
  onDeleteMaterial: (materialId: string) => void;
  onViewMaterial: (materialId: string) => void;
}) {
  const [activeTab, setActiveTab] = useState('materials');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Material>>({});
  const [showImportOptions, setShowImportOptions] = useState(false);
  const [pasteData, setPasteData] = useState('');

  const categoryOptions = [
    'Plastics',
    'Metals',
    'Glass',
    'Paper & Cardboard',
    'Fabrics & Textiles',
    'Electronics & Batteries',
    'Building Materials',
    'Organic/Natural Waste'
  ];

  const handleEdit = (material: Material) => {
    setEditingId(material.id);
    setEditData({
      name: material.name,
      category: material.category,
      description: material.description,
      compostability: material.compostability,
      recyclability: material.recyclability,
      reusability: material.reusability
    });
  };

  const handleSave = () => {
    if (!editingId) return;
    const material = materials.find(m => m.id === editingId);
    if (!material) return;

    const updatedMaterial = {
      ...material,
      ...editData
    };
    onUpdateMaterial(updatedMaterial);
    setEditingId(null);
    setEditData({});
    toast.success('Material updated successfully');
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const processCSVText = (text: string) => {
    try {
      const lines = text.split('\n').filter(line => line.trim());
        
      if (lines.length < 2) {
        toast.error('CSV must have headers and at least one row');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const requiredHeaders = ['name', 'category', 'compostability', 'recyclability', 'reusability'];
      const hasRequired = requiredHeaders.every(h => headers.includes(h));

      if (!hasRequired) {
        toast.error('CSV must include: name, category, compostability, recyclability, reusability');
        return;
      }

      const newMaterials: Material[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        if (!row.name || !row.category) continue;

        const newMaterial: Material = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: row.name,
          category: row.category,
          description: row.description || '',
          compostability: Math.min(100, Math.max(0, parseInt(row.compostability) || 0)),
          recyclability: Math.min(100, Math.max(0, parseInt(row.recyclability) || 0)),
          reusability: Math.min(100, Math.max(0, parseInt(row.reusability) || 0)),
          articles: {
            compostability: [],
            recyclability: [],
            reusability: []
          }
        };

        newMaterials.push(newMaterial);
      }

      // Import all materials at once
      if (newMaterials.length > 0) {
        onBulkImport(newMaterials);
        toast.success(`Imported ${newMaterials.length} material${newMaterials.length !== 1 ? 's' : ''}`);
      } else {
        toast.error('No valid materials found in CSV');
      }
    } catch (error) {
      toast.error('Failed to parse CSV data');
    }
  };

  const handlePasteImport = () => {
    if (!pasteData.trim()) {
      toast.error('Please paste CSV data first');
      return;
    }
    processCSVText(pasteData);
    setPasteData('');
    setShowImportOptions(false);
  };

  const handleBulkImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      processCSVText(text);
      event.target.value = ''; // Reset file input
      setShowImportOptions(false);
    };
    reader.readAsText(file);
  };

  const handleExportCSV = () => {
    const headers = ['name', 'category', 'description', 'compostability', 'recyclability', 'reusability'];
    const csvContent = [
      headers.join(','),
      ...materials.map(m => [
        m.name,
        m.category,
        m.description || '',
        m.compostability,
        m.recyclability,
        m.reusability
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wastedb-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
  };

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
          <h2 className="font-['Sniglet:Regular',_sans-serif] text-[18px] text-black dark:text-white">
            Database Management
          </h2>
          <p className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black/60 dark:text-white/60">
            Manage materials and scientific operations
          </p>
        </div>
      </div>

      {/* Tabs for Material Management, Batch Operations, Data Processing, Source Library, and Assets */}
      <div className="mb-6">
        <div className="flex gap-2 border-b border-[#211f1c]/20 dark:border-white/20 flex-wrap">
          <button
            onClick={() => setActiveTab('materials')}
            className={`px-4 py-2 font-['Sniglet:Regular',_sans-serif] text-[12px] transition-colors ${
              activeTab === 'materials'
                ? 'text-black dark:text-white border-b-2 border-[#211f1c] dark:border-white'
                : 'text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white'
            }`}
          >
            Material Management
          </button>
          <button
            onClick={() => setActiveTab('batch')}
            className={`px-4 py-2 font-['Sniglet:Regular',_sans-serif] text-[12px] transition-colors ${
              activeTab === 'batch'
                ? 'text-black dark:text-white border-b-2 border-[#211f1c] dark:border-white'
                : 'text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white'
            }`}
          >
            Batch Operations
          </button>
          <button
            onClick={() => setActiveTab('processing')}
            className={`px-4 py-2 font-['Sniglet:Regular',_sans-serif] text-[12px] transition-colors ${
              activeTab === 'processing'
                ? 'text-black dark:text-white border-b-2 border-[#211f1c] dark:border-white'
                : 'text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white'
            }`}
          >
            Data Processing
          </button>
          <button
            onClick={() => setActiveTab('sources')}
            className={`px-4 py-2 font-['Sniglet:Regular',_sans-serif] text-[12px] transition-colors ${
              activeTab === 'sources'
                ? 'text-black dark:text-white border-b-2 border-[#211f1c] dark:border-white'
                : 'text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white'
            }`}
          >
            Source Library
          </button>
          <button
            onClick={() => setActiveTab('assets')}
            className={`px-4 py-2 font-['Sniglet:Regular',_sans-serif] text-[12px] transition-colors ${
              activeTab === 'assets'
                ? 'text-black dark:text-white border-b-2 border-[#211f1c] dark:border-white'
                : 'text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white'
            }`}
          >
            Assets
          </button>
          <button
            onClick={() => setActiveTab('charts')}
            className={`px-4 py-2 font-['Sniglet:Regular',_sans-serif] text-[12px] transition-colors ${
              activeTab === 'charts'
                ? 'text-black dark:text-white border-b-2 border-[#211f1c] dark:border-white'
                : 'text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white'
            }`}
          >
            Chart Testing
          </button>
        </div>
      </div>

      {activeTab === 'materials' ? (
        <div>
          {/* Data Migration Tool */}
          <div className="mb-6">
            <DataMigrationTool
              materials={materials}
              onMigrate={(migratedMaterials) => onUpdateMaterials(migratedMaterials)}
            />
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <p className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black/60 dark:text-white/60">
                {materials.length} material{materials.length !== 1 ? 's' : ''} total
              </p>
            </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="bg-[#b8c8cb] h-[36px] px-4 rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 shadow-[2px_3px_0px_-1px_#000000] dark:shadow-[2px_3px_0px_-1px_rgba(255,255,255,0.2)] font-['Sniglet:Regular',_sans-serif] text-[12px] text-black hover:translate-y-[1px] hover:shadow-[1px_2px_0px_-1px_#000000] dark:hover:shadow-[1px_2px_0px_-1px_rgba(255,255,255,0.2)] transition-all flex items-center gap-2"
          >
            <Download size={14} className="text-black" />
            Export CSV
          </button>
          
          <button
            onClick={() => setShowImportOptions(!showImportOptions)}
            className={`bg-[#e4e3ac] h-[36px] px-4 rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 shadow-[2px_3px_0px_-1px_#000000] dark:shadow-[2px_3px_0px_-1px_rgba(255,255,255,0.2)] font-['Sniglet:Regular',_sans-serif] text-[12px] text-black hover:translate-y-[1px] hover:shadow-[1px_2px_0px_-1px_#000000] dark:hover:shadow-[1px_2px_0px_-1px_rgba(255,255,255,0.2)] transition-all flex items-center gap-2 ${
              showImportOptions ? 'translate-y-[1px] shadow-[1px_2px_0px_-1px_#000000]' : ''
            }`}
          >
            <FileUp size={14} className="text-black" />
            Import CSV
            <ChevronDown size={14} className={`text-black transition-transform ${showImportOptions ? 'rotate-180' : ''}`} />
          </button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="bg-[#e6beb5] h-[36px] px-4 rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 shadow-[2px_3px_0px_-1px_#000000] dark:shadow-[2px_3px_0px_-1px_rgba(255,255,255,0.2)] font-['Sniglet:Regular',_sans-serif] text-[12px] text-black hover:translate-y-[1px] hover:shadow-[1px_2px_0px_-1px_#000000] dark:hover:shadow-[1px_2px_0px_-1px_rgba(255,255,255,0.2)] transition-all flex items-center gap-2">
                <Trash2 size={14} className="text-black" />
                Delete All
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white dark:bg-[#2a2825] border-[1.5px] border-[#211f1c] dark:border-white/20">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-['Sniglet:Regular',_sans-serif] text-black dark:text-white">
                  Delete All Data?
                </AlertDialogTitle>
                <AlertDialogDescription className="font-['Sniglet:Regular',_sans-serif] text-black/70 dark:text-white/70">
                  This will permanently delete all {materials.length} material{materials.length !== 1 ? 's' : ''} and their associated articles. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="font-['Sniglet:Regular',_sans-serif] bg-[#b8c8cb] border-[#211f1c] dark:border-white/20">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={onDeleteAllData}
                  className="font-['Sniglet:Regular',_sans-serif] bg-[#e6beb5] text-black border-[1.5px] border-[#211f1c] dark:border-white/20 hover:bg-[#e6beb5]/80"
                >
                  Delete All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Import Options */}
      {showImportOptions && (
        <div className="mb-4 bg-white dark:bg-[#2a2825] rounded-[11.464px] border-[1.5px] border-[#211f1c] dark:border-white/20 p-4">
          <h3 className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black dark:text-white mb-4">
            Import CSV Data
          </h3>
          
          <div className="space-y-4">
            {/* Paste CSV Option */}
            <div className="space-y-2">
              <label className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black dark:text-white">
                Paste CSV Data
              </label>
              <Textarea
                value={pasteData}
                onChange={(e) => setPasteData(e.target.value)}
                placeholder="name,category,description,compostability,recyclability,reusability&#10;PET Plastic,Plastics,Clear plastic bottles,0,85,40&#10;Aluminum Can,Metals,Beverage container,0,95,75"
                className="font-['Sniglet:Regular',_sans-serif] text-[11px] min-h-[120px] border-[#211f1c] dark:border-white/20 dark:bg-[#1a1917] dark:text-white"
              />
              <button
                onClick={handlePasteImport}
                className="w-full bg-[#b8c8cb] h-[36px] px-4 rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 shadow-[2px_3px_0px_-1px_#000000] dark:shadow-[2px_3px_0px_-1px_rgba(255,255,255,0.2)] font-['Sniglet:Regular',_sans-serif] text-[12px] text-black hover:translate-y-[1px] hover:shadow-[1px_2px_0px_-1px_#000000] dark:hover:shadow-[1px_2px_0px_-1px_rgba(255,255,255,0.2)] transition-all"
              >
                Import from Paste
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#211f1c]/20 dark:border-white/20"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white dark:bg-[#2a2825] px-2 font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/60 dark:text-white/60">
                  OR
                </span>
              </div>
            </div>

            {/* Upload File Option */}
            <div className="space-y-2">
              <label className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black dark:text-white">
                Upload CSV File
              </label>
              <label className="w-full bg-[#e4e3ac] h-[36px] px-4 rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 shadow-[2px_3px_0px_-1px_#000000] dark:shadow-[2px_3px_0px_-1px_rgba(255,255,255,0.2)] font-['Sniglet:Regular',_sans-serif] text-[12px] text-black hover:translate-y-[1px] hover:shadow-[1px_2px_0px_-1px_#000000] dark:hover:shadow-[1px_2px_0px_-1px_rgba(255,255,255,0.2)] transition-all flex items-center justify-center gap-2 cursor-pointer">
                <Upload size={14} className="text-black" />
                Choose File
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleBulkImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-[#2a2825] rounded-[11.464px] border-[1.5px] border-[#211f1c] dark:border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[#211f1c] dark:border-white/20 bg-[#e4e3ac]">
                <TableHead className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black">Name</TableHead>
                <TableHead className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black">Category</TableHead>
                <TableHead className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black">Description</TableHead>
                <TableHead className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black text-center">Compostability</TableHead>
                <TableHead className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black text-center">Recyclability</TableHead>
                <TableHead className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black text-center">Reusability</TableHead>
                <TableHead className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black text-center">Articles</TableHead>
                <TableHead className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((material) => {
                const isEditing = editingId === material.id;
                return (
                  <TableRow key={material.id} className="border-b border-[#211f1c]/20 dark:border-white/10 hover:bg-[#211f1c]/5 dark:hover:bg-white/5">
                    <TableCell className="font-['Sniglet:Regular',_sans-serif] text-[11px]">
                      {isEditing ? (
                        <Input
                          value={editData.name || ''}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          className="h-7 text-[11px] font-['Sniglet:Regular',_sans-serif] border-[#211f1c] dark:border-white/20"
                        />
                      ) : (
                        <button
                          onClick={() => onViewMaterial(material.id)}
                          className="text-blue-600 dark:text-blue-400 hover:underline text-left flex items-center gap-1.5 group"
                        >
                          <Eye size={12} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                          {material.name}
                        </button>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Select
                          value={editData.category || material.category}
                          onValueChange={(value) => setEditData({ ...editData, category: value })}
                        >
                          <SelectTrigger className="h-7 text-[9px] font-['Sniglet:Regular',_sans-serif] border-[#211f1c] dark:border-white/20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="font-['Sniglet:Regular',_sans-serif] bg-white dark:bg-[#2a2825] border-[#211f1c] dark:border-white/20">
                            {categoryOptions.map(cat => (
                              <SelectItem key={cat} value={cat} className="text-[9px]">
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="inline-block px-2 py-0.5 bg-[#b8c8cb] rounded-md border border-[#211f1c] dark:border-white/20 font-['Sniglet:Regular',_sans-serif] text-[9px] text-black">
                          {material.category}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/70 dark:text-white/70 max-w-xs">
                      {isEditing ? (
                        <Input
                          value={editData.description || ''}
                          onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                          className="h-7 text-[11px] font-['Sniglet:Regular',_sans-serif] border-[#211f1c] dark:border-white/20"
                        />
                      ) : (
                        <span className="truncate block">{material.description || '-'}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {isEditing ? (
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={editData.compostability ?? material.compostability}
                          onChange={(e) => setEditData({ ...editData, compostability: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                          className="h-7 w-16 text-[11px] font-['Sniglet:Regular',_sans-serif] border-[#211f1c] dark:border-white/20 text-center"
                        />
                      ) : (
                        <div className="inline-flex items-center gap-1">
                          <span className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black dark:text-white">
                            {material.compostability}
                          </span>
                          <div className="w-12 h-1.5 bg-[#211f1c]/10 dark:bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#e6beb5] rounded-full"
                              style={{ width: `${material.compostability}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {isEditing ? (
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={editData.recyclability ?? material.recyclability}
                          onChange={(e) => setEditData({ ...editData, recyclability: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                          className="h-7 w-16 text-[11px] font-['Sniglet:Regular',_sans-serif] border-[#211f1c] dark:border-white/20 text-center"
                        />
                      ) : (
                        <div className="inline-flex items-center gap-1">
                          <span className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black dark:text-white">
                            {material.recyclability}
                          </span>
                          <div className="w-12 h-1.5 bg-[#211f1c]/10 dark:bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#e4e3ac] rounded-full"
                              style={{ width: `${material.recyclability}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {isEditing ? (
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={editData.reusability ?? material.reusability}
                          onChange={(e) => setEditData({ ...editData, reusability: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                          className="h-7 w-16 text-[11px] font-['Sniglet:Regular',_sans-serif] border-[#211f1c] dark:border-white/20 text-center"
                        />
                      ) : (
                        <div className="inline-flex items-center gap-1">
                          <span className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black dark:text-white">
                            {material.reusability}
                          </span>
                          <div className="w-12 h-1.5 bg-[#211f1c]/10 dark:bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#b8c8cb] rounded-full"
                              style={{ width: `${material.reusability}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-['Sniglet:Regular',_sans-serif] text-[9px] text-black dark:text-white">
                        {material.articles.compostability.length} / {material.articles.recyclability.length} / {material.articles.reusability.length}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {isEditing ? (
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={handleSave}
                            className="p-1.5 bg-[#b8c8cb] rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[1px_1px_0px_0px_#000000] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,0.2)] transition-all"
                          >
                            <Save size={12} className="text-black" />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="p-1.5 bg-[#e6beb5] rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[1px_1px_0px_0px_#000000] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,0.2)] transition-all"
                          >
                            <X size={12} className="text-black" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => handleEdit(material)}
                            className="p-1.5 bg-[#e4e3ac] rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[1px_1px_0px_0px_#000000] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,0.2)] transition-all"
                            title="Edit material"
                          >
                            <Edit2 size={12} className="text-black" />
                          </button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button
                                className="p-1.5 bg-[#e6beb5] rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[1px_1px_0px_0px_#000000] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,0.2)] transition-all"
                                title="Delete material"
                              >
                                <Trash2 size={12} className="text-black" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-white dark:bg-[#2a2825] border-[1.5px] border-[#211f1c] dark:border-white/20">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="font-['Sniglet:Regular',_sans-serif] text-black dark:text-white">
                                  Delete Material?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="font-['Sniglet:Regular',_sans-serif] text-black/70 dark:text-white/70">
                                  Are you sure you want to delete "{material.name}"? This will permanently remove the material and all its associated articles. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="font-['Sniglet:Regular',_sans-serif] bg-[#b8c8cb] border-[#211f1c] dark:border-white/20">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => onDeleteMaterial(material.id)}
                                  className="font-['Sniglet:Regular',_sans-serif] bg-[#e6beb5] text-black border-[1.5px] border-[#211f1c] dark:border-white/20 hover:bg-[#e6beb5]/80"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {materials.length === 0 && (
          <div className="text-center py-12">
            <p className="font-['Sniglet:Regular',_sans-serif] text-[16px] text-black/50 dark:text-white/50">
              No materials in database yet.
            </p>
          </div>
        )}
      </div>
        </div>
      ) : activeTab === 'batch' ? (
        <BatchScientificOperations
          materials={materials}
          onUpdateMaterials={onUpdateMaterials}
          onBack={() => {}} // Empty since we're in a tab
          isEmbedded={true} // Hide back button when in tab mode
        />
      ) : activeTab === 'processing' ? (
        <DataProcessingView
          materials={materials}
          onBack={() => {}} // Empty since we're in a tab
          onUpdateMaterials={onUpdateMaterials}
        />
      ) : activeTab === 'sources' ? (
        <SourceLibraryManager
          onBack={() => {}} // Empty since we're in a tab
          materials={materials}
        />
      ) : activeTab === 'assets' ? (
        <AssetUploadManager
          accessToken={sessionStorage.getItem('wastedb_access_token')}
        />
      ) : activeTab === 'charts' ? (
        <ChartRasterizationDemo />
      ) : null}
    </div>
  );
}

function AppContent() {
  const { settings, toggleAdminMode } = useAccessibility();
  const { currentView, navigateTo, navigateToMaterials, navigateToMaterialDetail, navigateToArticles, navigateToArticleDetail, navigateToMethodologyList, navigateToWhitepaper, navigateToDataManagement, navigateToUserManagement, navigateToScientificEditor, navigateToExport, navigateToUserProfile, navigateToMySubmissions, navigateToReviewCenter, navigateToWhitepaperSync, navigateToApiDocs } = useNavigationContext();
  const { user, userRole, isAuthenticated, signIn, signOut, updateUserRole } = useAuthContext();
  
  // Phase 3B Complete: MaterialsContext is the single source of truth for all material data
  const {
    materials,
    isLoadingMaterials,
    syncStatus,
    supabaseAvailable,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    bulkImport,
    updateMaterials,
    deleteAllMaterials,
    retrySync,
    getMaterialById,
  } = useMaterialsContext();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [articleToOpen, setArticleToOpen] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubmitMaterialForm, setShowSubmitMaterialForm] = useState(false);
  const [materialToEdit, setMaterialToEdit] = useState<Material | null>(null);
  const [showSubmitArticleForm, setShowSubmitArticleForm] = useState(false);
  
  // Expose logger to window for browser console debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).wastedbLogger = {
        setTestMode,
        getTestMode,
        info: loggerInfo,
        log: logger.log,
        error: logger.error,
        warn: logger.warn,
        debug: logger.debug,
      };
      
      // Log initialization only if in test mode
      if (getTestMode()) {
        logger.log('🪟 Logger exposed to window.wastedbLogger');
        logger.log('   Usage: wastedbLogger.setTestMode(true/false)');
        logger.log('   Info: wastedbLogger.info()');
      }
    }
  }, []);
  
  // Phase 3A: Log context state for verification
  useEffect(() => {
    console.log('[Phase 3A] MaterialsContext Status:', {
      materials_count_ctx: materials.length,
      isLoadingMaterials_ctx: isLoadingMaterials,
      syncStatus_ctx: syncStatus,
      supabaseAvailable_ctx: supabaseAvailable,
      context_functions_available: !!(addMaterial && updateMaterial && deleteMaterial)
    });
  }, [materials.length, isLoadingMaterials, syncStatus, supabaseAvailable]);
  
  // Handle magic link callback (AuthContext handles regular session restoration)
  useEffect(() => {
    const handleMagicLink = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const magicToken = urlParams.get('magic_token');
      
      if (magicToken) {
        // Verify magic link token and get access token
        logger.log('Detected magic token in URL, verifying...');
        try {
          const response = await api.verifyMagicLink(magicToken);
          logger.log('Magic link verification response:', response);
          
          if (response.access_token && response.user) {
            // Store access token (already done in verifyMagicLink, but do it again to be sure)
            logger.log('App.tsx: Storing access token again:', response.access_token.substring(0, 8) + '...');
            api.setAccessToken(response.access_token);
            
            // Wait a tiny bit to ensure sessionStorage has committed
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Verify token is stored
            const storedToken = sessionStorage.getItem('wastedb_access_token');
            logger.log('App.tsx: Verified token in storage before getUserRole:', storedToken?.substring(0, 8) + '...');
            
            // Sign in user via context (this will also fetch role)
            await signIn(response.user);
            
            // Clear the URL parameters to avoid confusion
            window.history.replaceState({}, document.title, window.location.pathname);
            
            logger.log('Magic link authentication successful');
            toast.success(`Welcome back, ${response.user.email}!`);
          } else {
            logger.error('Invalid response structure:', response);
            throw new Error('Invalid magic link response');
          }
        } catch (error) {
          logger.error('Error processing magic link:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          toast.error(`Magic link verification failed: ${errorMessage}`);
          // Clear the URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    };
    
    handleMagicLink();
  }, [signIn]);
  
  // Ensure admin mode is off when not authenticated
  useEffect(() => {
    if (!isAuthenticated && settings.adminMode) {
      toggleAdminMode();
    }
  }, [isAuthenticated, settings.adminMode, toggleAdminMode]);

  // OLD CODE REMOVED: MaterialsContext now handles loading materials from Supabase/localStorage
  // Check for article permalink in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('article');
    if (articleId) {
      setArticleToOpen(articleId);
    }
  }, []);

  // Navigate to article when articleToOpen is set and materials are loaded
  useEffect(() => {
    if (articleToOpen && materials.length > 0) {
      // Find the article in all materials
      for (const material of materials) {
        for (const category of ['compostability', 'recyclability', 'reusability'] as CategoryType[]) {
          const article = material.articles[category].find(a => a.id === articleToOpen);
          if (article) {
            setCurrentView({ type: 'article-standalone', articleId: articleToOpen, materialId: material.id, category });
            setArticleToOpen(null);
            // Clear the URL parameter
            window.history.replaceState({}, '', window.location.pathname);
            return;
          }
        }
      }
    }
  }, [articleToOpen, materials]);

  const handleAddMaterial = async (materialData: Omit<Material, 'id'>) => {
    const newMaterial: Material = {
      ...materialData,
      id: Date.now().toString(),
    };
    await addMaterial(newMaterial);
    setShowForm(false);
    toast.success(`Added ${materialData.name} successfully`);
  };

  const handleUpdateMaterial = async (materialData: Omit<Material, 'id'> | Material) => {
    if ('id' in materialData) {
      // Direct update with full material (from ArticlesView or CSV import)
      const existingIndex = materials.findIndex(m => m.id === materialData.id);
      if (existingIndex >= 0) {
        // Update existing material
        await updateMaterial(materialData);
        toast.success(`Updated ${materialData.name} successfully`);
      } else {
        // Add new material (e.g., from CSV import)
        await addMaterial(materialData);
        toast.success(`Added ${materialData.name} successfully`);
      }
    } else {
      // Update from form (preserves id and articles)
      if (!editingMaterial) return;
      const updatedMaterial = { ...materialData, id: editingMaterial.id, articles: editingMaterial.articles };
      await updateMaterial(updatedMaterial);
      setEditingMaterial(null);
      setShowForm(false);
      toast.success(`Updated ${materialData.name} successfully`);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    const material = materials.find(m => m.id === id);
    if (confirm('Are you sure you want to delete this material?')) {
      await deleteMaterial(id);
      if (material) {
        toast.success(`Deleted ${material.name} successfully`);
      }
    }
  };

  const handleBulkImport = async (newMaterials: Material[]) => {
    await bulkImport(newMaterials);
  };

  const handleViewArticles = (materialId: string, category: CategoryType) => {
    navigateToArticles(materialId, category);
  };

  const handleViewMaterial = (materialId: string) => {
    navigateToMaterialDetail(materialId);
  };

  const handleViewArticleStandalone = (materialId: string, articleId: string, category: CategoryType) => {
    navigateTo({ type: 'article-standalone', articleId, materialId, category });
  };

  // Auth handlers
  const handleAuthSuccess = async (userData: { id: string; email: string; name?: string }) => {
    await signIn(userData);
  };

  const handleLogout = () => {
    signOut();
    // Ensure admin mode is off
    if (settings.adminMode) {
      toggleAdminMode();
    }
  };

  const filteredMaterials = materials.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentMaterial = (currentView.type === 'articles' || currentView.type === 'material-detail' || currentView.type === 'article-standalone' || currentView.type === 'scientific-editor')
    ? materials.find(m => m.id === currentView.materialId) 
    : null;

  // Admin mode is only active if user is authenticated, has admin role, AND has toggled admin mode on
  const isAdminModeActive = user && userRole === 'admin' && settings.adminMode;

  return (
    <>
      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative max-w-md w-full">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute -top-2 -right-2 z-10 p-2 rounded-full bg-[#e6beb5] border border-[#211f1c] dark:border-white/20 hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all"
            >
              <X size={16} className="text-black" />
            </button>
            <AuthView onAuthSuccess={(userData) => {
              handleAuthSuccess(userData);
              setShowAuthModal(false);
            }} />
          </div>
        </div>
      )}
      
      <div 
        className="min-h-screen p-3 md:p-8 bg-[#faf7f2] dark:bg-[#2a2825]"
        style={{
          backgroundImage: `url("https://www.transparenttextures.com/patterns/3px-tile.png")`,
          backgroundSize: '3px 3px'
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="bg-[#faf7f2] dark:bg-[#1a1917] rounded-[11.464px] border-[1.5px] border-[#211f1c] dark:border-white/20 overflow-hidden mb-6">
            <StatusBar title="WasteDB" currentView={currentView} onViewChange={navigateTo} syncStatus={syncStatus} user={user} userRole={userRole} onLogout={handleLogout} onSignIn={() => setShowAuthModal(true)} />
          
          {currentView.type === 'materials' ? (
            <div className="p-6">
              {/* Sync error/offline banner - only show for authenticated users */}
              {user && (syncStatus === 'error' || syncStatus === 'offline') && (
                <div className="mb-4 p-3 bg-[#e6beb5] dark:bg-[#2a2825] border-[1.5px] border-[#211f1c] dark:border-white/20 rounded-[8px] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CloudOff size={16} className="text-black dark:text-white" />
                    <p className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black dark:text-white">
                      {syncStatus === 'offline' ? 'Working offline - data saved locally only' : 'Failed to sync to cloud'}
                    </p>
                  </div>
                  <button
                    onClick={retrySync}
                    className="px-3 py-1.5 bg-[#b8c8cb] rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all font-['Sniglet:Regular',_sans-serif] text-[11px] text-black flex items-center gap-1"
                  >
                    <Cloud size={12} />
                    Retry Sync
                  </button>
                </div>
              )}
              {/* Search bar and chart on same line for wide screens */}
              <div className="flex flex-col lg:flex-row gap-4 lg:justify-between mb-6">
                {/* Left column: Search bar, Add Material button, and Methodology link (vertically and horizontally centered) */}
                <div className="w-full lg:w-96 lg:pl-20 flex flex-col justify-center items-center gap-4">
                  {/* Search bar with Add Material button beside it */}
                  <div className="w-full flex gap-2">
                    <div className="flex-1">
                      <SearchBar value={searchQuery} onChange={setSearchQuery} />
                    </div>
                    {user && (
                      <button
                        onClick={() => {
                          if (isAdminModeActive) {
                            setShowForm(true);
                            setEditingMaterial(null);
                          } else {
                            setShowSubmitMaterialForm(true);
                          }
                        }}
                        className={`h-[40px] px-3 rounded-[11.46px] border-[1.5px] border-[#211f1c] shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] dark:border-white/20 font-['Sniglet:Regular',_sans-serif] text-[12px] text-black hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] dark:hover:shadow-[2px_3px_0px_-1px_rgba(255,255,255,0.2)] transition-all flex items-center gap-2 whitespace-nowrap ${
                          isAdminModeActive ? 'bg-[#b8c8cb]' : 'bg-[#c8e5c8]'
                        }`}
                        title={isAdminModeActive ? "Add a new material" : "Submit a new material"}
                      >
                        <Plus size={14} className="text-black" />
                        <span className="hidden sm:inline">{isAdminModeActive ? 'Add' : 'Submit'} Material</span>
                      </button>
                    )}
                  </div>
                  {user && (
                    <div className="flex flex-wrap gap-2 justify-center">
                      {isAdminModeActive ? (
                        <>
                          <button
                            onClick={navigateToReviewCenter}
                            className="bg-[#c8e5c8] h-[40px] px-3 rounded-[11.46px] border-[1.5px] border-[#211f1c] shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] dark:border-white/20 font-['Sniglet:Regular',_sans-serif] text-[12px] text-black hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] dark:hover:shadow-[2px_3px_0px_-1px_rgba(255,255,255,0.2)] transition-all"
                          >
                            Review Center
                          </button>
                          <button
                            onClick={navigateToDataManagement}
                            className="bg-[#e4e3ac] h-[40px] px-3 rounded-[11.46px] border-[1.5px] border-[#211f1c] shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] dark:border-white/20 font-['Sniglet:Regular',_sans-serif] text-[12px] text-black hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] dark:hover:shadow-[2px_3px_0px_-1px_rgba(255,255,255,0.2)] transition-all"
                          >
                            Database Management
                          </button>
                          <button
                            onClick={navigateToUserManagement}
                            className="bg-[#e6beb5] h-[40px] px-3 rounded-[11.46px] border-[1.5px] border-[#211f1c] shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] dark:border-white/20 font-['Sniglet:Regular',_sans-serif] text-[12px] text-black hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] dark:hover:shadow-[2px_3px_0px_-1px_rgba(255,255,255,0.2)] transition-all"
                          >
                            User Management
                          </button>
                          <button
                            onClick={navigateToWhitepaperSync}
                            className="bg-[#b8c8cb] h-[40px] px-3 rounded-[11.46px] border-[1.5px] border-[#211f1c] shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] dark:border-white/20 font-['Sniglet:Regular',_sans-serif] text-[12px] text-black hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] dark:hover:shadow-[2px_3px_0px_-1px_rgba(255,255,255,0.2)] transition-all"
                          >
                            Whitepaper Sync
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={navigateToMySubmissions}
                          className="bg-[#f4d3a0] h-[40px] px-3 rounded-[11.46px] border-[1.5px] border-[#211f1c] shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] dark:border-white/20 font-['Sniglet:Regular',_sans-serif] text-[12px] text-black hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] dark:hover:shadow-[2px_3px_0px_-1px_rgba(255,255,255,0.2)] transition-all"
                        >
                          My Submissions
                        </button>
                      )}
                    </div>
                  )}
                  <div className="flex flex-col gap-2 items-center">
                    <div className="flex items-center gap-2">
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        onClick={navigateToMethodologyList}
                        className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:underline transition-colors text-center"
                      >
                        Methodology & Whitepapers
                      </motion.button>
                      {userRole === 'admin' && (
                        <div className="md:hidden">
                          <AdminModeButton currentView={currentView} onViewChange={navigateTo} />
                        </div>
                      )}
                    </div>
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.35 }}
                      onClick={navigateToExport}
                      className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:underline transition-colors text-center flex items-center gap-1"
                    >
                      <Download size={12} />
                      Export Data (Open Access)
                    </motion.button>
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      onClick={navigateToApiDocs}
                      className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:underline transition-colors text-center flex items-center gap-1"
                    >
                      <Code size={12} />
                      API Documentation
                    </motion.button>
                  </div>
                </div>

                {/* Chart on right side for wide screens - max 50% width */}
                {!searchQuery && materials.length > 0 && currentView.type === 'materials' && (() => {
                  // Compute chart data once so we can reference it in the label
                  const chartData = [
                    {
                      name: 'Compostable',
                      shortName: 'compostable',
                      categoryKey: 'compostability',
                      value: Math.round(materials.reduce((sum, m) => sum + m.compostability, 0) / materials.length),
                      articleCount: materials.reduce((sum, m) => sum + m.articles.compostability.length, 0),
                      fill: '#e8a593'
                    },
                    {
                      name: 'Recyclable',
                      shortName: 'recyclable',
                      categoryKey: 'recyclability',
                      value: Math.round(materials.reduce((sum, m) => sum + m.recyclability, 0) / materials.length),
                      articleCount: materials.reduce((sum, m) => sum + m.articles.recyclability.length, 0),
                      fill: '#f0e68c'
                    },
                    {
                      name: 'Reusable',
                      shortName: 'reusable',
                      categoryKey: 'reusability',
                      value: Math.round(materials.reduce((sum, m) => sum + m.reusability, 0) / materials.length),
                      articleCount: materials.reduce((sum, m) => sum + m.articles.reusability.length, 0),
                      fill: '#a8c5d8'
                    }
                  ];

                  return (
                    <div className="w-full lg:w-[50%]">
                      <AnimatedWasteChart
                        chartData={chartData}
                        onCategoryClick={(categoryKey) => navigateTo({ type: 'all-articles', category: categoryKey as CategoryType })}
                      />
                    </div>
                  );
                })()}
              </div>

              {showForm && (
                <div className="mb-6">
                  <MaterialForm
                    material={editingMaterial || undefined}
                    onSave={editingMaterial ? handleUpdateMaterial : handleAddMaterial}
                    onCancel={() => {
                      setShowForm(false);
                      setEditingMaterial(null);
                    }}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMaterials.map(material => (
                  <MaterialCard
                    key={material.id}
                    material={material}
                    onEdit={() => {
                      setEditingMaterial(material);
                      setShowForm(true);
                    }}
                    onDelete={() => handleDeleteMaterial(material.id)}
                    onViewArticles={(category) => handleViewArticles(material.id, category)}
                    onViewMaterial={() => handleViewMaterial(material.id)}
                    onEditScientific={() => navigateToScientificEditor(material.id)}
                    onSuggestEdit={() => setMaterialToEdit(material)}
                    isAdminModeActive={isAdminModeActive}
                    isAuthenticated={!!user}
                  />
                ))}
              </div>

              {isLoadingMaterials ? (
                <LoadingPlaceholder />
              ) : filteredMaterials.length === 0 ? (
                <div className="text-center py-12">
                  <p className="font-['Sniglet:Regular',_sans-serif] text-[16px] text-black/50 dark:text-white/50">
                    {searchQuery ? 'No materials found matching your search.' : 'No materials yet. Add your first one!'}
                  </p>
                </div>
              ) : null}
            </div>
          ) : currentMaterial && currentView.type === 'articles' ? (
            <ArticlesView
              material={currentMaterial}
              category={currentView.category}
              onBack={navigateToMaterials}
              onUpdateMaterial={handleUpdateMaterial}
              onViewArticleStandalone={(articleId) => handleViewArticleStandalone(currentMaterial.id, articleId, currentView.category)}
              isAdminModeActive={isAdminModeActive}
              user={user}
              onSignUp={() => setShowAuthModal(true)}
            />
          ) : currentView.type === 'all-articles' ? (
            <AllArticlesView
              category={currentView.category}
              materials={materials}
              onBack={navigateToMaterials}
              onViewArticleStandalone={(articleId, materialId) => handleViewArticleStandalone(materialId, articleId, currentView.category)}
            />
          ) : currentMaterial && currentView.type === 'material-detail' ? (
            <MaterialDetailView
              material={currentMaterial}
              onBack={navigateToMaterials}
              onViewArticles={(category) => handleViewArticles(currentMaterial.id, category)}
              onUpdateMaterial={handleUpdateMaterial}
              onViewArticleStandalone={(articleId, category) => handleViewArticleStandalone(currentMaterial.id, articleId, category)}
              isAdminModeActive={isAdminModeActive}
            />
          ) : currentMaterial && currentView.type === 'article-standalone' ? (
            <StandaloneArticleView
              article={currentMaterial.articles[currentView.category].find(a => a.id === currentView.articleId)!}
              sustainabilityCategory={{
                label: currentView.category === 'compostability' ? 'Compostability' : currentView.category === 'recyclability' ? 'Recyclability' : 'Reusability',
                color: currentView.category === 'compostability' ? '#e6beb5' : currentView.category === 'recyclability' ? '#e4e3ac' : '#b8c8cb'
              }}
              materialName={currentMaterial.name}
              onBack={() => navigateToMaterialDetail(currentMaterial.id)}
              onEdit={() => {
                // Navigate back to material detail with edit form open
                navigateToMaterialDetail(currentMaterial.id);
              }}
              onDelete={() => {
                if (confirm('Are you sure you want to delete this article?')) {
                  const updatedMaterial = {
                    ...currentMaterial,
                    articles: {
                      ...currentMaterial.articles,
                      [currentView.category]: currentMaterial.articles[currentView.category].filter(a => a.id !== currentView.articleId)
                    }
                  };
                  handleUpdateMaterial(updatedMaterial);
                  navigateToMaterialDetail(currentMaterial.id);
                }
              }}
              isAdminModeActive={isAdminModeActive}
            />
          ) : currentView.type === 'methodology-list' ? (
            <MethodologyListView
              onBack={navigateToMaterials}
              onSelectWhitepaper={navigateToWhitepaper}
            />
          ) : currentView.type === 'whitepaper' ? (
            <WhitepaperView
              whitepaperSlug={currentView.whitepaperSlug}
              onBack={navigateToMethodologyList}
            />
          ) : currentView.type === 'data-management' ? (
            <DataManagementView
              materials={materials}
              onBack={navigateToMaterials}
              onUpdateMaterial={handleUpdateMaterial}
              onUpdateMaterials={updateMaterials}
              onBulkImport={handleBulkImport}
              onDeleteMaterial={handleDeleteMaterial}
              onViewMaterial={navigateToMaterialDetail}
              onDeleteAllData={async () => {
                await deleteAllMaterials();
                toast.success(supabaseAvailable ? 'All data deleted from cloud and locally' : 'All data deleted locally');
                navigateToMaterials();
              }}
            />
          ) : currentView.type === 'user-management' ? (
            <UserManagementView
              onBack={navigateToMaterials}
              currentUserId={user?.id || ''}
            />
          ) : currentView.type === 'whitepaper-sync' ? (
            <WhitepaperSyncTool
              onBack={navigateToMaterials}
            />
          ) : currentView.type === 'scientific-editor' && currentMaterial ? (
            <ScientificDataEditor
              material={currentMaterial}
              onSave={(updatedMaterial) => {
                handleUpdateMaterial(updatedMaterial);
                navigateToMaterials();
              }}
              onCancel={navigateToMaterials}
            />
          ) : currentView.type === 'export' ? (
            <PublicExportView
              onBack={navigateToMaterials}
              materialsCount={materials.length}
            />
          ) : currentView.type === 'user-profile' ? (
            <UserProfileView
              userId={currentView.userId}
              onBack={navigateToMaterials}
              isOwnProfile={currentView.userId === user?.id}
            />
          ) : currentView.type === 'my-submissions' ? (
            <MySubmissionsView
              onBack={navigateToMaterials}
            />
          ) : currentView.type === 'review-center' ? (
            <ContentReviewCenter
              onBack={navigateToMaterials}
              currentUserId={user?.id || ''}
            />
          ) : currentView.type === 'api-docs' ? (
            <div className="max-w-5xl mx-auto">
              <div className="mb-6">
                <button
                  onClick={() => navigateToMaterials()}
                  className="flex items-center gap-2 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white font-['Sniglet:Regular',_sans-serif] transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Materials
                </button>
              </div>
              <ApiDocumentation />
            </div>
          ) : null}
        </div>
      </div>

      {/* Submission Forms */}
      {showSubmitMaterialForm && (
        <SubmitMaterialForm
          onClose={() => setShowSubmitMaterialForm(false)}
          onSubmitSuccess={() => {
            // Optionally refresh submissions or show a notification
            toast.success('Material submitted! Check "My Submissions" for updates.');
          }}
        />
      )}

      {materialToEdit && (
        <SuggestMaterialEditForm
          material={materialToEdit}
          onClose={() => setMaterialToEdit(null)}
          onSubmitSuccess={() => {
            toast.success('Edit suggestion submitted! Check "My Submissions" for updates.');
          }}
        />
      )}

      {showSubmitArticleForm && (
        <SubmitArticleForm
          onClose={() => setShowSubmitArticleForm(false)}
          onSubmitSuccess={() => {
            toast.success('Article submitted! Check "My Submissions" for updates.');
          }}
        />
      )}
      
      {/* Footer */}
      <footer className="mt-8 pb-6 text-center">
        <p className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/60 dark:text-white/60 max-w-3xl mx-auto px-4">
          <a href="https://wastefull.org" target="_blank" rel="noopener noreferrer" className="hover:text-black dark:hover:text-white transition-colors underline">Wastefull, Inc.</a> is a registered California 501(c)(3) nonprofit organization. Donations to the organization may be tax deductible.
        </p>
      </footer>
      </div>
    </>
  );
}

// Wrapper to pass auth props to MaterialsProvider
function AppWithMaterialsContext() {
  const { user, userRole } = useAuthContext();
  
  return (
    <MaterialsProvider user={user} userRole={userRole}>
      <AppContent />
    </MaterialsProvider>
  );
}

export default function App() {
  return (
    <AccessibilityProvider>
      <AuthProvider>
        <NavigationProvider>
          <Toaster />
          <AppWithMaterialsContext />
          <CookieConsent />
        </NavigationProvider>
      </AuthProvider>
    </AccessibilityProvider>
  );
}