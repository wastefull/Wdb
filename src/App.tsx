import { useState, useEffect } from "react";
import {
  Plus,
  ArrowLeft,
  Eye,
  Cloud,
  CloudOff,
  AlertCircle,
  FlaskConical,
} from "lucide-react";
import * as api from "./utils/api";
import { logger, setTestMode, getTestMode, loggerInfo } from "./utils/logger";
import {
  NavigationProvider,
  useNavigationContext,
} from "./contexts/NavigationContext";
import { AuthProvider, useAuthContext } from "./contexts/AuthContext";
import {
  MaterialsProvider,
  useMaterialsContext,
} from "./contexts/MaterialsContext";
import { Material } from "./types/material";
import { CategoryType } from "./types/article";
import {
  getArticlesByCategory,
  getArticleCount,
  removeArticleFromMaterial,
  getTotalArticleCount,
} from "./utils/materialArticles";
import { motion } from "motion/react";
import { toast } from "sonner";

// Views
import {
  AuthView,
  MethodologyListView,
  WhitepaperView,
  UserProfileView,
  LegalHubView,
  ScienceHubView,
  PublicExportView,
  MySubmissionsView,
  LicensesView,
  TakedownStatusView,
  RoadmapView,
  MathView,
  ChartsPerformanceView,
  EvidenceLabView,
  ArticlesView,
  MaterialDetailView,
  AllArticlesView,
  StandaloneArticleView,
  DataManagementView,
} from "./components/views";

// Admin
import {
  UserManagementView,
  ContentReviewCenter,
  AdminTakedownList,
  AuditLogViewer,
  DataRetentionManager,
  AdminDashboard,
  AssetsManagementPage,
} from "./components/admin";

// Forms
import {
  SubmitMaterialForm,
  SuggestMaterialEditForm,
  SubmitArticleForm,
  TakedownRequestForm,
  MaterialForm,
} from "./components/forms";

// Evidence
import {
  SourceLibraryManager,
  SourceDataComparison,
  WhitepaperSyncTool,
  TransformVersionManager,
  TransformFormulaTesting,
  CurationWorkbench,
} from "./components/evidence";

// Charts
import { AnimatedWasteChart } from "./components/charts";

// Shared
import {
  AccessibilityProvider,
  useAccessibility,
  LoadingPlaceholder,
  CookieConsent,
  ApiDocumentation,
  ErrorBoundary,
} from "./components/shared";

// Roadmap
import { SimplifiedRoadmap } from "./components/roadmap";

// Other component groups
import { Toaster } from "./components/ui/sonner";
import { SearchBar } from "./components/search";
import { StatusBar } from "./components/layout";
import { MaterialCard } from "./components/cards";
import { ScientificDataEditor } from "./components/scientific-editor";

function AppContent() {
  const { settings, toggleAdminMode } = useAccessibility();
  const {
    currentView,
    navigateTo,
    navigateToMaterials,
    navigateToSearchResults,
    navigateToMaterialDetail,
    navigateToArticles,
    navigateToArticleDetail,
    navigateToMethodologyList,
    navigateToWhitepaper,
    navigateToAdminDashboard,
    navigateToDataManagement,
    navigateToUserManagement,
    navigateToScientificEditor,
    navigateToExport,
    navigateToUserProfile,
    navigateToMySubmissions,
    navigateToReviewCenter,
    navigateToWhitepaperSync,
    navigateToApiDocs,
    navigateToLicenses,
    navigateToLegalHub,
    navigateToScienceHub,
    navigateToTakedownForm,
    navigateToAdminTakedownList,
    navigateToAuditLog,
    navigateToDataRetention,
    navigateToTransformManager,
    navigateToWhitepapersManagement,
    navigateToAssetsManagement,
    navigateToMathTools,
    navigateToChartsPerformance,
    navigateToRoadmap,
    navigateToRoadmapOverview,
    navigateToSourceLibrary,
    navigateToSourceComparison,
    navigateToEvidenceLab,
    navigateToCurationWorkbench,
    navigateToTransformTesting,
  } = useNavigationContext();
  const { user, userRole, isAuthenticated, signIn, signOut, updateUserRole } =
    useAuthContext();

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

  const [searchQuery, setSearchQuery] = useState("");
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [articleToOpen, setArticleToOpen] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubmitMaterialForm, setShowSubmitMaterialForm] = useState(false);
  const [materialToEdit, setMaterialToEdit] = useState<Material | null>(null);
  const [showSubmitArticleForm, setShowSubmitArticleForm] = useState(false);
  const [showChart, setShowChart] = useState(false);

  // Expose logger to window for browser console debugging
  useEffect(() => {
    if (typeof window !== "undefined") {
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
        logger.log("🪟 Logger exposed to window.wastedbLogger");
        logger.log("   Usage: wastedbLogger.setTestMode(true/false)");
        logger.log("   Info: wastedbLogger.info()");
      }
    }
  }, []);

  // Phase 3A: Log context state for verification
  useEffect(() => {
    logger.log("[Phase 3A] MaterialsContext Status:", {
      materials_count_ctx: materials.length,
      isLoadingMaterials_ctx: isLoadingMaterials,
      syncStatus_ctx: syncStatus,
      supabaseAvailable_ctx: supabaseAvailable,
    });
  }, [materials.length, isLoadingMaterials, syncStatus, supabaseAvailable]);

  // Handle magic link callback (AuthContext handles regular session restoration)
  useEffect(() => {
    const handleMagicLink = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const magicToken = urlParams.get("magic_token");

      if (magicToken) {
        // Verify magic link token and get access token
        logger.log("Detected magic token in URL, verifying...");
        try {
          const response = await api.verifyMagicLink(magicToken);
          logger.log("Magic link verification response:", response);

          if (response.access_token && response.user) {
            // Store access token (already done in verifyMagicLink, but do it again to be sure)
            logger.log(
              "App.tsx: Storing access token again:",
              response.access_token.substring(0, 8) + "..."
            );
            api.setAccessToken(response.access_token);

            // Wait a tiny bit to ensure sessionStorage has committed
            await new Promise((resolve) => setTimeout(resolve, 100));

            // Verify token is stored
            const storedToken = sessionStorage.getItem("wastedb_access_token");
            logger.log(
              "App.tsx: Verified token in storage before getUserRole:",
              storedToken?.substring(0, 8) + "..."
            );

            // Sign in user via context (this will also fetch role)
            await signIn(response.user);

            // Clear the URL parameters to avoid confusion
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname
            );

            logger.log("Magic link authentication successful");
            toast.success(`Welcome back, ${response.user.email}!`);
          } else {
            logger.error("Invalid response structure:", response);
            throw new Error("Invalid magic link response");
          }
        } catch (error) {
          logger.error("Error processing magic link:", error);
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          toast.error(`Magic link verification failed: ${errorMessage}`);
          // Clear the URL parameters
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
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
    const articleId = urlParams.get("article");
    if (articleId) {
      setArticleToOpen(articleId);
    }
  }, []);

  // Navigate to article when articleToOpen is set and materials are loaded
  useEffect(() => {
    if (articleToOpen && materials.length > 0) {
      // Find the article in all materials
      for (const material of materials) {
        if (!material.articles) continue;
        for (const category of [
          "compostability",
          "recyclability",
          "reusability",
        ] as CategoryType[]) {
          const article = material.articles[category].find(
            (a) => a.id === articleToOpen
          );
          if (article) {
            navigateTo({
              type: "article-standalone",
              articleId: articleToOpen,
              materialId: material.id,
              category,
            });
            setArticleToOpen(null);
            // Clear the URL parameter
            window.history.replaceState({}, "", window.location.pathname);
            return;
          }
        }
      }
    }
  }, [articleToOpen, materials, navigateTo]);

  const handleAddMaterial = async (materialData: Omit<Material, "id">) => {
    const newMaterial: Material = {
      ...materialData,
      id: Date.now().toString(),
    };
    await addMaterial(newMaterial);
    setShowForm(false);
    toast.success(`Added ${materialData.name} successfully`);
  };

  const handleUpdateMaterial = async (
    materialData: Omit<Material, "id"> | Material
  ) => {
    if ("id" in materialData) {
      // Direct update with full material (from ArticlesView or CSV import)
      const existingIndex = materials.findIndex(
        (m) => m.id === materialData.id
      );
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
      const updatedMaterial = {
        ...materialData,
        id: editingMaterial.id,
        articles: editingMaterial.articles,
      };
      await updateMaterial(updatedMaterial);
      setEditingMaterial(null);
      setShowForm(false);
      toast.success(`Updated ${materialData.name} successfully`);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    const material = materials.find((m) => m.id === id);
    if (confirm("Are you sure you want to delete this material?")) {
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

  const handleViewArticleStandalone = (
    materialId: string,
    articleId: string,
    category: CategoryType
  ) => {
    navigateTo({ type: "article-standalone", articleId, materialId, category });
  };

  // Auth handlers
  const handleAuthSuccess = async (userData: {
    id: string;
    email: string;
    name?: string;
  }) => {
    await signIn(userData);
  };

  const handleLogout = () => {
    signOut();
    // Ensure admin mode is off
    if (settings.adminMode) {
      toggleAdminMode();
    }
    // Navigate to front page (materials list)
    navigateToMaterials();
  };

  const filteredMaterials = materials.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentMaterial =
    currentView.type === "articles" ||
    currentView.type === "material-detail" ||
    currentView.type === "article-standalone" ||
    currentView.type === "scientific-editor"
      ? materials.find((m) => m.id === currentView.materialId)
      : null;

  // Admin mode is only active if user is authenticated, has admin role, AND has toggled admin mode on
  const isAdminModeActive = !!(
    user &&
    userRole === "admin" &&
    settings.adminMode
  );

  return (
    <>
      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative max-w-md w-full">
            <AuthView
              onAuthSuccess={(userData) => {
                handleAuthSuccess(userData);
                setShowAuthModal(false);
              }}
              onClose={() => setShowAuthModal(false)}
            />
          </div>
        </div>
      )}

      <div
        className="min-h-screen p-3 md:p-8 bg-[#faf7f2] dark:bg-[#2a2825]"
        style={{
          backgroundImage: `url("https://www.transparenttextures.com/patterns/3px-tile.png")`,
          backgroundSize: "3px 3px",
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="bg-[#faf7f2] dark:bg-[#1a1917] rounded-[11.464px] border-[1.5px] border-[#211f1c] dark:border-white/20 overflow-hidden mb-6">
            <StatusBar
              title="WasteDB"
              currentView={currentView}
              onViewChange={navigateTo}
              syncStatus={syncStatus === "idle" ? undefined : syncStatus}
              user={user}
              userRole={userRole}
              onLogout={handleLogout}
              onSignIn={() => setShowAuthModal(true)}
            />

            {currentView.type === "materials" ? (
              <div className="p-6">
                {/* Sync error/offline banner - only show for authenticated users */}
                {user &&
                  (syncStatus === "error" || syncStatus === "offline") && (
                    <div className="mb-4 p-3 bg-[#e6beb5] dark:bg-[#2a2825] border-[1.5px] border-[#211f1c] dark:border-white/20 rounded-[8px] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CloudOff
                          size={16}
                          className="text-black dark:text-white"
                        />
                        <p className="text-[12px] text-black dark:text-white">
                          {syncStatus === "offline"
                            ? "Working offline - data saved locally only"
                            : "Failed to sync to cloud"}
                        </p>
                      </div>
                      <button
                        onClick={retrySync}
                        className="px-3 py-1.5 bg-[#b8c8cb] rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all text-[11px] text-black flex items-center gap-1"
                      >
                        <Cloud size={12} />
                        Retry Sync
                      </button>
                    </div>
                  )}
                {/* Centered content */}
                <div className="flex flex-col items-center justify-center mb-6 max-w-2xl mx-auto px-4">
                  {/* All elements centered in a single column */}
                  <div className="w-full flex flex-col justify-center items-center gap-4">
                    {/* Logo */}
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        navigateTo({ type: "materials" });
                      }}
                      className="transition-transform hover:scale-105"
                      aria-label="Go to home page"
                    >
                      <img
                        src={
                          settings.darkMode
                            ? "https://bdvfwjmaufjeqmxphmtv.supabase.co/storage/v1/object/public/make-17cae920-assets/logo_darkmode-1763068549938.png"
                            : "https://bdvfwjmaufjeqmxphmtv.supabase.co/storage/v1/object/public/make-17cae920-assets/uplogo_transparent-1761169051994.png"
                        }
                        alt="WasteDB Logo"
                        className={
                          settings.darkMode
                            ? "h-52 lg:h-64 w-auto"
                            : "h-36 lg:h-48 w-auto"
                        }
                      />
                    </button>

                    {/* Search bar - centered */}
                    <div className="w-full max-w-xl">
                      <SearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        onSearch={(query) => navigateToSearchResults(query)}
                      />
                    </div>

                    {/* Chart centered below search */}
                    {materials.length > 0 &&
                      currentView.type === "materials" &&
                      (() => {
                        // Show eye icon in admin mode, show chart when clicked
                        if (isAdminModeActive && !showChart) {
                          return (
                            <div className="mt-4 flex items-center justify-center">
                              <button
                                onClick={() => setShowChart(true)}
                                className="p-4 rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 bg-[#e4e3ac] hover:bg-[#e4e3ac]/80 transition-all hover:shadow-[3px_4px_0px_-1px_#000000] dark:hover:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)]"
                                aria-label="Show chart (work in progress)"
                              >
                                <Eye size={32} className="text-black" />
                              </button>
                            </div>
                          );
                        }

                        if (!showChart) return null;

                        // Compute chart data once so we can reference it in the label
                        const chartData = [
                          {
                            name: "Compostable",
                            shortName: "compostable",
                            categoryKey: "compostability",
                            value: Math.round(
                              materials.reduce(
                                (sum, m) => sum + m.compostability,
                                0
                              ) / materials.length
                            ),
                            articleCount: materials.reduce(
                              (sum, m) =>
                                sum + getArticleCount(m, "compostability"),
                              0
                            ),
                            fill: "#e8a593",
                          },
                          {
                            name: "Recyclable",
                            shortName: "recyclable",
                            categoryKey: "recyclability",
                            value: Math.round(
                              materials.reduce(
                                (sum, m) => sum + m.recyclability,
                                0
                              ) / materials.length
                            ),
                            articleCount: materials.reduce(
                              (sum, m) =>
                                sum + getArticleCount(m, "recyclability"),
                              0
                            ),
                            fill: "#f0e68c",
                          },
                          {
                            name: "Reusable",
                            shortName: "reusable",
                            categoryKey: "reusability",
                            value: Math.round(
                              materials.reduce(
                                (sum, m) => sum + m.reusability,
                                0
                              ) / materials.length
                            ),
                            articleCount: materials.reduce(
                              (sum, m) =>
                                sum + getArticleCount(m, "reusability"),
                              0
                            ),
                            fill: "#a8c5d8",
                          },
                        ];

                        return (
                          <div className="mt-6 w-full max-w-md">
                            <AnimatedWasteChart
                              chartData={chartData}
                              onCategoryClick={(categoryKey) =>
                                navigateTo({
                                  type: "all-articles",
                                  category: categoryKey as CategoryType,
                                })
                              }
                            />
                          </div>
                        );
                      })()}
                  </div>
                </div>

                {showForm && (
                  <div className="mb-6">
                    <MaterialForm
                      material={editingMaterial || undefined}
                      onSave={
                        editingMaterial
                          ? handleUpdateMaterial
                          : handleAddMaterial
                      }
                      onCancel={() => {
                        setShowForm(false);
                        setEditingMaterial(null);
                      }}
                    />
                  </div>
                )}

                {/* Welcome message when no search */}
                {isLoadingMaterials ? (
                  <LoadingPlaceholder />
                ) : (
                  <div className="text-center py-12 max-w-2xl mx-auto">
                    {/* Beta contributor message */}
                    <div className="mb-6 px-4">
                      <p className="text-[14px] text-black dark:text-white mb-1">
                        WasteDB is in beta and needs help from contributors like
                        you.
                      </p>
                      <p className="text-[12px] text-black/60 dark:text-white/60">
                        The database currently has{" "}
                        <span className="font-bold">{materials.length}</span>{" "}
                        materials and{" "}
                        <span className="font-bold">
                          {materials.reduce(
                            (sum, m) => sum + getTotalArticleCount(m),
                            0
                          )}
                        </span>{" "}
                        articles.
                      </p>
                    </div>

                    {/* Submit Material button */}
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
                        className={`h-[48px] px-6 rounded-[11.46px] border-[1.5px] border-[#211f1c] shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(100,255,100,0.3)] dark:border-white/20 text-[14px] hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] dark:hover:shadow-[2px_3px_0px_-1px_rgba(100,255,100,0.3)] transition-all inline-flex items-center justify-center gap-2 ${
                          isAdminModeActive
                            ? "arcade-bg-cyan arcade-btn-cyan"
                            : "arcade-bg-green arcade-btn-green"
                        }`}
                        title={
                          isAdminModeActive
                            ? "Add a new material"
                            : "Submit a new material"
                        }
                      >
                        <Plus
                          size={16}
                          className={
                            isAdminModeActive
                              ? "arcade-btn-cyan"
                              : "arcade-btn-green"
                          }
                        />
                        <span>
                          {isAdminModeActive ? "Add" : "Submit"} Material
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : currentView.type === "search-results" ? (
              <div className="p-6">
                {/* Back button and search info */}
                <div className="mb-6 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      navigateToMaterials();
                    }}
                    className="flex items-center gap-2 px-4 py-2 arcade-bg-cyan arcade-btn-cyan rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] dark:hover:shadow-[2px_3px_0px_-1px_rgba(255,255,255,0.2)] transition-all"
                  >
                    <ArrowLeft size={16} />
                    <span className="text-[14px]">Back to Home</span>
                  </button>
                  <div className="text-[14px] text-black dark:text-white">
                    Search results for:{" "}
                    <span className="font-bold">"{currentView.query}"</span>
                  </div>
                </div>

                {/* Filter options placeholder */}
                <div className="retro-card mb-6 p-4">
                  <p className="text-[12px] text-black/50 dark:text-white/50 italic">
                    Filter options coming soon...
                  </p>
                </div>

                {/* Materials grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {materials
                    .filter(
                      (m) =>
                        m.name
                          .toLowerCase()
                          .includes(currentView.query.toLowerCase()) ||
                        m.description
                          ?.toLowerCase()
                          .includes(currentView.query.toLowerCase())
                    )
                    .map((material) => (
                      <MaterialCard
                        key={material.id}
                        material={material}
                        onEdit={() => {
                          setEditingMaterial(material);
                          setShowForm(true);
                        }}
                        onDelete={() => handleDeleteMaterial(material.id)}
                        onViewArticles={(category) =>
                          handleViewArticles(material.id, category)
                        }
                        onViewMaterial={() => handleViewMaterial(material.id)}
                        onEditScientific={() =>
                          navigateToScientificEditor(material.id)
                        }
                        onSuggestEdit={() => setMaterialToEdit(material)}
                        isAdminModeActive={isAdminModeActive}
                        isAuthenticated={!!user}
                      />
                    ))}
                </div>

                {/* No results message */}
                {materials.filter(
                  (m) =>
                    m.name
                      .toLowerCase()
                      .includes(currentView.query.toLowerCase()) ||
                    m.description
                      ?.toLowerCase()
                      .includes(currentView.query.toLowerCase())
                ).length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-[16px] text-black/50 dark:text-white/50">
                      No materials found matching your search.
                    </p>
                  </div>
                )}
              </div>
            ) : currentMaterial && currentView.type === "articles" ? (
              <ArticlesView
                material={currentMaterial}
                category={currentView.category}
                onBack={navigateToMaterials}
                onUpdateMaterial={handleUpdateMaterial}
                onViewArticleStandalone={(articleId) =>
                  handleViewArticleStandalone(
                    currentMaterial.id,
                    articleId,
                    currentView.category
                  )
                }
                isAdminModeActive={isAdminModeActive}
                user={user}
                onSignUp={() => setShowAuthModal(true)}
              />
            ) : currentView.type === "all-articles" ? (
              <AllArticlesView
                category={currentView.category}
                materials={materials}
                onBack={navigateToMaterials}
                onViewArticleStandalone={(articleId, materialId) =>
                  handleViewArticleStandalone(
                    materialId,
                    articleId,
                    currentView.category
                  )
                }
              />
            ) : currentMaterial && currentView.type === "material-detail" ? (
              <MaterialDetailView
                material={currentMaterial}
                onBack={navigateToMaterials}
                onViewArticles={(category) =>
                  handleViewArticles(currentMaterial.id, category)
                }
                onUpdateMaterial={handleUpdateMaterial}
                onViewArticleStandalone={(articleId, category) =>
                  handleViewArticleStandalone(
                    currentMaterial.id,
                    articleId,
                    category
                  )
                }
                isAdminModeActive={isAdminModeActive}
              />
            ) : currentMaterial && currentView.type === "article-standalone" ? (
              <StandaloneArticleView
                article={
                  getArticlesByCategory(
                    currentMaterial,
                    currentView.category
                  ).find((a) => a.id === currentView.articleId)!
                }
                sustainabilityCategory={{
                  label:
                    currentView.category === "compostability"
                      ? "Compostability"
                      : currentView.category === "recyclability"
                      ? "Recyclability"
                      : "Reusability",
                  color:
                    currentView.category === "compostability"
                      ? "#e6beb5"
                      : currentView.category === "recyclability"
                      ? "#e4e3ac"
                      : "#b8c8cb",
                }}
                materialName={currentMaterial.name}
                onBack={() => navigateToMaterialDetail(currentMaterial.id)}
                onEdit={() => {
                  // Navigate back to material detail with edit form open
                  navigateToMaterialDetail(currentMaterial.id);
                }}
                onDelete={() => {
                  if (
                    confirm("Are you sure you want to delete this article?")
                  ) {
                    const updatedMaterial = removeArticleFromMaterial(
                      currentMaterial,
                      currentView.category,
                      currentView.articleId
                    );
                    handleUpdateMaterial(updatedMaterial);
                    navigateToMaterialDetail(currentMaterial.id);
                  }
                }}
                isAdminModeActive={isAdminModeActive}
              />
            ) : currentView.type === "methodology-list" ? (
              <MethodologyListView
                onBack={navigateToScienceHub}
                onSelectWhitepaper={navigateToWhitepaper}
              />
            ) : currentView.type === "whitepaper" ? (
              <WhitepaperView
                whitepaperSlug={currentView.whitepaperSlug}
                onBack={navigateToMethodologyList}
              />
            ) : currentView.type === "admin-dashboard" ? (
              <AdminDashboard
                onBack={navigateToMaterials}
                onNavigateToReviewCenter={navigateToReviewCenter}
                onNavigateToDataManagement={navigateToDataManagement}
                onNavigateToUserManagement={navigateToUserManagement}
                onNavigateToWhitepaperSync={navigateToWhitepaperSync}
                onNavigateToTransformManager={() =>
                  navigateToMathTools("transform-manager")
                }
                onNavigateToAdminTakedownList={navigateToAdminTakedownList}
                onNavigateToAuditLog={navigateToAuditLog}
                onNavigateToDataRetention={navigateToDataRetention}
                onNavigateToWhitepapers={navigateToWhitepapersManagement}
                onNavigateToAssets={navigateToAssetsManagement}
                onNavigateToMath={navigateToMathTools}
                onNavigateToCharts={navigateToChartsPerformance}
                onNavigateToRoadmap={navigateToRoadmap}
                onNavigateToRoadmapOverview={
                  navigateToRoadmapOverview as (section?: string) => void
                }
                onNavigateToSourceLibrary={navigateToSourceLibrary}
                onNavigateToSourceComparison={navigateToSourceComparison}
                onNavigateToEvidenceLab={navigateToEvidenceLab}
                onNavigateToCurationWorkbench={navigateToCurationWorkbench}
                onNavigateToTransformTesting={navigateToTransformTesting}
              />
            ) : currentView.type === "data-management" ? (
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
                  toast.success(
                    supabaseAvailable
                      ? "All data deleted from cloud and locally"
                      : "All data deleted locally"
                  );
                  navigateToMaterials();
                }}
                user={user}
                userRole={userRole}
              />
            ) : currentView.type === "user-management" ? (
              <UserManagementView
                onBack={navigateToMaterials}
                currentUserId={user?.id || ""}
              />
            ) : currentView.type === "whitepaper-sync" ? (
              <WhitepaperSyncTool onBack={navigateToMaterials} />
            ) : currentView.type === "scientific-editor" && currentMaterial ? (
              <ScientificDataEditor
                material={currentMaterial as any}
                onSave={(updatedMaterial) => {
                  handleUpdateMaterial(updatedMaterial as Material);
                  navigateToMaterials();
                }}
                onCancel={navigateToMaterials}
              />
            ) : currentView.type === "export" ? (
              <PublicExportView
                onBack={navigateToScienceHub}
                materialsCount={materials.length}
              />
            ) : currentView.type === "user-profile" ? (
              <UserProfileView
                userId={currentView.userId}
                onBack={navigateToMaterials}
                isOwnProfile={currentView.userId === user?.id}
                onNavigateToMySubmissions={
                  currentView.userId === user?.id
                    ? navigateToMySubmissions
                    : undefined
                }
              />
            ) : currentView.type === "my-submissions" ? (
              <MySubmissionsView onBack={navigateToMaterials} />
            ) : currentView.type === "review-center" ? (
              <ContentReviewCenter
                onBack={navigateToMaterials}
                currentUserId={user?.id || ""}
              />
            ) : currentView.type === "api-docs" ? (
              <ApiDocumentation onBack={navigateToScienceHub} />
            ) : currentView.type === "source-library" ? (
              <SourceLibraryManager
                onBack={navigateToMaterials}
                materials={materials}
                isAuthenticated={!!user}
                isAdmin={userRole === "admin"}
              />
            ) : currentView.type === "source-comparison" ? (
              <SourceDataComparison
                onBack={navigateToMaterials}
                materials={materials}
              />
            ) : currentView.type === "evidence-lab" ? (
              <EvidenceLabView onBack={navigateToAdminDashboard} />
            ) : currentView.type === "curation-workbench" ? (
              <CurationWorkbench onBack={navigateToAdminDashboard} />
            ) : currentView.type === "transform-formula-testing" ? (
              <TransformFormulaTesting
                onBack={navigateToAdminDashboard}
                materials={materials}
              />
            ) : currentView.type === "licenses" ? (
              <LicensesView onBack={navigateToLegalHub} />
            ) : currentView.type === "science-hub" ? (
              <ScienceHubView
                onBack={navigateToMaterials}
                onNavigateToWhitePapers={navigateToMethodologyList}
                onNavigateToOpenAccess={navigateToExport}
                onNavigateToAPI={navigateToApiDocs}
              />
            ) : currentView.type === "legal-hub" ? (
              <LegalHubView
                onBack={navigateToMaterials}
                onNavigateToTakedownForm={navigateToTakedownForm}
                onNavigateToLicenses={navigateToLicenses}
              />
            ) : currentView.type === "takedown-form" ? (
              <TakedownRequestForm onBack={navigateToLegalHub} />
            ) : currentView.type === "takedown-status" ? (
              <div className="p-6">
                <TakedownStatusView requestId={currentView.requestId} />
              </div>
            ) : currentView.type === "admin-takedown-list" ? (
              <div className="p-6">
                <AdminTakedownList />
              </div>
            ) : currentView.type === "audit-log" ? (
              <AuditLogViewer onBack={navigateToAdminDashboard} />
            ) : currentView.type === "data-retention" ? (
              <div className="p-6">
                <DataRetentionManager />
              </div>
            ) : currentView.type === "transform-manager" ? (
              <div className="p-6">
                <TransformVersionManager />
              </div>
            ) : currentView.type === "whitepapers-management" ? (
              <div className="p-6">
                <WhitepaperSyncTool onBack={navigateToAdminDashboard} />
              </div>
            ) : currentView.type === "assets-management" ? (
              <AssetsManagementPage />
            ) : currentView.type === "math-tools" ? (
              <MathView
                onBack={navigateToAdminDashboard}
                defaultTab={currentView.defaultTab}
              />
            ) : currentView.type === "charts-performance" ? (
              <ChartsPerformanceView onBack={navigateToAdminDashboard} />
            ) : currentView.type === "roadmap" ? (
              <RoadmapView onBack={navigateToAdminDashboard} />
            ) : currentView.type === "roadmap-overview" ? (
              <SimplifiedRoadmap
                onBack={navigateToAdminDashboard}
                defaultTab={currentView.defaultTab}
              />
            ) : null}

            {/* Footer - inside rounded container */}
            <div className="p-6">
              <footer className="mt-8 text-center border-t border-[#211f1c]/10 dark:border-white/10 pt-6">
                {/* Science and Legal links */}
                <div className="flex justify-center items-center gap-2 mb-6">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex items-center gap-2"
                  >
                    <button
                      onClick={navigateToScienceHub}
                      className="text-[12px] text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white md:hover:underline transition-colors flex items-center gap-1"
                    >
                      <FlaskConical className="w-5 h-5 md:w-3 md:h-3" />
                      <span className="hidden md:inline">Science</span>
                    </button>
                    <span className="text-black/30 dark:text-white/30">•</span>
                    <button
                      onClick={navigateToLegalHub}
                      className="text-[12px] text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white md:hover:underline transition-colors flex items-center gap-1"
                    >
                      <AlertCircle className="w-5 h-5 md:w-3 md:h-3" />
                      <span className="hidden md:inline">Legal</span>
                    </button>
                  </motion.div>
                </div>

                <p className="text-[11px] md:text-[12px] text-black/60 dark:text-white/60 max-w-3xl mx-auto px-4">
                  <a
                    href="https://wastefull.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-black dark:hover:text-white transition-colors underline"
                  >
                    Wastefull, Inc.
                  </a>{" "}
                  is a registered California 501(c)(3) nonprofit organization.
                  Donations to the organization may be tax deductible.
                </p>
              </footer>
            </div>
          </div>
        </div>

        {/* Submission Forms */}
        {showSubmitMaterialForm && (
          <SubmitMaterialForm
            onClose={() => setShowSubmitMaterialForm(false)}
            onSubmitSuccess={() => {
              // Optionally refresh submissions or show a notification
              toast.success(
                'Material submitted! Check "My Submissions" for updates.'
              );
            }}
          />
        )}

        {materialToEdit && (
          <SuggestMaterialEditForm
            material={materialToEdit}
            onClose={() => setMaterialToEdit(null)}
            onSubmitSuccess={() => {
              toast.success(
                'Edit suggestion submitted! Check "My Submissions" for updates.'
              );
            }}
          />
        )}

        {showSubmitArticleForm && (
          <SubmitArticleForm
            onClose={() => setShowSubmitArticleForm(false)}
            onSubmitSuccess={() => {
              toast.success(
                'Article submitted! Check "My Submissions" for updates.'
              );
            }}
          />
        )}
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
  // Logger is controlled via window.wastedbLogger.setTestMode(true/false)
  // Defaults to FALSE to minimize console noise

  return (
    <ErrorBoundary>
      <AccessibilityProvider>
        <NavigationProvider>
          <AppWithAuth />
        </NavigationProvider>
      </AccessibilityProvider>
    </ErrorBoundary>
  );
}

// Wrapper to provide session expiry callback to AuthProvider
function AppWithAuth() {
  const navigation = useNavigationContext();

  const handleSessionExpired = () => {
    navigation.navigateToAuth();
  };

  return (
    <AuthProvider onSessionExpired={handleSessionExpired}>
      <Toaster />
      <AppWithMaterialsContext />
      <CookieConsent />
    </AuthProvider>
  );
}
