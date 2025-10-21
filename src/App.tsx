import { useState, useEffect } from 'react';
import svgPaths from "./imports/svg-qhqftidoeu";
import { Plus, Edit2, Trash2, Search, ArrowLeft, Upload, Image as ImageIcon, ChevronDown, Copy, Check, Type, Eye, RotateCcw, Moon, Save, X, Download, FileUp, Cloud, CloudOff, LogOut, User } from 'lucide-react';
import * as api from './utils/api';
import { AuthView } from './components/AuthView';
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
import { ScientificDataEditor } from './components/ScientificDataEditor';
import { BatchScientificOperations } from './components/BatchScientificOperations';
import { PublicExportView } from './components/PublicExportView';
import { DataMigrationTool } from './components/DataMigrationTool';
import { SourceLibraryManager } from './components/SourceLibraryManager';
import { AssetUploadManager } from './components/AssetUploadManager';
import { SOURCE_LIBRARY, getSourcesByTag } from './data/sources';
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
  Y_value?: number;  // Yield (recovery rate)
  D_value?: number;  // Degradation (quality loss)
  C_value?: number;  // Contamination tolerance
  M_value?: number;  // Maturity (infrastructure availability)
  E_value?: number;  // Energy demand (normalized)
  
  // Calculated composite recyclability scores
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
  
  // Confidence and provenance
  confidence_level?: 'High' | 'Medium' | 'Low';  // Based on data quality
  sources?: Array<{                               // Citation metadata
    title: string;
    authors?: string;
    year?: number;
    doi?: string;
    url?: string;
    weight?: number;  // Source weight in aggregation
  }>;
  
  // Versioning and audit trail
  whitepaper_version?: string;      // e.g., "2025.1"
  calculation_timestamp?: string;   // ISO 8601 timestamp
  method_version?: string;           // e.g., "CR-v1"
}

type CategoryType = 'compostability' | 'recyclability' | 'reusability';

function AdminModeButton({ currentView, onViewChange }: { currentView: any; onViewChange: (view: any) => void }) {
  const { settings, toggleAdminMode } = useAccessibility();
  
  const handleAdminToggle = () => {
    // If turning off admin mode and currently on admin-only pages, go back to materials
    if (settings.adminMode && (currentView.type === 'data-management' || currentView.type === 'user-management' || currentView.type === 'scientific-editor')) {
      onViewChange({ type: 'materials' });
    }
    toggleAdminMode();
  };

  return (
    <button
      onClick={handleAdminToggle}
      className={`px-2 py-1 rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all font-['Sniglet:Regular',_sans-serif] text-[10px] text-black dark:text-white uppercase ${
        settings.adminMode 
          ? 'bg-[#e4e3ac] shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]' 
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

          <h1 className="basis-0 font-['Sniglet:Regular',_sans-serif] grow leading-[25px] min-h-px min-w-px not-italic relative shrink-0 text-[14px] md:text-[20px] text-black dark:text-white text-left md:text-center uppercase">{title}</h1>
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
                      <div className="flex items-center gap-1 px-2 py-1 bg-white/50 dark:bg-black/20 rounded-md border border-[#211f1c]/20 dark:border-white/20">
                        <User size={12} className="text-black dark:text-white" />
                        <span className="font-['Sniglet:Regular',_sans-serif] text-[10px] text-black dark:text-white max-w-[100px] truncate">
                          {user.name || user.email.split('@')[0]}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-black text-white border-black">
                      <p className="font-['Sniglet:Regular',_sans-serif] text-[11px]">{user.email}</p>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
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
  isAdminModeActive
}: { 
  material: Material; 
  onEdit: () => void; 
  onDelete: () => void;
  onViewArticles: (category: CategoryType) => void;
  onViewMaterial: () => void;
  onEditScientific?: () => void;
  isAdminModeActive?: boolean;
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
          <span className="inline-block px-2 py-0.5 bg-[#b8c8cb] rounded-md border border-[#211f1c] dark:border-white/20 font-['Sniglet:Regular',_sans-serif] text-[9px] text-black">
            {material.category}
          </span>
        </div>
        {isAdminModeActive && (
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
        )}
      </div>
      
      {material.description && (
        <p className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/70 dark:text-white/70 mb-3 line-clamp-2">{material.description}</p>
      )}
      
      <div className="flex flex-col gap-2 mb-3">
        <ScoreBar 
          score={material.compostability} 
          label="Compostability" 
          color="#e6beb5" 
          articleCount={material.articles.compostability.length}
          onClick={() => onViewArticles('compostability')}
        />
        <ScoreBar 
          score={material.recyclability} 
          label="Recyclability" 
          color="#e4e3ac" 
          articleCount={material.articles.recyclability.length}
          onClick={() => onViewArticles('recyclability')}
        />
        <ScoreBar 
          score={material.reusability} 
          label="Reusability" 
          color="#b8c8cb" 
          articleCount={material.articles.reusability.length}
          onClick={() => onViewArticles('reusability')}
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

        <div>
          <label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black block mb-2">
            Compostability: {formData.compostability}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={formData.compostability}
            onChange={(e) => setFormData({ ...formData, compostability: Number(e.target.value) })}
            className="w-full h-2 bg-[#e6beb5] rounded-full outline-none slider"
          />
        </div>

        <div>
          <label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black block mb-2">
            Recyclability: {formData.recyclability}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={formData.recyclability}
            onChange={(e) => setFormData({ ...formData, recyclability: Number(e.target.value) })}
            className="w-full h-2 bg-[#e4e3ac] rounded-full outline-none slider"
          />
        </div>

        <div>
          <label className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black block mb-2">
            Reusability: {formData.reusability}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={formData.reusability}
            onChange={(e) => setFormData({ ...formData, reusability: Number(e.target.value) })}
            className="w-full h-2 bg-[#b8c8cb] rounded-full outline-none slider"
          />
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

      <div className="bg-white rounded-[11.464px] border-[1.5px] border-[#211f1c] p-4 mb-6">
        <h3 className="font-['Sniglet:Regular',_sans-serif] text-[15px] text-black mb-4">Sustainability Scores</h3>
        <div className="flex flex-col gap-3">
          <ScoreBar 
            score={material.compostability} 
            label="Compostability" 
            color="#e6beb5" 
            articleCount={material.articles.compostability.length}
            onClick={() => onViewArticles('compostability')}
          />
          <ScoreBar 
            score={material.recyclability} 
            label="Recyclability" 
            color="#e4e3ac" 
            articleCount={material.articles.recyclability.length}
            onClick={() => onViewArticles('recyclability')}
          />
          <ScoreBar 
            score={material.reusability} 
            label="Reusability" 
            color="#b8c8cb" 
            articleCount={material.articles.reusability.length}
            onClick={() => onViewArticles('reusability')}
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
                th: ({node, ...props}) => <th className="font-['Fredoka_One',_sans-serif] text-[12px] text-black px-3 py-2 text-left border-r border-[#211f1c]/20 last:border-r-0" {...props} />,
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
  onViewMaterial
}: {
  materials: Material[];
  onBack: () => void;
  onUpdateMaterial: (material: Material) => void;
  onUpdateMaterials: (materials: Material[]) => void;
  onBulkImport: (materials: Material[]) => void;
  onDeleteAllData: () => void;
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

      {/* Tabs for Material Management, Batch Operations, Source Library, and Assets */}
      <div className="mb-6">
        <div className="flex gap-2 border-b border-[#211f1c]/20 dark:border-white/20">
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
                        <button
                          onClick={() => handleEdit(material)}
                          className="p-1.5 bg-[#e4e3ac] rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[1px_1px_0px_0px_#000000] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,0.2)] transition-all"
                        >
                          <Edit2 size={12} className="text-black" />
                        </button>
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
      ) : activeTab === 'sources' ? (
        <SourceLibraryManager
          onBack={() => {}} // Empty since we're in a tab
          materials={materials}
        />
      ) : activeTab === 'assets' ? (
        <AssetUploadManager
          accessToken={sessionStorage.getItem('wastedb_access_token')}
        />
      ) : null}
    </div>
  );
}

function AppContent() {
  const { settings, toggleAdminMode } = useAccessibility();
  const [user, setUser] = useState<{ id: string; email: string; name?: string } | null>(null);
  const [userRole, setUserRole] = useState<'user' | 'admin'>('user');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [currentView, setCurrentView] = useState<{ type: 'materials' } | { type: 'articles'; materialId: string; category: CategoryType } | { type: 'all-articles'; category: CategoryType } | { type: 'material-detail'; materialId: string } | { type: 'article-standalone'; articleId: string; materialId: string; category: CategoryType } | { type: 'recyclability-calculation' } | { type: 'methodology-list' } | { type: 'whitepaper'; whitepaperSlug: string } | { type: 'data-management' } | { type: 'user-management' } | { type: 'scientific-editor'; materialId: string } | { type: 'export' }>({ type: 'materials' });
  const [articleToOpen, setArticleToOpen] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('syncing');
  const [supabaseAvailable, setSupabaseAvailable] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true);
  
  // Check if user is authenticated on mount and fetch their role
  useEffect(() => {
    const loadUserAndRole = async () => {
      // Handle magic link callback
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token');
      
      if (accessToken) {
        // Magic link authentication successful
        try {
          api.setAccessToken(accessToken);
          
          // Get user info using the access token
          const role = await api.getUserRole();
          setUserRole(role);
          
          // Extract user info from the URL or make an API call to get it
          // For now, we'll get it from the token - in production you'd decode it properly
          const mockUser = { 
            id: 'magic-link-user', 
            email: urlParams.get('email') || 'user@example.com' 
          };
          setUser(mockUser);
          sessionStorage.setItem('wastedb_user', JSON.stringify(mockUser));
          
          // Clear the URL parameters to avoid confusion
          window.history.replaceState({}, document.title, window.location.pathname);
          
          console.log('Magic link authentication successful');
        } catch (error) {
          console.error('Error processing magic link:', error);
        }
      }
      
      const isAuth = api.isAuthenticated();
      if (isAuth) {
        // Get user info from sessionStorage if available
        const userInfo = sessionStorage.getItem('wastedb_user');
        if (userInfo) {
          setUser(JSON.parse(userInfo));
          
          // Fetch user role
          try {
            const role = await api.getUserRole();
            setUserRole(role);
          } catch (error) {
            console.error('Error fetching user role:', error);
            // If role fetch fails (likely expired session), clear user state
            if (!api.isAuthenticated()) {
              setUser(null);
              setUserRole('user');
              if (settings.adminMode) {
                toggleAdminMode();
              }
            } else {
              setUserRole('user'); // Default to user role on error
            }
          }
        }
      } else {
        // Not authenticated - ensure admin mode is off
        if (settings.adminMode) {
          toggleAdminMode();
        }
      }
    };
    
    loadUserAndRole();
  }, []);

  // Load materials from Supabase (if authenticated), fallback to localStorage
  useEffect(() => {
    const loadMaterials = async () => {
      // Try to load from Supabase first (works for both authenticated and unauthenticated users)
      try {
        const supabaseMaterials = await api.getAllMaterials();
        
        if (supabaseMaterials.length > 0) {
          // Ensure all materials have articles structure and category
          const materialsWithArticles = supabaseMaterials.map((m: any) => ({
            ...m,
            category: m.category || 'Plastics',
            articles: m.articles || {
              compostability: [],
              recyclability: [],
              reusability: []
            }
          }));
          setMaterials(materialsWithArticles);
          // Sync to localStorage as cache
          localStorage.setItem('materials', JSON.stringify(materialsWithArticles));
          if (user) {
            setSyncStatus('synced');
          }
          setSupabaseAvailable(true);
        } else {
          // If Supabase is empty, load from localStorage or initialize sample data
          loadFromLocalStorage();
          if (user) {
            setSyncStatus('synced');
          }
          setSupabaseAvailable(true);
        }
      } catch (error) {
        setSupabaseAvailable(false);
        loadFromLocalStorage();
        if (user) {
          setSyncStatus('offline');
          toast.warning('Working offline - data stored locally only');
        }
      } finally {
        setIsLoadingMaterials(false);
      }
    };

    const loadFromLocalStorage = () => {
      const stored = localStorage.getItem('materials');
      if (stored) {
        try {
          const parsedMaterials = JSON.parse(stored);
          const materialsWithArticles = parsedMaterials.map((m: any) => ({
            ...m,
            category: m.category || 'Plastics',
            articles: m.articles || {
              compostability: [],
              recyclability: [],
              reusability: []
            }
          }));
          setMaterials(materialsWithArticles);
        } catch (e) {
          console.error('Error parsing stored materials:', e);
          initializeSampleData();
        }
      } else {
        initializeSampleData();
      }
    };

    loadMaterials();

    // Check for article permalink in URL
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('article');
    if (articleId) {
      setArticleToOpen(articleId);
    }
  }, [user]);

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

  const handleAuthSuccess = async (userData: { id: string; email: string; name?: string }) => {
    setUser(userData);
    sessionStorage.setItem('wastedb_user', JSON.stringify(userData));
    
    // Fetch user role after successful auth
    try {
      const role = await api.getUserRole();
      setUserRole(role);
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole('user'); // Default to user role on error
    }
  };

  const handleLogout = () => {
    api.signOut();
    setUser(null);
    setUserRole('user');
    sessionStorage.removeItem('wastedb_user');
    setMaterials([]);
    
    // Turn off admin mode when logging out
    if (settings.adminMode) {
      toggleAdminMode();
    }
    
    toast.success('Signed out successfully');
  };

  const initializeSampleData = () => {
    // Get sources from library for initial data
    const cardboardSources = getSourcesByTag('cardboard').slice(0, 4);
    const glassSources = getSourcesByTag('glass').slice(0, 4);
    const petSources = getSourcesByTag('pet').slice(0, 5);
    
    const sampleMaterials: Material[] = [
      {
        id: '1',
        name: 'Cardboard',
        category: 'Paper & Cardboard',
        compostability: 85,
        recyclability: 95,
        reusability: 70,
        description: 'Made from thick paper stock or heavy paper-pulp. Widely used for packaging.',
        // Scientific parameters
        Y_value: 0.82,  // 82% recovery rate
        D_value: 0.15,  // 15% quality loss per cycle (fiber shortening)
        C_value: 0.70,  // Moderate contamination tolerance (sensitive to grease)
        M_value: 0.95,  // Very mature infrastructure
        E_value: 0.25,  // Low energy demand (normalized)
        CR_practical_mean: 0.78,
        CR_theoretical_mean: 0.89,
        CR_practical_CI95: { lower: 0.74, upper: 0.82 },
        CR_theoretical_CI95: { lower: 0.85, upper: 0.93 },
        confidence_level: 'High',
        sources: cardboardSources,
        whitepaper_version: '2025.1',
        calculation_timestamp: new Date().toISOString(),
        method_version: 'CR-v1',
        articles: {
          compostability: [
            {
              id: '1a',
              title: 'Composting Cardboard at Home',
              category: 'DIY',
              overview: {},
              introduction: {
                content: 'Cardboard breaks down easily in compost bins. Remove any tape or labels, shred into smaller pieces, and layer with green materials for best results.',
              },
              supplies: {
                content: '• Cardboard boxes\n• Scissors or shredder\n• Compost bin\n• Brown and green materials',
              },
              step1: {
                content: 'Remove all tape, labels, and any non-cardboard materials from your boxes. Flatten the boxes to make them easier to work with.',
              },
              dateAdded: new Date().toISOString(),
            }
          ],
          recyclability: [],
          reusability: []
        }
      },
      {
        id: '2',
        name: 'Glass',
        category: 'Glass',
        compostability: 0,
        recyclability: 100,
        reusability: 95,
        description: 'Infinitely recyclable without loss of quality. Excellent for reuse.',
        // Scientific parameters
        Y_value: 0.98,  // 98% recovery rate (nearly perfect)
        D_value: 0.01,  // 1% quality loss (essentially none)
        C_value: 0.85,  // High contamination tolerance (can handle some ceramics)
        M_value: 0.92,  // Very mature infrastructure
        E_value: 0.35,  // Moderate energy demand (melting)
        CR_practical_mean: 0.93,
        CR_theoretical_mean: 0.97,
        CR_practical_CI95: { lower: 0.91, upper: 0.95 },
        CR_theoretical_CI95: { lower: 0.95, upper: 0.99 },
        confidence_level: 'High',
        sources: glassSources,
        whitepaper_version: '2025.1',
        calculation_timestamp: new Date().toISOString(),
        method_version: 'CR-v1',
        articles: {
          compostability: [],
          recyclability: [
            {
              id: '2a',
              title: 'Glass Recycling Process',
              category: 'Industrial',
              overview: {},
              introduction: {
                content: 'Glass can be recycled endlessly without loss in quality or purity. It saves raw materials and reduces energy consumption.',
              },
              supplies: {
                content: '• Clean glass containers\n• Recycling bin\n• Access to recycling facility',
              },
              step1: {
                content: 'Rinse all glass containers thoroughly to remove any food residue. Remove lids and caps as they are often made of different materials.',
              },
              dateAdded: new Date().toISOString(),
            }
          ],
          reusability: []
        }
      },
      {
        id: '3',
        name: 'Plastic (PET)',
        category: 'Plastics',
        compostability: 0,
        recyclability: 75,
        reusability: 60,
        description: 'Common plastic type used in bottles and containers.',
        // Scientific parameters
        Y_value: 0.65,  // 65% recovery rate (losses in sorting/washing)
        D_value: 0.25,  // 25% quality loss per cycle (molecular weight reduction)
        C_value: 0.45,  // Low contamination tolerance (food residue issues)
        M_value: 0.75,  // Moderate infrastructure maturity
        E_value: 0.40,  // Moderate-high energy demand
        CR_practical_mean: 0.52,
        CR_theoretical_mean: 0.71,
        CR_practical_CI95: { lower: 0.48, upper: 0.56 },
        CR_theoretical_CI95: { lower: 0.67, upper: 0.75 },
        confidence_level: 'High',
        sources: petSources,
        whitepaper_version: '2025.1',
        calculation_timestamp: new Date().toISOString(),
        method_version: 'CR-v1',
        articles: {
          compostability: [],
          recyclability: [],
          reusability: []
        }
      },
    ];
    saveMaterials(sampleMaterials);
  };

  const saveMaterials = async (newMaterials: Material[]) => {
    setMaterials(newMaterials);
    localStorage.setItem('materials', JSON.stringify(newMaterials));
    
    // Sync to Supabase only if user is authenticated, has admin role, and supabase is available
    if (user && userRole === 'admin' && supabaseAvailable) {
      setSyncStatus('syncing');
      
      // Try syncing with retry logic
      let lastError: any = null;
      const maxRetries = 2;
      const retryDelay = 1000; // 1 second
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          await api.batchSaveMaterials(newMaterials);
          setSyncStatus('synced');
          return; // Success, exit early
        } catch (error) {
          lastError = error;
          
          // If not the last attempt, wait before retrying
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      }
      
      // All retries failed
      setSyncStatus('error');
      setSupabaseAvailable(false);
      toast.error('Failed to sync to cloud - saved locally');
    }
  };

  const retrySync = async () => {
    if (!user) {
      toast.info('Please sign in to sync to cloud');
      return;
    }
    
    if (userRole !== 'admin') {
      toast.info('Only admins can sync data to cloud');
      return;
    }
    
    if (materials.length === 0) {
      toast.info('No data to sync');
      return;
    }
    
    setSyncStatus('syncing');
    try {
      await api.batchSaveMaterials(materials);
      setSyncStatus('synced');
      setSupabaseAvailable(true);
      toast.success('Successfully synced to cloud');
    } catch (error) {
      setSyncStatus('error');
      setSupabaseAvailable(false);
      toast.error('Sync failed - check your connection');
    }
  };

  const handleAddMaterial = (materialData: Omit<Material, 'id'>) => {
    const newMaterial: Material = {
      ...materialData,
      id: Date.now().toString(),
    };
    saveMaterials([...materials, newMaterial]);
    setShowForm(false);
    toast.success(`Added ${materialData.name} successfully`);
  };

  const handleUpdateMaterial = (materialData: Omit<Material, 'id'> | Material) => {
    if ('id' in materialData) {
      // Direct update with full material (from ArticlesView or CSV import)
      const existingIndex = materials.findIndex(m => m.id === materialData.id);
      if (existingIndex >= 0) {
        // Update existing material
        const updated = materials.map(m => m.id === materialData.id ? materialData : m);
        saveMaterials(updated);
        toast.success(`Updated ${materialData.name} successfully`);
      } else {
        // Add new material (e.g., from CSV import)
        saveMaterials([...materials, materialData]);
        toast.success(`Added ${materialData.name} successfully`);
      }
    } else {
      // Update from form (preserves id and articles)
      if (!editingMaterial) return;
      const updated = materials.map(m => 
        m.id === editingMaterial.id 
          ? { ...materialData, id: m.id, articles: m.articles } 
          : m
      );
      saveMaterials(updated);
      setEditingMaterial(null);
      setShowForm(false);
      toast.success(`Updated ${materialData.name} successfully`);
    }
  };

  const handleDeleteMaterial = (id: string) => {
    const material = materials.find(m => m.id === id);
    if (confirm('Are you sure you want to delete this material?')) {
      saveMaterials(materials.filter(m => m.id !== id));
      if (material) {
        toast.success(`Deleted ${material.name} successfully`);
      }
    }
  };

  const handleBulkImport = (newMaterials: Material[]) => {
    saveMaterials([...materials, ...newMaterials]);
  };

  const handleViewArticles = (materialId: string, category: CategoryType) => {
    setCurrentView({ type: 'articles', materialId, category });
  };

  const handleViewMaterial = (materialId: string) => {
    setCurrentView({ type: 'material-detail', materialId });
  };

  const handleViewArticleStandalone = (materialId: string, articleId: string, category: CategoryType) => {
    setCurrentView({ type: 'article-standalone', articleId, materialId, category });
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
        className="min-h-screen p-3 md:p-8 bg-[#faf7f2] dark:bg-[#1a1917]"
        style={{
          backgroundImage: `url("https://www.transparenttextures.com/patterns/3px-tile.png")`,
          backgroundSize: '3px 3px'
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="bg-[#faf7f2] dark:bg-[#2a2825] rounded-[11.464px] border-[1.5px] border-[#211f1c] dark:border-white/20 overflow-hidden mb-6">
            <StatusBar title="WasteDB" currentView={currentView} onViewChange={setCurrentView} syncStatus={syncStatus} user={user} userRole={userRole} onLogout={handleLogout} onSignIn={() => setShowAuthModal(true)} />
          
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
                {/* Left column: Search bar, Add Material button, and Methodology link (vertically centered) */}
                <div className="w-full lg:w-96 flex flex-col justify-center gap-4">
                  <SearchBar value={searchQuery} onChange={setSearchQuery} />
                  {isAdminModeActive && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowForm(true);
                          setEditingMaterial(null);
                        }}
                        className="bg-[#b8c8cb] h-[40px] px-3 rounded-[11.46px] border-[1.5px] border-[#211f1c] shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] dark:border-white/20 font-['Sniglet:Regular',_sans-serif] text-[12px] text-black hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] dark:hover:shadow-[2px_3px_0px_-1px_rgba(255,255,255,0.2)] transition-all flex items-center gap-2"
                      >
                        <Plus size={14} className="text-black" />
                        Add Material
                      </button>
                      <button
                        onClick={() => setCurrentView({ type: 'data-management' })}
                        className="bg-[#e4e3ac] h-[40px] px-3 rounded-[11.46px] border-[1.5px] border-[#211f1c] shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] dark:border-white/20 font-['Sniglet:Regular',_sans-serif] text-[12px] text-black hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] dark:hover:shadow-[2px_3px_0px_-1px_rgba(255,255,255,0.2)] transition-all"
                      >
                        Database Management
                      </button>
                      <button
                        onClick={() => setCurrentView({ type: 'user-management' })}
                        className="bg-[#e6beb5] h-[40px] px-3 rounded-[11.46px] border-[1.5px] border-[#211f1c] shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] dark:border-white/20 font-['Sniglet:Regular',_sans-serif] text-[12px] text-black hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] dark:hover:shadow-[2px_3px_0px_-1px_rgba(255,255,255,0.2)] transition-all"
                      >
                        User Management
                      </button>
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        onClick={() => setCurrentView({ type: 'methodology-list' })}
                        className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:underline transition-colors text-left"
                      >
                        Methodology & Whitepapers
                      </motion.button>
                      {userRole === 'admin' && (
                        <div className="md:hidden">
                          <AdminModeButton currentView={currentView} onViewChange={setCurrentView} />
                        </div>
                      )}
                    </div>
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.35 }}
                      onClick={() => setCurrentView({ type: 'export' })}
                      className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:underline transition-colors text-left flex items-center gap-1"
                    >
                      <Download size={12} />
                      Export Data (Open Access)
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
                      fill: '#e6beb5'
                    },
                    {
                      name: 'Recyclable',
                      shortName: 'recyclable',
                      categoryKey: 'recyclability',
                      value: Math.round(materials.reduce((sum, m) => sum + m.recyclability, 0) / materials.length),
                      articleCount: materials.reduce((sum, m) => sum + m.articles.recyclability.length, 0),
                      fill: '#e4e3ac'
                    },
                    {
                      name: 'Reusable',
                      shortName: 'reusable',
                      categoryKey: 'reusability',
                      value: Math.round(materials.reduce((sum, m) => sum + m.reusability, 0) / materials.length),
                      articleCount: materials.reduce((sum, m) => sum + m.articles.reusability.length, 0),
                      fill: '#b8c8cb'
                    }
                  ];

                  return (
                    <div className="w-full lg:w-[50%]">
                      <AnimatedWasteChart
                        chartData={chartData}
                        onCategoryClick={(categoryKey) => setCurrentView({ type: 'all-articles', category: categoryKey as CategoryType })}
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
                    onEditScientific={() => setCurrentView({ type: 'scientific-editor', materialId: material.id })}
                    isAdminModeActive={isAdminModeActive}
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
              onBack={() => setCurrentView({ type: 'materials' })}
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
              onBack={() => setCurrentView({ type: 'materials' })}
              onViewArticleStandalone={(articleId, materialId) => handleViewArticleStandalone(materialId, articleId, currentView.category)}
            />
          ) : currentMaterial && currentView.type === 'material-detail' ? (
            <MaterialDetailView
              material={currentMaterial}
              onBack={() => setCurrentView({ type: 'materials' })}
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
              onBack={() => setCurrentView({ type: 'material-detail', materialId: currentMaterial.id })}
              onEdit={() => {
                // Navigate back to material detail with edit form open
                setCurrentView({ type: 'material-detail', materialId: currentMaterial.id });
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
                  setCurrentView({ type: 'material-detail', materialId: currentMaterial.id });
                }
              }}
              isAdminModeActive={isAdminModeActive}
            />
          ) : currentView.type === 'methodology-list' ? (
            <MethodologyListView
              onBack={() => setCurrentView({ type: 'materials' })}
              onSelectWhitepaper={(whitepaperSlug) => setCurrentView({ type: 'whitepaper', whitepaperSlug })}
            />
          ) : currentView.type === 'whitepaper' ? (
            <WhitepaperView
              whitepaperSlug={currentView.whitepaperSlug}
              onBack={() => setCurrentView({ type: 'methodology-list' })}
            />
          ) : currentView.type === 'data-management' ? (
            <DataManagementView
              materials={materials}
              onBack={() => setCurrentView({ type: 'materials' })}
              onUpdateMaterial={handleUpdateMaterial}
              onUpdateMaterials={(updatedMaterials) => saveMaterials(updatedMaterials)}
              onBulkImport={handleBulkImport}
              onViewMaterial={(materialId) => setCurrentView({ type: 'material-detail', materialId })}
              onDeleteAllData={async () => {
                setMaterials([]);
                localStorage.removeItem('materials');
                if (supabaseAvailable) {
                  try {
                    await api.deleteAllMaterials();
                    toast.success('All data deleted from cloud and locally');
                  } catch (error) {
                    toast.success('All data deleted locally');
                  }
                } else {
                  toast.success('All data deleted locally');
                }
                setCurrentView({ type: 'materials' });
              }}
            />
          ) : currentView.type === 'user-management' ? (
            <UserManagementView
              onBack={() => setCurrentView({ type: 'materials' })}
              currentUserId={user?.id || ''}
            />
          ) : currentView.type === 'scientific-editor' && currentMaterial ? (
            <ScientificDataEditor
              material={currentMaterial}
              onSave={(updatedMaterial) => {
                handleUpdateMaterial(updatedMaterial);
                setCurrentView({ type: 'materials' });
              }}
              onCancel={() => setCurrentView({ type: 'materials' })}
            />
          ) : currentView.type === 'export' ? (
            <PublicExportView
              onBack={() => setCurrentView({ type: 'materials' })}
              materialsCount={materials.length}
            />
          ) : null}
        </div>
      </div>
      </div>
    </>
  );
}

export default function App() {
  return (
    <AccessibilityProvider>
      <Toaster />
      <AppContent />
    </AccessibilityProvider>
  );
}