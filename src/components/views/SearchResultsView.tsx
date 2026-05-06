import { useState, useMemo } from "react";
import {
  ArrowLeft,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  ChevronRight,
} from "lucide-react";
import { Material } from "../../types/material";
import { CategoryType } from "../../types/article";
import { MaterialCard } from "../cards";
import { useCategoryContext } from "../../contexts/CategoryContext";

// ── helpers ────────────────────────────────────────────────────────────────
function getAllAliases(m: Material): string[] {
  const curator = m.aliases ?? [];
  const wiki = m.wiki?.aliases ?? [];
  return [...curator, ...wiki].map((a) => a.toLowerCase());
}

/**
 * If `q` matches one of the material's aliases (but NOT the name itself),
 * return the first matching alias in its original casing; otherwise null.
 */
function matchedAlias(m: Material, q: string): string | null {
  if (!q) return null;
  const lower = q.toLowerCase();
  if (m.name.toLowerCase().includes(lower)) return null; // name already matches
  const curatorAliases = m.aliases ?? [];
  const wikiAliases = m.wiki?.aliases ?? [];
  const all = [...curatorAliases, ...wikiAliases];
  return all.find((a) => a.toLowerCase().includes(lower)) ?? null;
}

interface SearchResultsViewProps {
  query: string;
  materials: Material[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onBack: () => void;
  onEditMaterial: (material: Material) => void;
  onDeleteMaterial: (id: string) => void;
  onViewArticles: (materialId: string, category: CategoryType) => void;
  onViewMaterial: (materialId: string) => void;
  onViewCategory: (category: Material["category"]) => void;
  onEditScientific: (materialId: string) => void;
  onSuggestEdit: (material: Material) => void;
  isAdminModeActive: boolean;
  isAuthenticated: boolean;
}

export function SearchResultsView({
  query,
  materials,
  searchQuery,
  setSearchQuery,
  onBack,
  onEditMaterial,
  onDeleteMaterial,
  onViewArticles,
  onViewMaterial,
  onViewCategory,
  onEditScientific,
  onSuggestEdit,
  isAdminModeActive,
  isAuthenticated,
}: SearchResultsViewProps) {
  const queryCategoryFilter = useMemo(() => {
    const match = query.match(/^category\s*:\s*(.+)$/i);
    return match?.[1]?.trim() || null;
  }, [query]);

  const normalizedQueryCategoryFilter = queryCategoryFilter?.toLowerCase();

  const queryHubFilter = useMemo(() => {
    const match = query.match(/^hub\s*:\s*(.+)$/i);
    return match?.[1]?.trim() || null;
  }, [query]);

  const hubMaterial = useMemo(() => {
    if (!queryHubFilter) return null;
    const normalized = queryHubFilter.toLowerCase();
    return materials.find((m) => m.name.toLowerCase() === normalized) ?? null;
  }, [queryHubFilter, materials]);

  const { categories, getCategoryByName } = useCategoryContext();

  // Filter state — holds category IDs (stable slugs)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minCompostability, setMinCompostability] = useState(0);
  const [minRecyclability, setMinRecyclability] = useState(0);
  const [minReusability, setMinReusability] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showScoreFilters, setShowScoreFilters] = useState(false);
  const [sortBy, setSortBy] = useState<
    "name" | "compostability" | "recyclability" | "reusability"
  >("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [betaFeaturesEnabled, setBetaFeaturesEnabled] = useState(false);
  const [hasArticlesOnly, setHasArticlesOnly] = useState(false);

  // Toggle category filter (by category ID/slug)
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((c) => c !== categoryId)
        : [...prev, categoryId],
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedCategories([]);
    setMinCompostability(0);
    setMinRecyclability(0);
    setMinReusability(0);
    setSortBy("name");
    setSortOrder("asc");
  };

  // Check if any filters are active
  const hasActiveFilters =
    selectedCategories.length > 0 ||
    minCompostability > 0 ||
    minRecyclability > 0 ||
    minReusability > 0;

  // Filter and sort materials
  const filteredMaterials = useMemo(() => {
    let result = materials;

    // Text search filter
    if (queryCategoryFilter) {
      result = result.filter(
        (m) => m.category.toLowerCase() === normalizedQueryCategoryFilter,
      );
    } else if (queryHubFilter) {
      const linkedIds = new Set(hubMaterial?.linkedMaterialIds ?? []);
      result = result.filter((m) => linkedIds.has(m.id));
    } else if (query) {
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(query.toLowerCase()) ||
          m.description?.toLowerCase().includes(query.toLowerCase()) ||
          getAllAliases(m).some((a) => a.includes(query.toLowerCase())),
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      result = result.filter((m) => {
        // Prefer stable categoryId; fall back to resolving legacy display name
        const matCatId = m.categoryId ?? getCategoryByName(m.category)?.id;
        return matCatId !== undefined && selectedCategories.includes(matCatId);
      });
    }

    // Score filters
    if (minCompostability > 0) {
      result = result.filter((m) => m.compostability >= minCompostability);
    }
    if (minRecyclability > 0) {
      result = result.filter((m) => m.recyclability >= minRecyclability);
    }
    if (minReusability > 0) {
      result = result.filter((m) => m.reusability >= minReusability);
    }

    // Has articles filter
    if (hasArticlesOnly) {
      result = result.filter((m) => {
        const totalArticles =
          (m.articles?.compostability?.length || 0) +
          (m.articles?.recyclability?.length || 0) +
          (m.articles?.reusability?.length || 0);
        return totalArticles > 0;
      });
    }

    // Sort
    result = [...result].sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      } else {
        comparison = (a[sortBy] || 0) - (b[sortBy] || 0);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [
    materials,
    query,
    queryCategoryFilter,
    normalizedQueryCategoryFilter,
    queryHubFilter,
    hubMaterial,
    selectedCategories,
    minCompostability,
    minRecyclability,
    minReusability,
    hasArticlesOnly,
    sortBy,
    sortOrder,
  ]);

  // Get category counts for filter badges (by category ID)
  const getCategoryCount = (categoryId: string) => {
    return materials.filter((m) => {
      const matchesQuery = queryCategoryFilter
        ? m.category.toLowerCase() === normalizedQueryCategoryFilter
        : !query ||
          m.name.toLowerCase().includes(query.toLowerCase()) ||
          m.description?.toLowerCase().includes(query.toLowerCase());
      const matCatId = m.categoryId ?? getCategoryByName(m.category)?.id;
      return matchesQuery && matCatId === categoryId;
    }).length;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 arcade-bg-cyan arcade-btn-cyan rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] hover:translate-y-px hover:shadow-[2px_3px_0px_-1px_#000000] dark:hover:shadow-[2px_3px_0px_-1px_rgba(255,255,255,0.2)] transition-all"
        >
          <ArrowLeft size={16} />
          <span className="text-[14px]">Back to Home</span>
        </button>
        <div className="text-[14px] normal">
          {queryCategoryFilter ? (
            <>
              Category:{" "}
              <span className="font-bold">"{queryCategoryFilter}"</span>
            </>
          ) : queryHubFilter ? (
            <>
              Linked to: <span className="font-bold">"{queryHubFilter}"</span>
            </>
          ) : query ? (
            <>
              Search results for: <span className="font-bold">"{query}"</span>
            </>
          ) : (
            <span className="font-bold">All Materials</span>
          )}
          <span className="text-black/50 dark:text-white/50 ml-2">
            ({filteredMaterials.length} result
            {filteredMaterials.length !== 1 ? "s" : ""})
          </span>
        </div>
      </div>

      {/* Filters Section */}
      <div className="retro-card mb-6">
        {/* Filter Header */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Filter size={16} />
            <span className="text-[14px] font-medium">Filters</span>
            {hasActiveFilters && (
              <span className="text-[11px] bg-waste-recycle px-2 py-0.5 rounded-full border border-[#211f1c]">
                Active
              </span>
            )}
          </div>
          {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {/* Filter Content */}
        {showFilters && (
          <div className="px-4 pb-4 border-t border-[#211f1c]/20 dark:border-white/10 pt-4">
            {/* Beta Features Toggle */}
            <div className="mb-4 p-3 bg-linear-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl border border-purple-300 dark:border-purple-700">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-purple-800 dark:text-purple-200">
                    Enable BETA Features
                  </span>
                  <span className="text-[9px] bg-waste-science text-black dark:text-white px-1.5 py-0.5 rounded-full font-bold">
                    BETA
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={betaFeaturesEnabled}
                    onChange={(e) => setBetaFeaturesEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                </div>
              </label>
              <p className="text-[10px] text-purple-600 dark:text-purple-300 mt-1">
                Experimental features that may change or be removed
              </p>
            </div>

            {/* Category Filters */}
            <div className="mb-4">
              <button
                onClick={() => setShowCategories(!showCategories)}
                className="w-full flex items-center justify-between mb-2"
              >
                <div className="flex items-center gap-1">
                  <ChevronRight
                    size={14}
                    className={`transition-transform ${
                      showCategories ? "rotate-90" : ""
                    }`}
                  />
                  <span className="text-[12px] text-black/70 dark:text-white/70 font-medium">
                    Categories
                  </span>
                  {selectedCategories.length > 0 && (
                    <span className="text-[10px] bg-waste-recycle px-1.5 py-0.5 rounded-full border border-[#211f1c] ml-1">
                      {selectedCategories.length} selected
                    </span>
                  )}
                </div>
                {selectedCategories.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCategories([]);
                    }}
                    className="text-[11px] text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </button>
              {showCategories && (
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const count = getCategoryCount(cat.id);
                    const isSelected = selectedCategories.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => toggleCategory(cat.id)}
                        disabled={count === 0 && !isSelected}
                        className={`text-[11px] px-3 py-1.5 rounded-full border transition-all ${
                          isSelected
                            ? "bg-waste-recycle border-[#211f1c] shadow-[2px_2px_0px_0px_#000000]"
                            : count > 0
                              ? "bg-white dark:bg-[#2a2825] border-[#211f1c]/30 dark:border-white/20 hover:border-[#211f1c] dark:hover:border-white/40"
                              : "bg-black/5 dark:bg-white/5 border-transparent text-black/30 dark:text-white/30 cursor-not-allowed"
                        }`}
                      >
                        {cat.name}
                        <span className="ml-1 text-black/50 dark:text-white/50">
                          ({count})
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Score Filters - BETA only */}
            {betaFeaturesEnabled && (
              <div className="mb-4">
                <button
                  onClick={() => setShowScoreFilters(!showScoreFilters)}
                  className="w-full flex items-center justify-between mb-2"
                >
                  <div className="flex items-center gap-1">
                    <ChevronRight
                      size={14}
                      className={`transition-transform ${
                        showScoreFilters ? "rotate-90" : ""
                      }`}
                    />
                    <span className="text-[12px] text-black/70 dark:text-white/70 font-medium">
                      Minimum Scores
                    </span>
                    <span className="text-[9px] bg-waste-science text-black dark:text-white px-1.5 py-0.5 rounded-full font-bold ml-1">
                      BETA
                    </span>
                  </div>
                </button>
                {showScoreFilters && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Compostability */}
                    <div>
                      <label className="text-[11px] text-black/60 dark:text-white/60 flex items-center justify-between mb-1">
                        <span className="flex items-center gap-1">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: "#e6beb5" }}
                          />
                          Compostability
                        </span>
                        <span>{minCompostability}%</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={minCompostability}
                        onChange={(e) =>
                          setMinCompostability(parseInt(e.target.value))
                        }
                        className="w-full h-2 bg-[#e6beb5]/30 rounded-lg appearance-none cursor-pointer accent-[#e6beb5]"
                      />
                    </div>
                    {/* Recyclability */}
                    <div>
                      <label className="text-[11px] text-black/60 dark:text-white/60 flex items-center justify-between mb-1">
                        <span className="flex items-center gap-1">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: "#e4e3ac" }}
                          />
                          Recyclability
                        </span>
                        <span>{minRecyclability}%</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={minRecyclability}
                        onChange={(e) =>
                          setMinRecyclability(parseInt(e.target.value))
                        }
                        className="w-full h-2 bg-[#e4e3ac]/30 rounded-lg appearance-none cursor-pointer accent-[#e4e3ac]"
                      />
                    </div>
                    {/* Reusability */}
                    <div>
                      <label className="text-[11px] text-black/60 dark:text-white/60 flex items-center justify-between mb-1">
                        <span className="flex items-center gap-1">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: "#b8c8cb" }}
                          />
                          Reusability
                        </span>
                        <span>{minReusability}%</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={minReusability}
                        onChange={(e) =>
                          setMinReusability(parseInt(e.target.value))
                        }
                        className="w-full h-2 bg-[#b8c8cb]/30 rounded-lg appearance-none cursor-pointer accent-[#b8c8cb]"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-[11px] text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
              >
                <X size={12} />
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Sort Options - Always visible */}
        <div className="flex items-center justify-between p-4 border-t border-[#211f1c]/20 dark:border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-black/60 dark:text-white/60">
              Sort by:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="text-[11px] px-2 py-1 bg-white dark:bg-[#2a2825] border border-[#211f1c]/30 dark:border-white/20 rounded-lg outline-none"
            >
              <option value="name">Name</option>
              <option value="compostability">Compostability</option>
              <option value="recyclability">Recyclability</option>
              <option value="reusability">Reusability</option>
            </select>
            <button
              onClick={() =>
                setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
              }
              className="text-[11px] px-2 py-1 bg-white dark:bg-[#2a2825] border border-[#211f1c]/30 dark:border-white/20 rounded-lg hover:border-[#211f1c] dark:hover:border-white/40 transition-all"
            >
              {sortOrder === "asc" ? "↑ Asc" : "↓ Desc"}
            </button>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-[13px] text-black/70 dark:text-white/70">
              Has articles
            </span>
            <div className="relative">
              <input
                type="checkbox"
                checked={hasArticlesOnly}
                onChange={(e) => setHasArticlesOnly(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-waste-recycle"></div>
            </div>
          </label>
        </div>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMaterials.map((material) => (
          <MaterialCard
            key={material.id}
            material={material}
            onEdit={() => onEditMaterial(material)}
            onDelete={() => onDeleteMaterial(material.id)}
            onViewArticles={(category) => onViewArticles(material.id, category)}
            onViewMaterial={() => onViewMaterial(material.id)}
            onViewCategory={onViewCategory}
            onEditScientific={() => onEditScientific(material.id)}
            onSuggestEdit={() => onSuggestEdit(material)}
            isAdminModeActive={isAdminModeActive}
            isAuthenticated={isAuthenticated}
            showScores={betaFeaturesEnabled}
          />
        ))}
      </div>

      {/* No Results */}
      {filteredMaterials.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[16px] text-black/50 dark:text-white/50 mb-4">
            No materials found matching your criteria.
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-[14px] text-waste-recycle hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
