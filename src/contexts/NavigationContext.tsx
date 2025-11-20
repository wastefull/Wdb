/**
 * Navigation Context - Centralized View Management
 * 
 * Manages all view states and navigation logic for the application.
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { navigationLogger } from '../utils/loggerFactories';
import { CategoryType } from '../types/material';

// View types that the app can navigate to
export type ViewType = 
  | { type: 'auth' }
  | { type: 'materials' }
  | { type: 'search-results'; query: string }
  | { type: 'material-detail'; materialId: string }
  | { type: 'articles'; category: CategoryType; materialId: string }
  | { type: 'article-detail'; articleId: string; materialId: string; category: CategoryType }
  | { type: 'article-standalone'; articleId: string; materialId: string; category: CategoryType }
  | { type: 'methodology-list' }
  | { type: 'whitepaper'; whitepaperSlug: string }
  | { type: 'admin-dashboard' }
  | { type: 'data-management' }
  | { type: 'user-management' }
  | { type: 'whitepaper-sync' }
  | { type: 'scientific-editor'; materialId: string }
  | { type: 'export' }
  | { type: 'user-profile'; userId: string }
  | { type: 'my-submissions' }
  | { type: 'review-center' }
  | { type: 'api-docs' }
  | { type: 'source-library' }
  | { type: 'source-comparison' }
  | { type: 'evidence-lab' }
  | { type: 'transform-formula-testing' }
  | { type: 'licenses' }
  | { type: 'legal-hub' }
  | { type: 'science-hub' }
  | { type: 'takedown-form' }
  | { type: 'takedown-status'; requestId: string }
  | { type: 'admin-takedown-list' }
  | { type: 'audit-log' }
  | { type: 'data-retention' }
  | { type: 'phase9-testing' }
  | { type: 'phase9-day10-testing' }
  | { type: 'transform-manager' }
  | { type: 'whitepapers-management' }
  | { type: 'assets-management' }
  | { type: 'math-tools'; defaultTab?: 'overview' | 'transform-manager' }
  | { type: 'charts-performance' }
  | { type: 'roadmap' }
  | { type: 'roadmap-overview'; defaultTab?: 'overview' | '9.1' | '9.2' | '9.3' | '9.4' | '9.5' | '10' | 'tests' | 'backlog' };

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
  navigateToArticleDetail: (articleId: string, materialId: string, category: CategoryType) => void;
  navigateToMethodologyList: () => void;
  navigateToWhitepaper: (whitepaperSlug: string) => void;
  navigateToAdminDashboard: () => void;
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
  navigateToTransformTesting: () => void;
  navigateToLicenses: () => void;
  navigateToLegalHub: () => void;
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
  navigateToMathTools: (defaultTab?: 'overview' | 'transform-manager') => void;
  navigateToChartsPerformance: () => void;
  navigateToRoadmap: () => void;
  navigateToRoadmapOverview: (defaultTab?: 'overview' | '9.1' | '9.2' | '9.3' | '9.4' | '9.5' | '10' | 'tests' | 'backlog') => void;
  goBack: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigationContext = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigationContext must be used within NavigationProvider');
  }
  return context;
};

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [currentView, setCurrentView] = useState<ViewType>({ type: 'materials' });
  const [viewHistory, setViewHistory] = useState<ViewType[]>([{ type: 'materials' }]);

  const navigateTo = (view: ViewType) => {
    navigationLogger.info('Navigating to:', view.type);
    setCurrentView(view);
    setViewHistory(prev => [...prev, view]);
  };

  const navigateToAuth = () => {
    navigateTo({ type: 'auth' });
  };

  const navigateToMaterials = () => {
    navigateTo({ type: 'materials' });
  };

  const navigateToSearchResults = (query: string) => {
    navigateTo({ type: 'search-results', query });
  };

  const navigateToMaterialDetail = (materialId: string) => {
    navigateTo({ type: 'material-detail', materialId });
  };

  const navigateToArticles = (materialId: string, category: CategoryType) => {
    navigateTo({ type: 'articles', materialId, category });
  };

  const navigateToArticleDetail = (articleId: string, materialId: string, category: CategoryType) => {
    navigateTo({ type: 'article-detail', articleId, materialId, category });
  };

  const navigateToMethodologyList = () => {
    navigateTo({ type: 'methodology-list' });
  };

  const navigateToWhitepaper = (whitepaperSlug: string) => {
    navigateTo({ type: 'whitepaper', whitepaperSlug });
  };

  const navigateToAdminDashboard = () => {
    navigateTo({ type: 'admin-dashboard' });
  };

  const navigateToDataManagement = () => {
    navigateTo({ type: 'data-management' });
  };

  const navigateToUserManagement = () => {
    navigateTo({ type: 'user-management' });
  };

  const navigateToWhitepaperSync = () => {
    navigateTo({ type: 'whitepaper-sync' });
  };

  const navigateToScientificEditor = (materialId: string) => {
    navigateTo({ type: 'scientific-editor', materialId });
  };

  const navigateToExport = () => {
    navigateTo({ type: 'export' });
  };

  const navigateToUserProfile = (userId: string) => {
    navigateTo({ type: 'user-profile', userId });
  };

  const navigateToMySubmissions = () => {
    navigateTo({ type: 'my-submissions' });
  };

  const navigateToReviewCenter = () => {
    navigateTo({ type: 'review-center' });
  };

  const navigateToApiDocs = () => {
    navigateTo({ type: 'api-docs' });
  };

  const navigateToSourceLibrary = () => {
    navigateTo({ type: 'source-library' });
  };

  const navigateToSourceComparison = () => {
    navigateTo({ type: 'source-comparison' });
  };

  const navigateToEvidenceLab = () => {
    navigateTo({ type: 'evidence-lab' });
  };

  const navigateToTransformTesting = () => {
    navigateTo({ type: 'transform-formula-testing' });
  };

  const navigateToLicenses = () => {
    navigateTo({ type: 'licenses' });
  };

  const navigateToLegalHub = () => {
    navigateTo({ type: 'legal-hub' });
  };

  const navigateToScienceHub = () => {
    navigateTo({ type: 'science-hub' });
  };

  const navigateToTakedownForm = () => {
    navigateTo({ type: 'takedown-form' });
  };

  const navigateToTakedownStatus = (requestId: string) => {
    navigateTo({ type: 'takedown-status', requestId });
  };

  const navigateToAdminTakedownList = () => {
    navigateTo({ type: 'admin-takedown-list' });
  };

  const navigateToAuditLog = () => {
    navigateTo({ type: 'audit-log' });
  };

  const navigateToDataRetention = () => {
    navigateTo({ type: 'data-retention' });
  };

  const navigateToPhase9Testing = () => {
    navigateTo({ type: 'phase9-testing' });
  };

  const navigateToPhase9Day10Testing = () => {
    navigateTo({ type: 'phase9-day10-testing' });
  };

  const navigateToTransformManager = () => {
    navigateTo({ type: 'transform-manager' });
  };

  const navigateToWhitepapersManagement = () => {
    navigateTo({ type: 'whitepapers-management' });
  };

  const navigateToAssetsManagement = () => {
    navigateTo({ type: 'assets-management' });
  };

  const navigateToMathTools = (defaultTab?: 'overview' | 'transform-manager') => {
    navigateTo({ type: 'math-tools', defaultTab });
  };

  const navigateToChartsPerformance = () => {
    navigateTo({ type: 'charts-performance' });
  };

  const navigateToRoadmap = () => {
    navigateTo({ type: 'roadmap' });
  };

  const navigateToRoadmapOverview = (defaultTab?: 'overview' | '9.1' | '9.2' | '9.3' | '9.4' | '9.5' | '10' | 'tests' | 'backlog') => {
    navigateTo({ type: 'roadmap-overview', defaultTab });
  };

  const goBack = () => {
    if (viewHistory.length > 1) {
      const newHistory = viewHistory.slice(0, -1);
      const previousView = newHistory[newHistory.length - 1];
      navigationLogger.info('Going back to:', previousView.type);
      setCurrentView(previousView);
      setViewHistory(newHistory);
    } else {
      navigationLogger.info('Already at root view, navigating to materials');
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
    navigateToArticleDetail,
    navigateToMethodologyList,
    navigateToWhitepaper,
    navigateToAdminDashboard,
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
    navigateToTransformTesting,
    navigateToLicenses,
    navigateToLegalHub,
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
    navigateToMathTools,
    navigateToChartsPerformance,
    navigateToRoadmap,
    navigateToRoadmapOverview,
    goBack,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};