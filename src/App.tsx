import { useState, useEffect, useRef, useMemo, type ReactNode } from "react";

import * as api from "./utils/api";
import { logger, setTestMode, getTestMode, loggerInfo } from "./utils/logger";
import { loadAndApplyCategoryColors } from "./utils/categoryColors";
import {
  getSuppressedScopes,
  materialsLogger,
  enableScope,
  disableScope,
} from "./utils/loggerFactories";
import {
  NavigationProvider,
  getAdminHomeViewByRole,
  useNavigationContext,
} from "./contexts/NavigationContext";
import { AuthProvider, useAuthContext } from "./contexts/AuthContext";
import { CategoryProvider } from "./contexts/CategoryContext";
import {
  MaterialsProvider,
  useMaterialsContext,
} from "./contexts/MaterialsContext";
import { Material } from "./types/material";
import { CategoryType } from "./types/article";
import {
  getArticlesByCategory,
  removeArticleFromMaterial,
  updateArticleInMaterial,
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
  PrivacyPolicyView,
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
  GuidesView,
  GuideDetailView,
  BlogView,
  AboutView,
  DonateView,
  SearchResultsView,
} from "./components/views";
import EditorTestView from "./components/views/EditorTestView";

// Admin
import {
  UserManagementView,
  ContentReviewCenter,
  AdminTakedownList,
  AuditLogViewer,
  DataRetentionManager,
  AdminDashboard,
  StaffDashboard,
  AssetsManagementPage,
  RolePermissionsView,
  CategoryColorsView,
  CategoriesView,
} from "./components/admin";

// Forms
import {
  SubmitMaterialForm,
  SuggestMaterialEditForm,
  SubmitArticleForm,
  TakedownRequestForm,
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

// Shared
import {
  AccessibilityProvider,
  useAccessibility,
  LoadingPlaceholder,
  CookieConsent,
  ApiDocumentation,
  ErrorBoundary,
  FrontPage,
  NavTabBar,
  OfflineNoticeBox,
  LogoLink,
  MaterialsDonutChart,
  PageFooter,
  PermalinkSelectionPrompt,
  ScrollHintArrow,
  ViewConfiguration,
  Welcome,
  type ViewRendererMap,
} from "./components/shared";

// Roadmap
import { SimplifiedRoadmap } from "./components/roadmap";

// Other component groups
import { Toaster } from "./components/ui/sonner";
import { Leaderboard } from "./components/ui/Leaderboard";
import { LeftPanel } from "./components/shared";
import { SearchBar } from "./components/search";
import type { SearchSuggestion } from "./components/search/SearchBar";
import { StatusBar } from "./components/layout";
import { ScientificDataEditor } from "./components/scientific-editor";
import {
  buildMaterialArticlePermalinkPath,
  buildMaterialPermalinkPath,
  findMaterialByPermalink,
  findMaterialCandidatesByPermalink,
  parseMaterialPermalinkPath,
  ParsedMaterialPermalink,
} from "./utils/permalinks";

function AppContent() {
  const { settings, toggleAdminMode } = useAccessibility();
  const {
    currentView,
    goBack,
    navigateTo,
    navigateToMaterials,
    navigateToSearchResults,
    navigateToMaterialDetail,
    navigateToArticles,
    navigateToArticleDetail,
    navigateToMethodologyList,
    navigateToWhitepaper,
    navigateToAdminDashboard,
    navigateToStaffDashboard,
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
    navigateToPrivacyPolicy,
    navigateToScienceHub,
    navigateToTakedownForm,
    navigateToAdminTakedownList,
    navigateToAuditLog,
    navigateToDataRetention,
    navigateToTransformManager,
    navigateToWhitepapersManagement,
    navigateToAssetsManagement,
    navigateToRolePermissions,
    navigateToCategoryColors,
    navigateToCategoriesManagement,
    navigateToMathTools,
    navigateToChartsPerformance,
    navigateToRoadmap,
    navigateToRoadmapOverview,
    navigateToSourceLibrary,
    navigateToSourceComparison,
    navigateToEvidenceLab,
    navigateToCurationWorkbench,
    navigateToTransformTesting,
    navigateToGuides,
    navigateToBlog,
    navigateToAbout,
    navigateToDonate,
  } = useNavigationContext();
  const { user, userRole, isAuthenticated, signIn, signOut, updateUserRole } =
    useAuthContext();

  // MaterialsContext is the single source of truth for all material data
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
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [articleToOpen, setArticleToOpen] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubmitMaterialForm, setShowSubmitMaterialForm] = useState(false);
  const [submitMaterialInitialName, setSubmitMaterialInitialName] =
    useState("");
  const [materialToEdit, setMaterialToEdit] = useState<Material | null>(null);
  const [showSubmitArticleForm, setShowSubmitArticleForm] = useState(false);
  const [permalinkDisambiguateCandidates, setPermalinkDisambiguateCandidates] =
    useState<Material[] | null>(null);
  const [pendingMaterialPermalink, setPendingMaterialPermalink] =
    useState<ParsedMaterialPermalink | null>(null);
  const hasResolvedMaterialPermalinkRef = useRef(false);
  const hasProcessedAuthCallbackRef = useRef(false);

  // Mobile leaderboard scroll reveal
  const [leaderboardVisible, setLeaderboardVisible] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(true);
  const leaderboardRef = useRef<HTMLDivElement>(null);

  // Intersection observer for leaderboard reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setLeaderboardVisible(true);
            setShowScrollHint(false);
          }
        });
      },
      { threshold: 0.1 },
    );

    if (leaderboardRef.current) {
      observer.observe(leaderboardRef.current);
    }

    return () => observer.disconnect();
  }, []);

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
        getSuppressedScopes,
        enableScope,
        disableScope,
      };

      // Log initialization only if in test mode
      if (getTestMode()) {
        logger.log("🪟 Logger exposed to window.wastedbLogger");
        logger.log("   Usage: wastedbLogger.setTestMode(true/false)");
        logger.log("   Info: wastedbLogger.info()");
      }
    }
  }, []);

  // Load site-wide category colors from Supabase on startup
  useEffect(() => {
    loadAndApplyCategoryColors();
  }, []);

  // Phase 3A: Log context state for verification
  useEffect(() => {
    materialsLogger.log("MaterialsContext Status:", {
      materials_count_ctx: materials.length,
      isLoadingMaterials_ctx: isLoadingMaterials,
      syncStatus_ctx: syncStatus,
      supabaseAvailable_ctx: supabaseAvailable,
    });
  }, [materials.length, isLoadingMaterials, syncStatus, supabaseAvailable]);

  // Handle auth callbacks (magic link and Google OAuth)
  useEffect(() => {
    const handleAuthCallbacks = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const magicToken = urlParams.get("magic_token");
      const oauthProvider = urlParams.get("oauth_provider");
      const hasOAuthCode = urlParams.has("code");

      const hasAuthCallbackParams =
        !!magicToken || oauthProvider === "google" || hasOAuthCode;

      if (!hasAuthCallbackParams) {
        return;
      }

      // Prevent duplicate processing when this effect reruns during callback handling.
      if (hasProcessedAuthCallbackRef.current) {
        logger.log("Auth callback already processed - skipping duplicate run");
        return;
      }
      hasProcessedAuthCallbackRef.current = true;

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
              response.access_token.substring(0, 8) + "...",
            );
            api.setAccessToken(response.access_token);

            // Wait a tiny bit to ensure sessionStorage has committed
            await new Promise((resolve) => setTimeout(resolve, 100));

            // Verify token is stored
            const storedToken = sessionStorage.getItem("wastedb_access_token");
            logger.log(
              "App.tsx: Verified token in storage before getUserRole:",
              storedToken?.substring(0, 8) + "...",
            );

            // Sign in user via context (this will also fetch role)
            await signIn(response.user);

            // Clear the URL parameters to avoid confusion
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname,
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
            window.location.pathname,
          );
        }
        return;
      }

      // Supabase OAuth callback flow: exchange OAuth session for WasteDB session token.
      if (oauthProvider === "google" || hasOAuthCode) {
        logger.log("Detected Google OAuth callback, exchanging session...");
        try {
          const response =
            await api.exchangeSupabaseSessionForWasteDBSession("google");

          if (response.access_token && response.user) {
            await signIn(response.user);

            window.history.replaceState(
              {},
              document.title,
              window.location.pathname,
            );

            logger.log("Google OAuth authentication successful");
            toast.success(`Welcome back, ${response.user.email}!`);
          } else {
            throw new Error("Invalid OAuth exchange response");
          }
        } catch (error) {
          logger.error("Error processing Google OAuth callback:", error);
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          toast.error(`Google sign-in failed: ${errorMessage}`);
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );
        }
      }
    };

    handleAuthCallbacks();
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
    const parsedMaterialPermalink = parseMaterialPermalinkPath(
      window.location.pathname,
    );

    if (parsedMaterialPermalink) {
      setPendingMaterialPermalink(parsedMaterialPermalink);
    }

    if (articleId) {
      setArticleToOpen(articleId);
    }
  }, []);

  // Resolve a material permalink from the path once materials are loaded.
  useEffect(() => {
    if (hasResolvedMaterialPermalinkRef.current || !pendingMaterialPermalink) {
      return;
    }

    if (isLoadingMaterials) {
      return;
    }

    const matchedMaterial = findMaterialByPermalink(
      materials,
      pendingMaterialPermalink,
    );

    if (matchedMaterial) {
      let canonicalPath = buildMaterialPermalinkPath(matchedMaterial);

      if (pendingMaterialPermalink.articleId) {
        const articleEntry = (
          ["compostability", "recyclability", "reusability"] as CategoryType[]
        )
          .map((category) => ({
            category,
            article: matchedMaterial.articles?.[category]?.find(
              (a) => a.id === pendingMaterialPermalink.articleId,
            ),
          }))
          .find((entry) => entry.article);

        if (articleEntry?.article) {
          navigateTo({
            type: "article-standalone",
            articleId: articleEntry.article.id,
            materialId: matchedMaterial.id,
            category: articleEntry.category,
          });
          canonicalPath = buildMaterialArticlePermalinkPath(
            matchedMaterial,
            articleEntry.article.id,
          );
        } else {
          navigateToMaterialDetail(matchedMaterial.id);
        }
      } else {
        navigateToMaterialDetail(matchedMaterial.id);
      }

      if (window.location.pathname !== canonicalPath) {
        window.history.replaceState(
          {},
          "",
          `${canonicalPath}${window.location.search}${window.location.hash}`,
        );
      }
    } else {
      // Check if multiple materials match — show disambiguation picker
      // rather than a dead-end error.
      const candidates = findMaterialCandidatesByPermalink(
        materials,
        pendingMaterialPermalink,
      );
      if (candidates.length > 1) {
        navigateToMaterials();
        window.history.replaceState(
          {},
          "",
          `/${window.location.search}${window.location.hash}`,
        );
        setPermalinkDisambiguateCandidates(candidates);
      } else {
        toast.error("Material permalink not found");
        navigateToMaterials();
        window.history.replaceState(
          {},
          "",
          `/${window.location.search}${window.location.hash}`,
        );
      }
    }

    hasResolvedMaterialPermalinkRef.current = true;
  }, [
    isLoadingMaterials,
    materials,
    pendingMaterialPermalink,
    navigateToMaterialDetail,
    navigateToMaterials,
  ]);

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
            (a) => a.id === articleToOpen,
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

  const handleAddMaterial = async (
    materialData: Omit<Material, "id">,
    options?: { onBehalfOf?: string },
  ) => {
    const newMaterial: Material = {
      ...materialData,
      id: Date.now().toString(),
    };
    await addMaterial(newMaterial, options);
    setShowForm(false);
    toast.success(`Added ${materialData.name} successfully`);
  };

  const handleUpdateMaterial = async (
    materialData: Omit<Material, "id"> | Material,
  ) => {
    if ("id" in materialData) {
      // Direct update with full material (from ArticlesView or CSV import)
      const existingIndex = materials.findIndex(
        (m) => m.id === materialData.id,
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

  const handleViewCategoryMaterials = (category: Material["category"]) => {
    navigateToSearchResults(`category:${category}`);
  };

  const handleViewArticleStandalone = (
    materialId: string,
    articleId: string,
    category: CategoryType,
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

  // Wait briefly before showing the create-material CTA so it doesn't flash while typing.
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 450);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  const filteredMaterials = materials.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.description?.toLowerCase().includes(q) ||
      m.aliases?.some((a) => a.toLowerCase().includes(q)) ||
      m.wiki?.aliases?.some((a) => a.toLowerCase().includes(q))
    );
  });

  const materialSearchSuggestions = useMemo<SearchSuggestion[]>(() => {
    const rawQuery = searchQuery.trim();
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const normalizedDebouncedQuery = debouncedSearchQuery.trim().toLowerCase();
    const adminModeInEffect = !!(
      user &&
      userRole === "admin" &&
      settings.adminMode
    );

    if (!normalizedQuery) {
      return [];
    }

    const hasExactNameMatch = materials.some(
      (material) =>
        (material.name || "").trim().toLowerCase() === normalizedQuery,
    );

    const scored = materials
      .map((material) => {
        const name = material.name || "";
        const category = material.category || "";
        const description = material.description || "";
        const normalizedName = name.toLowerCase();
        const normalizedCategory = category.toLowerCase();
        const normalizedDescription = description.toLowerCase();

        let score = -1;

        if (normalizedName === normalizedQuery) {
          score = 120;
        } else if (normalizedName.startsWith(normalizedQuery)) {
          score = 100;
        } else if (normalizedName.includes(` ${normalizedQuery}`)) {
          score = 85;
        } else if (normalizedName.includes(normalizedQuery)) {
          score = 75;
        } else if (normalizedCategory.includes(normalizedQuery)) {
          score = 45;
        } else if (normalizedDescription.includes(normalizedQuery)) {
          score = 35;
        }

        if (score < 0) {
          // No name/category/description match — check aliases
          const allAliases = [
            ...(material.aliases ?? []),
            ...(material.wiki?.aliases ?? []),
          ];
          const matchingAlias = allAliases.find((a) =>
            a.toLowerCase().includes(normalizedQuery),
          );
          if (matchingAlias) {
            return {
              value: `${matchingAlias} (alias for ${name})`,
              subtitle: category,
              score: 60,
              onSelect: () => {
                setSearchQuery(name);
                navigateToSearchResults(name);
              },
            };
          }
          return null;
        }

        return {
          value: name,
          subtitle: category,
          score,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => !!entry)
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return a.value.localeCompare(b.value);
      });

    const deduped = new Map<string, SearchSuggestion>();
    const maxBaseSuggestions = hasExactNameMatch ? 8 : 7;

    for (const entry of scored) {
      const dedupeKey = entry.value.toLowerCase();
      if (!deduped.has(dedupeKey)) {
        deduped.set(dedupeKey, {
          value: entry.value,
          subtitle: entry.subtitle,
          onSelect: entry.onSelect,
        });
      }
      if (deduped.size >= maxBaseSuggestions) {
        break;
      }
    }

    const suggestions = Array.from(deduped.values());

    // Separate alias suggestions (have onSelect) from name suggestions so they
    // can be inserted just above the "Create" entry at the bottom.
    const nameSuggestions = suggestions.filter((s) => !s.onSelect);
    const aliasSuggestions = suggestions.filter((s) => s.onSelect);

    const hasTypingPaused = normalizedDebouncedQuery === normalizedQuery;

    if (!hasExactNameMatch && rawQuery && hasTypingPaused) {
      nameSuggestions.push(...aliasSuggestions);
      nameSuggestions.push({
        value: `Create "${rawQuery}"`,
        subtitle: user
          ? adminModeInEffect
            ? "Create material"
            : "Suggest new material for the database"
          : "Sign in to add new materials",
        onSelect: () => {
          if (!user) {
            setShowAuthModal(true);
            toast.message("Sign in to submit new materials.");
            return;
          }

          if (adminModeInEffect) {
            setEditingMaterial(null);
            setShowForm(true);
            return;
          }

          setSubmitMaterialInitialName(rawQuery);
          setShowSubmitMaterialForm(true);
        },
      });
    } else {
      nameSuggestions.push(...aliasSuggestions);
    }

    return nameSuggestions;
  }, [
    debouncedSearchQuery,
    materials,
    searchQuery,
    settings.adminMode,
    user,
    userRole,
  ]);

  const currentMaterial =
    currentView.type === "articles" ||
    currentView.type === "material-detail" ||
    currentView.type === "article-standalone" ||
    currentView.type === "scientific-editor"
      ? materials.find((m) => m.id === currentView.materialId)
      : null;

  const currentArticle =
    currentView.type === "article-standalone" && currentMaterial
      ? getArticlesByCategory(currentMaterial, currentView.category).find(
          (a) => a.id === currentView.articleId,
        )
      : null;

  // Keep the browser URL in sync with material-focused views.
  useEffect(() => {
    let targetPath: string | null = null;

    if (currentMaterial) {
      if (currentView.type === "article-standalone" && currentArticle) {
        targetPath = buildMaterialArticlePermalinkPath(
          currentMaterial,
          currentArticle.id,
        );
      } else {
        targetPath = buildMaterialPermalinkPath(currentMaterial);
      }
    } else if (parseMaterialPermalinkPath(window.location.pathname)) {
      targetPath = "/";
    }

    if (targetPath && window.location.pathname !== targetPath) {
      window.history.replaceState(
        {},
        "",
        `${targetPath}${window.location.search}${window.location.hash}`,
      );
    }
  }, [currentMaterial, currentArticle, currentView.type]);

  // Admin mode is only active if user is authenticated, has admin role, AND has toggled admin mode on
  const isAdminModeActive = !!(
    user &&
    userRole === "admin" &&
    settings.adminMode
  );
  const showLeaderboardPanel =
    currentView.type === "materials" || currentView.type === "user-profile";
  // const showLeftPanel = currentView.type === "materials";
  const showLeftPanel = false; // TODO
  const navigateToAdminHome = () => {
    navigateTo(getAdminHomeViewByRole(userRole));
  };

  const authModalOuterDivClasses =
    "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4";
  const authModalInnerDivClasses = "relative max-w-md w-full";
  const authModalBackgroundClasses =
    "min-h-screen p-3 md:p-8 bg-[#faf7f2] dark:bg-[#2a2825] textured";

  const viewConfigurations: ViewRendererMap = {
    "permalink-loading": () => (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#211f1c] dark:border-white/60 border-t-transparent mx-auto mb-4" />
          <p className="text-sm text-[#211f1c]/60 dark:text-white/50">
            Loading article…
          </p>
        </div>
      </div>
    ),
    materials: () => (
      <FrontPage
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        suggestions={materialSearchSuggestions}
        showForm={showForm}
        setShowForm={setShowForm}
        editingMaterial={editingMaterial}
        setEditingMaterial={setEditingMaterial}
        onAddMaterial={handleAddMaterial}
        onUpdateMaterial={handleUpdateMaterial}
      />
    ),
    "search-results": (view) => (
      <SearchResultsView
        query={view.query}
        materials={materials}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onBack={() => {
          setSearchQuery("");
          goBack();
        }}
        onEditMaterial={setMaterialToEdit}
        onDeleteMaterial={handleDeleteMaterial}
        onViewArticles={handleViewArticles}
        onViewMaterial={handleViewMaterial}
        onViewCategory={handleViewCategoryMaterials}
        onEditScientific={(materialId) =>
          navigateToScientificEditor(materialId)
        }
        onSuggestEdit={setMaterialToEdit}
        isAdminModeActive={isAdminModeActive}
        isAuthenticated={!!user}
      />
    ),
    articles: (view) => {
      const material = materials.find((m) => m.id === view.materialId);
      if (!material) return null;
      return (
        <ArticlesView
          material={material}
          category={view.category}
          onBack={goBack}
          onUpdateMaterial={handleUpdateMaterial}
          onViewArticleStandalone={(articleId) =>
            handleViewArticleStandalone(material.id, articleId, view.category)
          }
          isAdminModeActive={isAdminModeActive}
          userRole={userRole}
          user={user}
          onSignUp={() => setShowAuthModal(true)}
        />
      );
    },
    "all-articles": (view) => (
      <AllArticlesView
        category={view.category}
        articleType={view.articleType}
        materials={materials}
        onBack={goBack}
        onViewArticleStandalone={(articleId, materialId, category) =>
          handleViewArticleStandalone(materialId, articleId, category)
        }
      />
    ),
    "material-detail": (view) => {
      const material = materials.find((m) => m.id === view.materialId);
      if (!material) return null;
      return (
        <MaterialDetailView
          material={material}
          allMaterials={materials}
          onBack={goBack}
          onViewCategoryMaterials={handleViewCategoryMaterials}
          onUpdateMaterial={handleUpdateMaterial}
          onViewArticleStandalone={(articleId, category) =>
            handleViewArticleStandalone(material.id, articleId, category)
          }
          isAdminModeActive={isAdminModeActive}
          isAuthenticated={!!user}
          currentUserId={user?.id}
          onEditMaterial={setMaterialToEdit}
          onSuggestEdit={setMaterialToEdit}
          onViewArticles={(category) =>
            handleViewArticles(material.id, category)
          }
        />
      );
    },
    "article-standalone": (view) => {
      const material = materials.find((m) => m.id === view.materialId);
      if (!material) return null;
      const article = getArticlesByCategory(material, view.category).find(
        (a) => a.id === view.articleId,
      );
      if (!article) return null;

      const isArticleAuthor = !!(
        user?.id &&
        (article.created_by === user.id || article.author_id === user.id)
      );
      const canManageArticle = isAdminModeActive || isArticleAuthor;

      return (
        <StandaloneArticleView
          article={article}
          sustainabilityCategory={{
            label:
              view.category === "compostability"
                ? "Compostability"
                : view.category === "recyclability"
                  ? "Recyclability"
                  : "Reusability",
            color:
              view.category === "compostability"
                ? "#e6beb5"
                : view.category === "recyclability"
                  ? "#e4e3ac"
                  : "#b8c8cb",
          }}
          materialName={material.name}
          materialId={material.id}
          onBack={goBack}
          onSaveEdit={
            canManageArticle
              ? async (updated) => {
                  if (isAdminModeActive) {
                    const updatedMaterial = updateArticleInMaterial(
                      material,
                      view.category,
                      view.articleId,
                      (a) => ({
                        ...updated,
                        id: a.id,
                        dateAdded: a.dateAdded,
                        updated_at: new Date().toISOString(),
                      }),
                    );
                    handleUpdateMaterial(updatedMaterial);
                    return;
                  }

                  const changeReason = prompt(
                    "Briefly explain your suggested article changes (required):",
                  );
                  if (!changeReason?.trim()) {
                    toast.error(
                      "A reason is required to submit an edit request",
                    );
                    return;
                  }

                  try {
                    await api.createSubmission({
                      type: "update_article",
                      original_content_id: view.articleId,
                      content_data: {
                        ...updated,
                        article_id: view.articleId,
                        material_id: material.id,
                        category: view.category,
                        change_reason: changeReason.trim(),
                      },
                    });
                    toast.success(
                      "Edit suggestion submitted for admin review.",
                    );
                  } catch {
                    toast.error("Failed to submit edit suggestion");
                  }
                }
              : undefined
          }
          onDelete={
            canManageArticle
              ? async () => {
                  const updatedMaterial = removeArticleFromMaterial(
                    material,
                    view.category,
                    view.articleId,
                  );
                  handleUpdateMaterial(updatedMaterial);
                  navigateToMaterialDetail(material.id);
                  toast.success("Article deleted");
                }
              : undefined
          }
          isAdminModeActive={isAdminModeActive}
          canManageArticle={canManageArticle}
        />
      );
    },
    "methodology-list": () => (
      <MethodologyListView
        onBack={goBack}
        onSelectWhitepaper={navigateToWhitepaper}
      />
    ),
    whitepaper: (view) => (
      <WhitepaperView whitepaperSlug={view.whitepaperSlug} onBack={goBack} />
    ),
    "admin-dashboard": () => (
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
        onNavigateToRolePermissions={navigateToRolePermissions}
        onNavigateToCategoryColors={navigateToCategoryColors}
        onNavigateToCategoriesManagement={navigateToCategoriesManagement}
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
    ),
    "staff-dashboard": () => (
      <StaffDashboard
        onBack={navigateToMaterials}
        onNavigateToDataManagement={navigateToDataManagement}
        onNavigateToSourceLibrary={navigateToSourceLibrary}
        onNavigateToEvidenceLab={navigateToEvidenceLab}
        onNavigateToCurationWorkbench={navigateToCurationWorkbench}
        onNavigateToTransformTesting={navigateToTransformTesting}
        onNavigateToCharts={navigateToChartsPerformance}
        onNavigateToRoadmapOverview={() =>
          navigateToRoadmapOverview("overview")
        }
      />
    ),
    "data-management": () => (
      <DataManagementView
        materials={materials}
        onBack={navigateToAdminHome}
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
              : "All data deleted locally",
          );
          navigateToMaterials();
        }}
        user={user}
        userRole={userRole}
      />
    ),
    "user-management": () => (
      <UserManagementView
        onBack={navigateToAdminHome}
        currentUserId={user?.id || ""}
      />
    ),
    "whitepaper-sync": () => (
      <WhitepaperSyncTool onBack={navigateToAdminHome} />
    ),
    "scientific-editor": (view) => {
      const material = materials.find((m) => m.id === view.materialId);
      if (!material) return null;
      return (
        <ScientificDataEditor
          material={material as any}
          onSave={(updatedMaterial) => {
            handleUpdateMaterial(updatedMaterial as Material);
            navigateToMaterials();
          }}
          onCancel={navigateToMaterials}
        />
      );
    },
    export: () => (
      <PublicExportView onBack={goBack} materialsCount={materials.length} />
    ),
    "user-profile": (view) => (
      <UserProfileView
        userId={view.userId}
        onBack={goBack}
        isOwnProfile={view.userId === user?.id}
        onNavigateToMySubmissions={
          view.userId === user?.id ? navigateToMySubmissions : undefined
        }
        isAdminModeActive={isAdminModeActive}
        onViewMaterial={navigateToMaterialDetail}
        onViewGuide={(guideId) => navigateTo({ type: "guide-detail", guideId })}
        onViewArticle={(materialId, category, articleId) =>
          navigateTo({
            type: "article-standalone",
            articleId,
            materialId,
            category: category as CategoryType,
          })
        }
      />
    ),
    "my-submissions": () => <MySubmissionsView onBack={goBack} />,
    "review-center": () => (
      <ContentReviewCenter
        onBack={navigateToAdminHome}
        currentUserId={user?.id || ""}
        onNavigateToProfile={navigateToUserProfile}
        materials={materials}
      />
    ),
    "api-docs": () => <ApiDocumentation onBack={navigateToScienceHub} />,
    "source-library": () => (
      <SourceLibraryManager
        onBack={navigateToAdminHome}
        materials={materials}
        isAuthenticated={!!user}
        isAdmin={userRole === "admin"}
      />
    ),
    "source-comparison": () => (
      <SourceDataComparison
        onBack={navigateToAdminHome}
        materials={materials}
      />
    ),
    "evidence-lab": () => <EvidenceLabView onBack={navigateToAdminHome} />,
    "curation-workbench": () => (
      <CurationWorkbench onBack={navigateToAdminHome} />
    ),
    "transform-formula-testing": () => (
      <TransformFormulaTesting
        onBack={navigateToAdminHome}
        materials={materials}
      />
    ),
    licenses: () => <LicensesView onBack={goBack} />,
    "science-hub": () => (
      <ScienceHubView
        onBack={goBack}
        onNavigateToWhitePapers={navigateToMethodologyList}
        onNavigateToOpenAccess={navigateToExport}
        onNavigateToAPI={navigateToApiDocs}
      />
    ),
    "legal-hub": () => (
      <LegalHubView
        onBack={goBack}
        onNavigateToTakedownForm={navigateToTakedownForm}
        onNavigateToLicenses={navigateToLicenses}
        onNavigateToPrivacyPolicy={navigateToPrivacyPolicy}
      />
    ),
    "privacy-policy": () => <PrivacyPolicyView onBack={goBack} />,
    "takedown-form": () => <TakedownRequestForm onBack={goBack} />,
    "takedown-status": (view) => (
      <TakedownStatusView requestId={view.requestId} className="p-6" />
    ),
    "admin-takedown-list": () => <AdminTakedownList />,
    "audit-log": () => <AuditLogViewer onBack={navigateToAdminDashboard} />,
    "data-retention": () => <DataRetentionManager className="p-6" />,
    "transform-manager": () => <TransformVersionManager className="p-6" />,
    "whitepapers-management": () => (
      <WhitepaperSyncTool onBack={navigateToAdminDashboard} className="p-6" />
    ),
    "role-permissions": () => (
      <RolePermissionsView onBack={navigateToAdminDashboard} />
    ),
    "category-colors": () => (
      <CategoryColorsView onBack={navigateToAdminDashboard} />
    ),
    "categories-management": () => (
      <CategoriesView onBack={navigateToAdminDashboard} />
    ),
    "assets-management": () => <AssetsManagementPage />,
    "math-tools": (view) => (
      <MathView
        onBack={navigateToAdminDashboard}
        defaultTab={view.defaultTab}
      />
    ),
    "charts-performance": () => (
      <ChartsPerformanceView onBack={navigateToAdminHome} />
    ),
    roadmap: () => <RoadmapView onBack={navigateToAdminHome} />,
    "roadmap-overview": (view) => (
      <SimplifiedRoadmap
        onBack={navigateToAdminHome}
        defaultTab={view.defaultTab}
        staffMode={userRole === "staff"}
      />
    ),
    guides: () => <GuidesView onBack={goBack} />,
    "guide-detail": (view) => (
      <GuideDetailView guideId={view.guideId} onBack={goBack} />
    ),
    blog: () => <BlogView onBack={goBack} />,
    "editor-test": () => <EditorTestView />,
    about: () => <AboutView onBack={goBack} />,
    donate: () => <DonateView onBack={goBack} />,
  };
  return (
    <>
      {/* Auth Modal */}
      {showAuthModal && (
        <div className={authModalOuterDivClasses}>
          <div className={authModalInnerDivClasses}>
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

      <div className={authModalBackgroundClasses}>
        {/* Main layout container - allows window to grow past 1000px with sidebar */}
        <div className="max-w-350 mx-auto">
          {/* Simulated window with optional sidebar inside */}
          <div className="bg-[#faf7f2] dark:bg-[#1a1917] rounded-[11.464px] border-[1.5px] border-[#211f1c] dark:border-white/20 overflow-visible mb-6">
            <StatusBar
              title="Waste"
              titlePop="DB"
              version="BETA"
              currentView={currentView}
              onViewChange={navigateTo}
              syncStatus={syncStatus === "idle" ? undefined : syncStatus}
              user={user}
              userRole={userRole}
              onLogout={handleLogout}
              onSignIn={() => setShowAuthModal(true)}
            />

            {/* Navigation tabs - full width above flex container */}
            <NavTabBar />

            {/* Content area with optional sidebar */}
            <div className="flex">
              {/* Left panel - visible on medium screens and wider, front page only */}
              {showLeftPanel && (
                <aside className="hidden md:block w-52 lg:w-64 shrink-0 border-r-[1.5px] border-[#211f1c] dark:border-white/20">
                  <div className="sticky top-0 max-h-[calc(100vh-100px)] overflow-y-auto">
                    <LeftPanel />
                  </div>
                </aside>
              )}

              {/* Main content - grows to fill space */}
              <div className="flex-1 min-w-0">
                <ViewConfiguration
                  currentView={currentView}
                  views={viewConfigurations}
                />

                {/* Footer - inside rounded container */}
                <PageFooter />

                {/* Scroll hint arrow - shown when sidebar is below */}
                {showLeaderboardPanel && showScrollHint && (
                  <ScrollHintArrow cta="See top contributors" />
                )}
              </div>

              {/* Sidebar - visible on medium screens and wider */}
              {showLeaderboardPanel && (
                <aside className="hidden md:block w-52 lg:w-64 shrink-0 border-l-[1.5px] border-[#211f1c] dark:border-white/20">
                  <div className="sticky top-0 max-h-[calc(100vh-100px)] overflow-y-auto">
                    <Leaderboard onUserClick={navigateToUserProfile} />
                  </div>
                </aside>
              )}
            </div>
          </div>

          {/* Mobile Leaderboard - separate window below main content, visible below md breakpoint */}
          {showLeaderboardPanel && (
            <motion.div
              ref={leaderboardRef}
              className="md:hidden mt-4 mx-4 md:mx-6 rounded-2xl border-[1.5px] border-[#211f1c] dark:border-white/20 bg-[#f5f4ef] dark:bg-[#1a1917] overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={
                leaderboardVisible
                  ? { opacity: 1, y: 0 }
                  : { opacity: 0, y: 20 }
              }
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <Leaderboard onUserClick={navigateToUserProfile} />
            </motion.div>
          )}

          {/* Permalink Disambiguation Picker */}
          {permalinkDisambiguateCandidates && (
            <PermalinkSelectionPrompt
              candidates={permalinkDisambiguateCandidates}
              onClose={() => setPermalinkDisambiguateCandidates(null)}
            />
          )}

          {/* Submission Forms */}
          {showSubmitMaterialForm && (
            <SubmitMaterialForm
              initialName={submitMaterialInitialName}
              onClose={() => {
                setShowSubmitMaterialForm(false);
                setSubmitMaterialInitialName("");
              }}
              onSubmitSuccess={() => {
                // Optionally refresh submissions or show a notification
                toast.success(
                  'Material submitted! Check "My Submissions" for updates.',
                );
              }}
            />
          )}

          {materialToEdit && (
            <SuggestMaterialEditForm
              material={materialToEdit}
              allMaterials={materials}
              isAdminMode={userRole === "admin"}
              onClose={() => setMaterialToEdit(null)}
              onSubmitSuccess={() => {
                if (userRole !== "admin") {
                  toast.success(
                    'Edit suggestion submitted! Check "My Submissions" for updates.',
                  );
                }
              }}
            />
          )}

          {showSubmitArticleForm && (
            <SubmitArticleForm
              onClose={() => setShowSubmitArticleForm(false)}
              onSubmitSuccess={() => {
                toast.success(
                  'Article submitted! Check "My Submissions" for updates.',
                );
              }}
            />
          )}
        </div>
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
          <CategoryProvider>
            <AppWithAuth />
          </CategoryProvider>
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
      <Toaster position="top-center" />
      <AppWithMaterialsContext />
      <CookieConsent />
    </AuthProvider>
  );
}
