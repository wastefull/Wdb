/**
 * CategoryContext — Dynamic material category list.
 *
 * Loads the live category list from the backend (KV store) and subscribes
 * to Supabase Realtime broadcasts so all sessions see category changes
 * immediately after an admin saves them.
 *
 * Replaces static imports of MATERIAL_CATEGORIES for anything that renders
 * or filters by category.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { MaterialCategoryDef, MATERIAL_CATEGORIES } from "../types/material";
import { apiCall } from "../utils/api";
import {
  loadAndApplyCategoryColors,
  updateColorModeVars,
} from "../utils/categoryColors";
import { supabaseClient } from "../utils/supabase/client";
import { logger } from "../utils/logger";

// Derive default category definitions from the static list so the UI
// is populated immediately before the first API response arrives.
export const DEFAULT_CATEGORIES: MaterialCategoryDef[] =
  MATERIAL_CATEGORIES.map((name) => ({
    id: name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),
    name,
  }));

interface CategoryContextType {
  /** Active (non-deleted) categories — for all views. */
  categories: MaterialCategoryDef[];
  loading: boolean;
  /** Look up a category by its immutable ID slug. */
  getCategoryById: (id: string) => MaterialCategoryDef | undefined;
  /**
   * Look up a category by display name or any of its aliases.
   * Used to resolve legacy material.category strings that were written
   * before the categoryId field was introduced.
   */
  getCategoryByName: (name: string) => MaterialCategoryDef | undefined;
  /** Manually re-fetch (call after mutations in CategoriesView). */
  refetch: () => Promise<void>;
}

const CategoryContext = createContext<CategoryContextType | undefined>(
  undefined,
);

export function CategoryProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] =
    useState<MaterialCategoryDef[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiCall("/settings/categories", {}, true);
      const cats: MaterialCategoryDef[] = data.categories ?? DEFAULT_CATEGORIES;
      setCategories(cats);
      // Re-apply colors whenever the category list changes so new categories
      // pick up their default color immediately.
      await loadAndApplyCategoryColors();
    } catch (err) {
      logger.warn("Failed to load categories, using defaults:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Subscribe to Realtime broadcast — other sessions get category changes
  // the moment an admin saves without needing to reload the page.
  useEffect(() => {
    const channel = supabaseClient.channel("site-categories");
    channel.on("broadcast", { event: "categories:updated" }, () => {
      refetch();
    });
    channel.subscribe();
    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [refetch]);

  // Watch for .dark / .no-pastel class changes on <html> so category color
  // CSS vars are swapped to the correct derived variant automatically.
  useEffect(() => {
    const observer = new MutationObserver(() => updateColorModeVars());
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const getCategoryById = useCallback(
    (id: string) => categories.find((c) => c.id === id),
    [categories],
  );

  const getCategoryByName = useCallback(
    (name: string) =>
      categories.find((c) => c.name === name || c.aliases?.includes(name)),
    [categories],
  );

  return (
    <CategoryContext.Provider
      value={{
        categories,
        loading,
        getCategoryById,
        getCategoryByName,
        refetch,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategoryContext() {
  const ctx = useContext(CategoryContext);
  if (!ctx) {
    throw new Error("useCategoryContext must be used inside CategoryProvider");
  }
  return ctx;
}
