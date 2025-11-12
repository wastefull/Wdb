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
  | { type: 'licenses' }
  | { type: 'takedown-form' }
  | { type: 'takedown-status'; requestId: string }
  | { type: 'admin-takedown-list' }
  | { type: 'phase9-testing' };

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
  navigateToLicenses: () => void;
  navigateToTakedownForm: () => void;
  navigateToTakedownStatus: (requestId: string) => void;
  navigateToAdminTakedownList: () => void;
  navigateToPhase9Testing: () => void;
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

  const navigateToLicenses = () => {
    navigateTo({ type: 'licenses' });
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

  const navigateToPhase9Testing = () => {
    navigateTo({ type: 'phase9-testing' });
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
    navigateToLicenses,
    navigateToTakedownForm,
    navigateToTakedownStatus,
    navigateToAdminTakedownList,
    navigateToPhase9Testing,
    goBack,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};