import { useState } from "react";
import {
  CheckCircle,
  FileText,
  Globe,
  Library,
  Loader2,
  Search,
  Unlock,
  Lock,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Switch } from "../ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import type { CrossRefSearchResult } from "../../utils/api";

type MinimalMaterial = {
  id: string;
  name: string;
};

type MinimalSource = {
  id: string;
  title: string;
  authors?: string;
  year?: number;
  doi?: string;
  citation?: string;
  url?: string;
  pdfFileName?: string;
  is_open_access?: boolean;
  manual_oa_override?: boolean;
};

interface SourceSearchPanelProps {
  title: string;
  description: string;
  defaultTab?: "existing" | "search";
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onSearch: (query?: string) => void;
  searching: boolean;
  results: CrossRefSearchResult[];
  selectedResult: CrossRefSearchResult | null;
  onSelectResult: (result: CrossRefSearchResult) => void;
  onPrimaryAction?: (result: CrossRefSearchResult, isInLibrary: boolean) => void;
  primaryActionLabel?: (isInLibrary: boolean) => string;
  libraryDOIs?: Set<string>;
  existingSources?: MinimalSource[];
  selectedExistingSourceId?: string | null;
  onSelectExistingSource?: (source: MinimalSource) => void;
  filterOpenAccess: boolean;
  onFilterOpenAccessChange: (checked: boolean) => void;
  checkingOABatch?: boolean;
  oaStatusCache?: Map<string, boolean>;
  materials?: MinimalMaterial[];
  showAllMaterials?: boolean;
  onToggleShowAllMaterials?: () => void;
  onQuickSearch?: (query: string) => void;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
}

export function SourceSearchPanel({
  title,
  description,
  defaultTab,
  searchQuery,
  onSearchQueryChange,
  onSearch,
  searching,
  results,
  selectedResult,
  onSelectResult,
  onPrimaryAction,
  primaryActionLabel,
  libraryDOIs,
  existingSources,
  selectedExistingSourceId,
  onSelectExistingSource,
  filterOpenAccess,
  onFilterOpenAccessChange,
  checkingOABatch = false,
  oaStatusCache,
  materials,
  showAllMaterials = false,
  onToggleShowAllMaterials,
  onQuickSearch,
  emptyStateTitle = "Search for Sources",
  emptyStateDescription = "Enter a material name or topic to find relevant academic papers.",
}: SourceSearchPanelProps) {
  const [activeTab, setActiveTab] = useState<"existing" | "search">(
    defaultTab ?? "search",
  );
  const [existingSearchQuery, setExistingSearchQuery] = useState("");

  const filteredExistingSources = (existingSources ?? []).filter((source) => {
    const query = existingSearchQuery.toLowerCase();
    if (!query) return true;

    return (
      source.title.toLowerCase().includes(query) ||
      source.authors?.toLowerCase().includes(query) ||
      source.citation?.toLowerCase().includes(query) ||
      source.doi?.toLowerCase().includes(query)
    );
  });

  const filteredResults = filterOpenAccess
    ? results.filter((result) => oaStatusCache?.get(result.doi.toLowerCase()))
    : results;

  const renderSearchResults = () => {
    if (searching) {
      return (
        <div className="text-center py-12">
          <Loader2 size={32} className="mx-auto mb-3 animate-spin text-black/40 dark:text-white/40" />
          <p className="label-muted">Searching CrossRef...</p>
        </div>
      );
    }

    if (filteredResults.length === 0) {
      if (filterOpenAccess && results.length > 0) {
        return (
          <div className="text-center py-12">
            <CheckCircle size={48} className="mx-auto mb-4 text-black/20 dark:text-white/20" />
            <h4 className="font-['Tilt_Warp'] text-[14px] normal mb-2">
              {checkingOABatch ? "Checking Open Access..." : "No Open Access Results"}
            </h4>
            <p className="label-muted-sm max-w-xs mx-auto">
              {checkingOABatch
                ? `Checking ${results.length} sources...`
                : "None of the results are openly accessible. Try disabling the filter."}
            </p>
          </div>
        );
      }

      return (
        <div className="text-center py-12">
          <Globe size={48} className="mx-auto mb-4 text-black/20 dark:text-white/20" />
          <h4 className="font-['Tilt_Warp'] text-[14px] normal mb-2">{emptyStateTitle}</h4>
          <p className="label-muted-sm max-w-xs mx-auto">{emptyStateDescription}</p>
        </div>
      );
    }

    return filteredResults.map((result, idx) => {
      const isInLibrary = libraryDOIs?.has(result.doi.toLowerCase()) ?? false;
      const isSelected = selectedResult?.doi === result.doi;

      return (
        <div
          key={`${result.doi}-${idx}`}
          role="button"
          tabIndex={0}
          onClick={() => onSelectResult(result)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onSelectResult(result);
            }
          }}
          className={`w-full p-3 rounded-lg border transition-all text-left cursor-pointer ${
            isSelected
              ? "border-[#211f1c] dark:border-white bg-[#e5e4dc] dark:bg-[#3a3835] shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]"
              : isInLibrary
                ? "border-[#a8d5ba] dark:border-[#a8d5ba]/60 bg-[#a8d5ba]/10 dark:bg-[#a8d5ba]/5"
                : "border-[#211f1c]/20 dark:border-white/20 hover:border-[#211f1c]/40 dark:hover:border-white/40"
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-['Sniglet'] text-[12px] normal line-clamp-2 flex-1">
              {result.title}
            </h4>
            <div className="flex gap-1 shrink-0">
              {oaStatusCache?.get(result.doi.toLowerCase()) === true && (
                <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[8px]">
                  <CheckCircle size={10} className="mr-0.5" />
                  OA
                </Badge>
              )}
              {isInLibrary && (
                <Badge className="bg-[#a8d5ba] text-black text-[8px]">
                  <Library size={10} className="mr-1" />
                  In Library
                </Badge>
              )}
            </div>
          </div>

          <p className="label-muted-xs mb-1">
            {result.authors.slice(0, 2).join(", ")}
            {result.authors.length > 2 && " et al."}
          </p>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {result.year && (
                <Badge variant="secondary" className="text-[9px]">
                  {result.year}
                </Badge>
              )}
              {result.journal && (
                <span className="label-muted-xs truncate max-w-37.5">
                  {result.journal}
                </span>
              )}
            </div>

            {onPrimaryAction && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-[10px]"
                onClick={(event) => {
                  event.stopPropagation();
                  onPrimaryAction(result, isInLibrary);
                }}
              >
                {primaryActionLabel
                  ? primaryActionLabel(isInLibrary)
                  : isInLibrary
                    ? "Use"
                    : "Add"}
              </Button>
            )}
          </div>
        </div>
      );
    });
  };

  const renderExistingSources = () => {
    if (!existingSources || existingSources.length === 0) {
      return (
        <div className="text-center py-12">
          <FileText size={48} className="mx-auto mb-4 text-black/20 dark:text-white/20" />
          <h4 className="font-['Tilt_Warp'] text-[14px] normal mb-2">
            No Existing Sources
          </h4>
          <p className="label-muted-sm max-w-xs mx-auto">
            Add verified sources to the library first, then pick them here.
          </p>
        </div>
      );
    }

    if (filteredExistingSources.length === 0) {
      return (
        <div className="text-center py-12">
          <Search size={48} className="mx-auto mb-4 text-black/20 dark:text-white/20" />
          <h4 className="font-['Tilt_Warp'] text-[14px] normal mb-2">
            No Matching Library Sources
          </h4>
          <p className="label-muted-sm max-w-xs mx-auto">
            Try a different title, author, DOI, or citation fragment.
          </p>
        </div>
      );
    }

    return filteredExistingSources.map((source) => {
      const isSelected = selectedExistingSourceId === source.id;

      return (
        <div
          key={source.id}
          role="button"
          tabIndex={0}
          onClick={() => onSelectExistingSource?.(source)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onSelectExistingSource?.(source);
            }
          }}
          className={`w-full p-3 rounded-lg border transition-all text-left cursor-pointer ${
            isSelected
              ? "border-[#211f1c] dark:border-white bg-[#e5e4dc] dark:bg-[#3a3835] shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]"
              : "border-[#211f1c]/20 dark:border-white/20 hover:border-[#211f1c]/40 dark:hover:border-white/40"
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-['Sniglet'] text-[12px] normal line-clamp-2 flex-1">
              {source.title}
            </h4>
            <div className="flex gap-1 shrink-0">
              {source.is_open_access === true && (
                <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[8px]">
                  <Unlock size={10} className="mr-0.5" />
                  OA
                </Badge>
              )}
              {source.is_open_access === false && (
                <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[8px]">
                  <Lock size={10} className="mr-0.5" />
                  Closed
                </Badge>
              )}
            </div>
          </div>

          <p className="label-muted-xs mb-1">
            {source.citation || source.authors || "No citation available"}
          </p>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {source.year && (
                <Badge variant="secondary" className="text-[9px]">
                  {source.year}
                </Badge>
              )}
              {source.pdfFileName && (
                <Badge variant="outline" className="text-[9px]">
                  PDF
                </Badge>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2 text-[10px]"
              onClick={(event) => {
                event.stopPropagation();
                onSelectExistingSource?.(source);
              }}
            >
              Use
            </Button>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-[#2a2825]">
      <div className="p-4 border-b border-[#211f1c]/20 dark:border-white/20">
        <div className="mb-4 rounded-xl border border-[#211f1c]/10 bg-[#e5e4dc] p-3 dark:border-white/10 dark:bg-[#1a1917]">
          <div className="flex items-center gap-2">
            <Globe size={14} />
            <h3 className="font-['Tilt_Warp'] text-[14px] normal">{title}</h3>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-black/60 dark:text-white/60">
            {description}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "existing" | "search")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">Existing</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="mt-0 space-y-3">
            <div>
              <Label className="label-muted-sm mb-1.5 block">
                Filter the library
              </Label>
              <Input
                placeholder="Search by title, author, DOI, or citation"
                value={existingSearchQuery}
                onChange={(event) => setExistingSearchQuery(event.target.value)}
                className="h-9 font-['Sniglet'] text-[12px]"
              />
            </div>
          </TabsContent>

          <TabsContent value="search" className="mt-0 space-y-3">
            <div>
              <Label className="label-muted-sm mb-1.5 block">
                Search by material or topic
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., cardboard biodegradation"
                  value={searchQuery}
                  onChange={(event) => onSearchQueryChange(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && onSearch()}
                  className="h-9 font-['Sniglet'] text-[12px]"
                />
                <Button
                  onClick={() => onSearch()}
                  disabled={searching}
                  size="sm"
                  className="bg-waste-reuse hover:bg-waste-reuse/90 border border-[#211f1c] text-black"
                >
                  {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label className="label-muted-xs flex items-center gap-1.5">
                <CheckCircle size={12} className="text-green-600" />
                Open Access only
              </Label>
              <div className="flex items-center gap-2">
                {checkingOABatch && (
                  <Loader2 size={12} className="animate-spin text-black/40 dark:text-white/40" />
                )}
                <Switch
                  checked={filterOpenAccess}
                  onCheckedChange={onFilterOpenAccessChange}
                />
              </div>
            </div>

            {materials && materials.length > 0 && onQuickSearch && (
              <div>
                <Label className="label-muted-xs mb-1.5 block">
                  Quick search by material:
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {(showAllMaterials ? materials : materials.slice(0, 5)).map((material) => (
                    <button
                      key={material.id}
                      onClick={() => onQuickSearch(material.name)}
                      className="px-2 py-1 text-xs font-['Sniglet'] bg-[#e5e4dc] dark:bg-[#1a1917] border border-[#211f1c]/20 dark:border-white/20 rounded-md hover:border-[#211f1c]/40 dark:hover:border-white/40 transition-colors"
                    >
                      {material.name}
                    </button>
                  ))}
                  {materials.length > 5 && onToggleShowAllMaterials && (
                    <button
                      onClick={onToggleShowAllMaterials}
                      className="px-2 py-1 text-xs font-['Sniglet'] bg-waste-reuse dark:bg-[#3a3835] border border-[#211f1c]/20 dark:border-white/20 rounded-md hover:border-[#211f1c]/40 dark:hover:border-white/40 transition-colors"
                    >
                      {showAllMaterials ? "Show less" : `+${materials.length - 5} more`}
                    </button>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {activeTab === "existing" ? renderExistingSources() : renderSearchResults()}
        </div>
      </ScrollArea>
    </div>
  );
}
