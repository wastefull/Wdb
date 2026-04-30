/**
 * Navigation Context - Centralized View Management
 *
 * Manages all view states and navigation logic for the application.
 */

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { navigationLogger } from "../utils/loggerFactories";
import { CategoryType, ArticleType } from "../types/article";

// View types that the app can navigate to
export type ViewType =
  | { type: "auth" }
  | { type: "materials" }
  | { type: "permalink-loading" }
  | { type: "search-results"; query: string }
  | { type: "material-detail"; materialId: string }
  | { type: "articles"; category: CategoryType; materialId: string }
  | { type: "all-articles"; category?: CategoryType; articleType?: ArticleType }
  | {
      type: "article-detail";
      articleId: string;
      materialId: string;
      category: CategoryType;
    }
  | {
      type: "article-standalone";
      articleId: string;
      materialId: string;
      category: CategoryType;
    }
  | { type: "methodology-list" }
  | { type: "whitepaper"; whitepaperSlug: string }
  | { type: "admin-dashboard" }
  | { type: "staff-dashboard" }
  | { type: "data-management" }
  | { type: "user-management" }
  | { type: "whitepaper-sync" }
  | { type: "scientific-editor"; materialId: string }
  | { type: "export" }
  | { type: "user-profile"; userId: string }
  | { type: "my-submissions" }
  | { type: "review-center" }
  | { type: "api-docs" }
  | { type: "source-library" }
  | { type: "source-comparison" }
  | { type: "evidence-lab" }
  | { type: "curation-workbench" }
  | { type: "transform-formula-testing" }
  | { type: "licenses" }
  | { type: "legal-hub" }
  | { type: "privacy-policy" }
  | { type: "science-hub" }
  | { type: "takedown-form" }
  | { type: "takedown-status"; requestId: string }
  | { type: "admin-takedown-list" }
  | { type: "audit-log" }
  | { type: "data-retention" }
  | { type: "phase9-testing" }
  | { type: "phase9-day10-testing" }
  | { type: "transform-manager" }
  | { type: "whitepapers-management" }
  | { type: "assets-management" }
  | { type: "role-permissions" }
  | { type: "category-colors" }
  | { type: "categories-management" }
  | { type: "math-tools"; defaultTab?: "overview" | "transform-manager" }
  | { type: "charts-performance" }
  | { type: "roadmap" }
  | {
      type: "roadmap-overview";
      defaultTab?:
        | "overview"
        | "9.1"
        | "9.2"
        | "9.3"
        | "9.4"
        | "9.5"
        | "10"
        | "tests"
        | "backlog";
    }
  | { type: "guides" }
  | { type: "guide-detail"; guideId: string }
  | { type: "blog" }
  | { type: "editor-test" }
  | { type: "about" }
  | { type: "donate" };

export type UserRole = "user" | "staff" | "admin";

export const ADMIN_VIEW_TYPES = new Set<ViewType["type"]>([
  "admin-dashboard",
  "staff-dashboard",
  "data-management",
  "user-management",
  "whitepaper-sync",
  "review-center",
  "source-library",
  "source-comparison",
  "evidence-lab",
  "curation-workbench",
  "transform-formula-testing",
  "admin-takedown-list",
  "audit-log",
  "data-retention",
  "transform-manager",
  "whitepapers-management",
  "assets-management",
  "role-permissions",
  "category-colors",
  "categories-management",
  "math-tools",
  "charts-performance",
  "roadmap",
  "roadmap-overview",
]);

export function isAdminViewType(viewType: ViewType["type"]): boolean {
  return ADMIN_VIEW_TYPES.has(viewType);
}

export function getAdminHomeViewByRole(role: UserRole): ViewType {
  return role === "staff"
    ? { type: "staff-dashboard" }
    : { type: "admin-dashboard" };
}

const STATIC_VIEW_HASH_TO_TYPE: Partial<Record<string, ViewType["type"]>> = {
  "admin-dashboard": "admin-dashboard",
  "staff-dashboard": "staff-dashboard",
  "data-management": "data-management",
  "user-management": "user-management",
  "whitepaper-sync": "whitepaper-sync",
  "review-center": "review-center",
  "source-library": "source-library",
  "source-comparison": "source-comparison",
};

const STATIC_VIEW_TYPE_TO_HASH: Partial<Record<ViewType["type"], string>> =
  Object.entries(STATIC_VIEW_HASH_TO_TYPE).reduce(
    (acc, [hash, viewType]) => {
      if (viewType) {
        acc[viewType] = hash;
      }
      return acc;
    },
    {} as Partial<Record<ViewType["type"], string>>,
  );

function getInitialViewFromUrlHash(): ViewType {
  if (typeof window === "undefined") {
    return { type: "materials" };
  }

  // If the URL is a material article permalink (/m/<slug>/<articleId>),
  // start in a loading state instead of the front page to avoid the flash
  // while the async permalink resolution fetches materials from Supabase.
  if (/^\/m\/[^/]+\/[^/]+/.test(window.location.pathname)) {
    return { type: "permalink-loading" };
  }

  const rawHash = window.location.hash.replace(/^#\/?/, "").trim();
  const maybeViewType = STATIC_VIEW_HASH_TO_TYPE[rawHash];

  if (maybeViewType) {
    return { type: maybeViewType } as ViewType;
  }

  return { type: "materials" };
}

interface NavigationContextType {
  // State
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;

  // Navigation
  navigateTo: (view: ViewType) => void;
  navigateToAuth: () => void;
  navigateToMaterials: () => void;
  navigateToSearchResults: (query: string) => void;
  navigateToMaterialDetail: (materialId: string) => void;
  navigateToArticles: (materialId: string, category: CategoryType) => void;
  navigateToAllArticles: (category: CategoryType) => void;
  navigateToArticleDetail: (
    articleId: string,
    materialId: string,
    category: CategoryType,
  ) => void;
  navigateToMethodologyList: () => void;
  navigateToWhitepaper: (whitepaperSlug: string) => void;
  navigateToAdminDashboard: () => void;
  navigateToStaffDashboard: () => void;
  navigateToDataManagement: () => void;
  navigateToUserManagement: () => void;
  navigateToWhitepaperSync: () => void;
  navigateToScientificEditor: (materialId: string) => void;
  navigateToExport: () => void;
  navigateToUserProfile: (userId: string) => void;
  navigateToMySubmissions: () => void;
  navigateToReviewCenter: () => void;
  navigateToApiDocs: () => void;
  navigateToSourceLibrary: () => void;
  navigateToSourceComparison: () => void;
  navigateToEvidenceLab: () => void;
  navigateToCurationWorkbench: () => void;
  navigateToTransformTesting: () => void;
  navigateToLicenses: () => void;
  navigateToLegalHub: () => void;
  navigateToPrivacyPolicy: () => void;
  navigateToScienceHub: () => void;
  navigateToTakedownForm: () => void;
  navigateToTakedownStatus: (requestId: string) => void;
  navigateToAdminTakedownList: () => void;
  navigateToAuditLog: () => void;
  navigateToDataRetention: () => void;
  navigateToPhase9Testing: () => void;
  navigateToPhase9Day10Testing: () => void;
  navigateToTransformManager: () => void;
  navigateToWhitepapersManagement: () => void;
  navigateToAssetsManagement: () => void;
  navigateToRolePermissions: () => void;
  navigateToCategoryColors: () => void;
  navigateToCategoriesManagement: () => void;
  navigateToMathTools: (defaultTab?: "overview" | "transform-manager") => void;
  navigateToChartsPerformance: () => void;
  navigateToRoadmap: () => void;
  navigateToRoadmapOverview: (
    defaultTab?:
      | "overview"
      | "9.1"
      | "9.2"
      | "9.3"
      | "9.4"
      | "9.5"
      | "10"
      | "tests"
      | "backlog",
  ) => void;
  navigateToGuides: () => void;
  navigateToBlog: () => void;
  navigateToAbout: () => void;
  navigateToDonate: () => void;
  goBack: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined,
);

export const useNavigationContext = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error(
      "useNavigationContext must be used within NavigationProvider",
    );
  }
  return context;
};

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({
  children,
}) => {
  const initialView = getInitialViewFromUrlHash();
  const [currentView, setCurrentView] = useState<ViewType>(initialView);
  const [viewHistory, setViewHistory] = useState<ViewType[]>([initialView]);

  const syncHashWithView = useCallback((view: ViewType) => {
    if (typeof window === "undefined") {
      return;
    }

    const routeHash = STATIC_VIEW_TYPE_TO_HASH[view.type] || "";
    const nextHash = routeHash ? `#${routeHash}` : "";
    const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;

    window.history.replaceState({}, "", nextUrl);
  }, []);

  const navigateTo = (view: ViewType) => {
    navigationLogger.info("Navigating to:", view.type);
    setCurrentView(view);
    // Replace the history entry when leaving the transient loading state so
    // the user can't "go back" to a blank loading screen.
    setViewHistory((prev) =>
      prev[prev.length - 1]?.type === "permalink-loading"
        ? [...prev.slice(0, -1), view]
        : [...prev, view],
    );
    syncHashWithView(view);
  };

  const navigateToAuth = () => {
    navigateTo({ type: "auth" });
  };

  const navigateToMaterials = () => {
    navigateTo({ type: "materials" });
  };

  const navigateToSearchResults = (query: string) => {
    // Always navigate to search-results, even with empty query (shows all materials)
    navigateTo({ type: "search-results", query });
  };

  const navigateToMaterialDetail = (materialId: string) => {
    navigateTo({ type: "material-detail", materialId });
  };

  const navigateToArticles = (materialId: string, category: CategoryType) => {
    navigateTo({ type: "articles", materialId, category });
  };

  const navigateToAllArticles = (category: CategoryType) => {
    navigateTo({ type: "all-articles", category });
  };

  const navigateToArticleDetail = (
    articleId: string,
    materialId: string,
    category: CategoryType,
  ) => {
    navigateTo({ type: "article-detail", articleId, materialId, category });
  };

  const navigateToMethodologyList = () => {
    navigateTo({ type: "methodology-list" });
  };

  const navigateToWhitepaper = (whitepaperSlug: string) => {
    navigateTo({ type: "whitepaper", whitepaperSlug });
  };

  const navigateToAdminDashboard = () => {
    navigateTo({ type: "admin-dashboard" });
  };

  const navigateToStaffDashboard = () => {
    navigateTo({ type: "staff-dashboard" });
  };

  const navigateToDataManagement = () => {
    navigateTo({ type: "data-management" });
  };

  const navigateToUserManagement = () => {
    navigateTo({ type: "user-management" });
  };

  const navigateToWhitepaperSync = () => {
    navigateTo({ type: "whitepaper-sync" });
  };

  const navigateToScientificEditor = (materialId: string) => {
    navigateTo({ type: "scientific-editor", materialId });
  };

  const navigateToExport = () => {
    navigateTo({ type: "export" });
  };

  const navigateToUserProfile = (userId: string) => {
    navigateTo({ type: "user-profile", userId });
  };

  const navigateToMySubmissions = () => {
    navigateTo({ type: "my-submissions" });
  };

  const navigateToReviewCenter = () => {
    navigateTo({ type: "review-center" });
  };

  const navigateToApiDocs = () => {
    navigateTo({ type: "api-docs" });
  };

  const navigateToSourceLibrary = () => {
    navigateTo({ type: "source-library" });
  };

  const navigateToSourceComparison = () => {
    navigateTo({ type: "source-comparison" });
  };

  const navigateToEvidenceLab = () => {
    navigateTo({ type: "evidence-lab" });
  };

  const navigateToCurationWorkbench = () => {
    navigateTo({ type: "curation-workbench" });
  };

  const navigateToTransformTesting = () => {
    navigateTo({ type: "transform-formula-testing" });
  };

  const navigateToLicenses = () => {
    navigateTo({ type: "licenses" });
  };

  const navigateToLegalHub = () => {
    navigateTo({ type: "legal-hub" });
  };

  const navigateToPrivacyPolicy = () => {
    navigateTo({ type: "privacy-policy" });
  };

  const navigateToScienceHub = () => {
    navigateTo({ type: "science-hub" });
  };

  const navigateToTakedownForm = () => {
    navigateTo({ type: "takedown-form" });
  };

  const navigateToTakedownStatus = (requestId: string) => {
    navigateTo({ type: "takedown-status", requestId });
  };

  const navigateToAdminTakedownList = () => {
    navigateTo({ type: "admin-takedown-list" });
  };

  const navigateToAuditLog = () => {
    navigateTo({ type: "audit-log" });
  };

  const navigateToDataRetention = () => {
    navigateTo({ type: "data-retention" });
  };

  const navigateToPhase9Testing = () => {
    navigateTo({ type: "phase9-testing" });
  };

  const navigateToPhase9Day10Testing = () => {
    navigateTo({ type: "phase9-day10-testing" });
  };

  const navigateToTransformManager = () => {
    navigateTo({ type: "transform-manager" });
  };

  const navigateToWhitepapersManagement = () => {
    navigateTo({ type: "whitepapers-management" });
  };

  const navigateToAssetsManagement = () => {
    navigateTo({ type: "assets-management" });
  };

  const navigateToRolePermissions = () => {
    navigateTo({ type: "role-permissions" });
  };

  const navigateToCategoryColors = () => {
    navigateTo({ type: "category-colors" });
  };

  const navigateToCategoriesManagement = () => {
    navigateTo({ type: "categories-management" });
  };

  const navigateToMathTools = (
    defaultTab?: "overview" | "transform-manager",
  ) => {
    navigateTo({ type: "math-tools", defaultTab });
  };

  const navigateToChartsPerformance = () => {
    navigateTo({ type: "charts-performance" });
  };

  const navigateToRoadmap = () => {
    navigateTo({ type: "roadmap" });
  };

  const navigateToRoadmapOverview = (
    defaultTab?:
      | "overview"
      | "9.1"
      | "9.2"
      | "9.3"
      | "9.4"
      | "9.5"
      | "10"
      | "tests"
      | "backlog",
  ) => {
    navigateTo({ type: "roadmap-overview", defaultTab });
  };

  const navigateToGuides = () => {
    navigateTo({ type: "guides" });
  };

  const navigateToBlog = () => {
    navigateTo({ type: "blog" });
  };

  const navigateToAbout = () => {
    navigateTo({ type: "about" });
  };

  const navigateToDonate = () => {
    navigateTo({ type: "donate" });
  };

  const goBack = () => {
    if (viewHistory.length > 1) {
      const newHistory = viewHistory.slice(0, -1);
      const previousView = newHistory[newHistory.length - 1];
      navigationLogger.info("Going back to:", previousView.type);
      setCurrentView(previousView);
      setViewHistory(newHistory);
      syncHashWithView(previousView);
    } else {
      navigationLogger.info("Already at root view, navigating to materials");
      navigateToMaterials();
    }
  };

  const value: NavigationContextType = {
    currentView,
    setCurrentView,
    navigateTo,
    navigateToAuth,
    navigateToMaterials,
    navigateToSearchResults,
    navigateToMaterialDetail,
    navigateToArticles,
    navigateToAllArticles,
    navigateToArticleDetail,
    navigateToMethodologyList,
    navigateToWhitepaper,
    navigateToAdminDashboard,
    navigateToStaffDashboard,
    navigateToDataManagement,
    navigateToUserManagement,
    navigateToWhitepaperSync,
    navigateToScientificEditor,
    navigateToExport,
    navigateToUserProfile,
    navigateToMySubmissions,
    navigateToReviewCenter,
    navigateToApiDocs,
    navigateToSourceLibrary,
    navigateToSourceComparison,
    navigateToEvidenceLab,
    navigateToCurationWorkbench,
    navigateToTransformTesting,
    navigateToLicenses,
    navigateToLegalHub,
    navigateToPrivacyPolicy,
    navigateToScienceHub,
    navigateToTakedownForm,
    navigateToTakedownStatus,
    navigateToAdminTakedownList,
    navigateToAuditLog,
    navigateToDataRetention,
    navigateToPhase9Testing,
    navigateToPhase9Day10Testing,
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
    navigateToGuides,
    navigateToBlog,
    navigateToAbout,
    navigateToDonate,
    goBack,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};
