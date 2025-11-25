/**
 * Materials Context - Centralized Materials State Management
 *
 * Manages all material data, CRUD operations, and sync logic between
 * localStorage and Supabase.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Material } from "../types/material";
import { materialsLogger, syncLogger } from "../utils/loggerFactories";
import * as api from "../utils/api";
import { toast } from "sonner";
import { getSourcesByTag } from "../data/sources";

type SyncStatus = "idle" | "syncing" | "synced" | "error" | "offline";

interface MaterialsContextType {
  // State
  materials: Material[];
  isLoadingMaterials: boolean;
  syncStatus: SyncStatus;
  supabaseAvailable: boolean;

  // CRUD Operations
  addMaterial: (materialData: Omit<Material, "id">) => void;
  updateMaterial: (materialData: Omit<Material, "id"> | Material) => void;
  deleteMaterial: (id: string) => void;

  // Batch Operations
  bulkImport: (newMaterials: Material[]) => void;
  updateMaterials: (updatedMaterials: Material[]) => void;
  deleteAllMaterials: () => Promise<void>;

  // Sync
  retrySync: () => Promise<void>;

  // Helpers
  getMaterialById: (id: string) => Material | undefined;
}

const MaterialsContext = createContext<MaterialsContextType | undefined>(
  undefined
);

export const useMaterialsContext = () => {
  const context = useContext(MaterialsContext);
  if (!context) {
    throw new Error(
      "useMaterialsContext must be used within MaterialsProvider"
    );
  }
  return context;
};

interface MaterialsProviderProps {
  children: ReactNode;
  user: { id: string; email: string; name?: string } | null;
  userRole: "user" | "admin";
}

export const MaterialsProvider: React.FC<MaterialsProviderProps> = ({
  children,
  user,
  userRole,
}) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [supabaseAvailable, setSupabaseAvailable] = useState(false);

  // Initialize sample data
  const initializeSampleData = () => {
    materialsLogger.info("Initializing sample data...");

    // Get sources from library for initial data
    const cardboardSources = getSourcesByTag("cardboard").slice(0, 4);
    const glassSources = getSourcesByTag("glass").slice(0, 4);
    const petSources = getSourcesByTag("pet").slice(0, 5);

    const sampleMaterials: Material[] = [
      {
        id: "1",
        name: "Cardboard",
        category: "Paper & Cardboard",
        compostability: 85,
        recyclability: 95,
        reusability: 70,
        description:
          "Made from thick paper stock or heavy paper-pulp. Widely used for packaging.",
        Y_value: 0.82,
        D_value: 0.15,
        C_value: 0.7,
        M_value: 0.95,
        E_value: 0.25,
        CR_practical_mean: 0.78,
        CR_theoretical_mean: 0.89,
        CR_practical_CI95: { lower: 0.74, upper: 0.82 },
        CR_theoretical_CI95: { lower: 0.85, upper: 0.93 },
        confidence_level: "High",
        sources: cardboardSources,
        whitepaper_version: "2025.1",
        calculation_timestamp: new Date().toISOString(),
        method_version: "CR-v1",
        articles: {
          compostability: [],
          recyclability: [],
          reusability: [],
        },
      },
      {
        id: "2",
        name: "Glass",
        category: "Glass",
        compostability: 0,
        recyclability: 90,
        reusability: 85,
        description: "Transparent or translucent material made from silica.",
        Y_value: 0.75,
        D_value: 0.05,
        C_value: 0.6,
        M_value: 0.9,
        E_value: 0.6,
        CR_practical_mean: 0.68,
        CR_theoretical_mean: 0.85,
        CR_practical_CI95: { lower: 0.64, upper: 0.72 },
        CR_theoretical_CI95: { lower: 0.81, upper: 0.89 },
        confidence_level: "High",
        sources: glassSources,
        whitepaper_version: "2025.1",
        calculation_timestamp: new Date().toISOString(),
        method_version: "CR-v1",
        articles: {
          compostability: [],
          recyclability: [],
          reusability: [],
        },
      },
      {
        id: "3",
        name: "Plastic (PET)",
        category: "Plastics",
        compostability: 0,
        recyclability: 75,
        reusability: 60,
        description: "Common plastic type used in bottles and containers.",
        Y_value: 0.65,
        D_value: 0.25,
        C_value: 0.45,
        M_value: 0.75,
        E_value: 0.4,
        CR_practical_mean: 0.52,
        CR_theoretical_mean: 0.71,
        CR_practical_CI95: { lower: 0.48, upper: 0.56 },
        CR_theoretical_CI95: { lower: 0.67, upper: 0.75 },
        confidence_level: "High",
        sources: petSources,
        whitepaper_version: "2025.1",
        calculation_timestamp: new Date().toISOString(),
        method_version: "CR-v1",
        articles: {
          compostability: [],
          recyclability: [],
          reusability: [],
        },
      },
    ];

    saveMaterials(sampleMaterials);
  };

  // Load from localStorage
  const loadFromLocalStorage = () => {
    syncLogger.info("Loading materials from localStorage...");
    const stored = localStorage.getItem("materials");
    if (stored) {
      try {
        const parsedMaterials = JSON.parse(stored);
        const materialsWithArticles = parsedMaterials.map((m: any) => ({
          ...m,
          category: m.category || "Plastics",
          articles: m.articles || {
            compostability: [],
            recyclability: [],
            reusability: [],
          },
        }));
        setMaterials(materialsWithArticles);
        syncLogger.info(
          `Loaded ${materialsWithArticles.length} materials from localStorage`
        );
      } catch (e) {
        materialsLogger.error("Error parsing stored materials:", e);
        initializeSampleData();
      }
    } else {
      initializeSampleData();
    }
  };

  // Load materials from Supabase (if authenticated), fallback to localStorage
  useEffect(() => {
    const loadMaterials = async () => {
      materialsLogger.info("Loading materials...");

      // Try to load from Supabase first
      try {
        const supabaseMaterials = await api.getAllMaterials();

        if (supabaseMaterials.length > 0) {
          // Ensure all materials have articles structure and category
          const materialsWithArticles = supabaseMaterials.map((m: any) => ({
            ...m,
            category: m.category || "Plastics",
            articles: m.articles || {
              compostability: [],
              recyclability: [],
              reusability: [],
            },
          }));
          setMaterials(materialsWithArticles);
          // Sync to localStorage as cache
          localStorage.setItem(
            "materials",
            JSON.stringify(materialsWithArticles)
          );
          if (user) {
            setSyncStatus("synced");
          }
          setSupabaseAvailable(true);
          syncLogger.info(
            `Loaded ${materialsWithArticles.length} materials from Supabase`
          );
        } else {
          // If Supabase is empty, load from localStorage or initialize sample data
          loadFromLocalStorage();
          if (user) {
            setSyncStatus("synced");
          }
          setSupabaseAvailable(true);
        }
      } catch (error) {
        // For unauthenticated users, a 401 is expected - don't log as error
        const isExpectedAuthError =
          !user &&
          error instanceof Error &&
          error.message.includes("Unauthorized");
        if (!isExpectedAuthError) {
          materialsLogger.error("Failed to load from Supabase:", error);
        }
        setSupabaseAvailable(false);
        loadFromLocalStorage();
        if (user) {
          setSyncStatus("offline");
          toast.warning("Working offline - data stored locally only");
        }
      } finally {
        setIsLoadingMaterials(false);
      }
    };

    loadMaterials();
  }, [user]);

  // Save materials to localStorage and Supabase
  const saveMaterials = async (newMaterials: Material[]) => {
    materialsLogger.info(`Saving ${newMaterials.length} materials...`);
    setMaterials(newMaterials);
    localStorage.setItem("materials", JSON.stringify(newMaterials));

    // Sync to Supabase only if user is authenticated, has admin role, and supabase is available
    if (user && userRole === "admin" && supabaseAvailable) {
      setSyncStatus("syncing");
      syncLogger.info("Syncing to Supabase...");

      // Try syncing with retry logic
      let lastError: any = null;
      const maxRetries = 2;
      const retryDelay = 1000; // 1 second

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const materialsWithArticles = newMaterials.map((m) => ({
            ...m,
            articles: m.articles || {
              compostability: [],
              recyclability: [],
              reusability: [],
            },
          }));
          await api.batchSaveMaterials(materialsWithArticles);
          setSyncStatus("synced");
          syncLogger.info("Successfully synced to Supabase");
          return; // Success, exit early
        } catch (error) {
          lastError = error;
          syncLogger.warn(`Sync attempt ${attempt + 1} failed:`, error);

          // If not the last attempt, wait before retrying
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          }
        }
      }

      // All retries failed
      syncLogger.error("All sync attempts failed:", lastError);
      setSyncStatus("error");
      setSupabaseAvailable(false);
      toast.error("Failed to sync to cloud - saved locally");
    }
  };

  // CRUD Operations
  const addMaterial = (materialData: Omit<Material, "id">) => {
    const newMaterial: Material = {
      ...materialData,
      id: Date.now().toString(),
    };
    materialsLogger.info("Adding material:", newMaterial.name);
    saveMaterials([...materials, newMaterial]);
    toast.success(`Added ${materialData.name} successfully`);
  };

  const updateMaterial = (materialData: Omit<Material, "id"> | Material) => {
    if ("id" in materialData) {
      // Direct update with full material
      const existingIndex = materials.findIndex(
        (m) => m.id === materialData.id
      );
      if (existingIndex >= 0) {
        // Update existing material
        materialsLogger.info("Updating material:", materialData.name);
        const updated = materials.map((m) =>
          m.id === materialData.id ? materialData : m
        );
        saveMaterials(updated);
        toast.success(`Updated ${materialData.name} successfully`);
      } else {
        // Add new material (e.g., from CSV import)
        materialsLogger.info("Adding new material:", materialData.name);
        saveMaterials([...materials, materialData]);
        toast.success(`Added ${materialData.name} successfully`);
      }
    } else {
      materialsLogger.warn("Update called without id - operation skipped");
    }
  };

  const deleteMaterial = (id: string) => {
    const material = materials.find((m) => m.id === id);
    if (confirm("Are you sure you want to delete this material?")) {
      materialsLogger.info("Deleting material:", material?.name || id);
      saveMaterials(materials.filter((m) => m.id !== id));
      if (material) {
        toast.success(`Deleted ${material.name} successfully`);
      }
    }
  };

  const bulkImport = (newMaterials: Material[]) => {
    materialsLogger.info(`Bulk importing ${newMaterials.length} materials...`);
    saveMaterials(newMaterials);
    toast.success(`Imported ${newMaterials.length} materials successfully`);
  };

  const updateMaterials = (updatedMaterials: Material[]) => {
    materialsLogger.info(`Updating ${updatedMaterials.length} materials...`);
    saveMaterials(updatedMaterials);
  };

  const deleteAllMaterials = async () => {
    materialsLogger.warn("Deleting all materials...");
    setMaterials([]);
    localStorage.removeItem("materials");
    if (supabaseAvailable) {
      try {
        await api.deleteAllMaterials();
        toast.success("All data deleted from cloud and locally");
      } catch (error) {
        materialsLogger.error("Failed to delete from cloud:", error);
        toast.success("All data deleted locally");
      }
    } else {
      toast.success("All data deleted locally");
    }
  };

  const retrySync = async () => {
    if (!user) {
      toast.info("Please sign in to sync to cloud");
      return;
    }

    if (userRole !== "admin") {
      toast.info("Only admins can sync data to cloud");
      return;
    }

    syncLogger.info("Retrying sync...");
    setSyncStatus("syncing");
    try {
      const materialsWithArticles = materials.map((m) => ({
        ...m,
        articles: m.articles || {
          compostability: [],
          recyclability: [],
          reusability: [],
        },
      }));
      await api.batchSaveMaterials(materialsWithArticles);
      setSyncStatus("synced");
      setSupabaseAvailable(true);
      toast.success("Successfully synced to cloud");
    } catch (error) {
      syncLogger.error("Retry sync failed:", error);
      setSyncStatus("error");
      setSupabaseAvailable(false);
      toast.error("Sync failed - check your connection");
    }
  };

  const getMaterialById = (id: string): Material | undefined => {
    return materials.find((m) => m.id === id);
  };

  const value: MaterialsContextType = {
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
  };

  return (
    <MaterialsContext.Provider value={value}>
      {children}
    </MaterialsContext.Provider>
  );
};
