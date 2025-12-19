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

  // Initialize with empty data (no sample/placeholder data)
  const initializeSampleData = () => {
    materialsLogger.info("Initializing with empty materials list...");
    // Start fresh with no materials - all data should be real and verified
    saveMaterials([]);
  };

  // Load from localStorage
  const loadFromLocalStorage = () => {
    syncLogger.info("Loading materials from localStorage...");

    // Check for data version - clear old sample data if needed
    const dataVersion = localStorage.getItem("materialsDataVersion");
    if (dataVersion !== "2.0-clean") {
      materialsLogger.info(
        "Clearing old sample data (data version upgrade to 2.0-clean)..."
      );
      localStorage.removeItem("materials");
      localStorage.setItem("materialsDataVersion", "2.0-clean");
      initializeSampleData();
      return;
    }

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
          // Track the count for safeguard
          localStorage.setItem(
            "materials_last_known_count",
            String(materialsWithArticles.length)
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
      // SAFEGUARD: Don't sync if we're about to wipe out data
      // This prevents accidental data loss from stale state or bugs
      const currentStoredCount = (() => {
        try {
          const stored = localStorage.getItem("materials_last_known_count");
          return stored ? parseInt(stored, 10) : 0;
        } catch {
          return 0;
        }
      })();

      // If we had more than 1 material before and now have 0 or 1, require confirmation
      if (currentStoredCount > 1 && newMaterials.length <= 1) {
        const warningMessage =
          `SAFEGUARD: Refusing to sync potentially destructive change. ` +
          `Previous count: ${currentStoredCount}, New count: ${newMaterials.length}. ` +
          `Data saved to localStorage only.`;
        syncLogger.warn(warningMessage);
        toast.warning(
          "Sync skipped: Detected potential data loss. Your changes are saved locally."
        );
        setSyncStatus("offline");

        // Create audit log for this blocked sync attempt (triggers email notification)
        try {
          await api.createAuditLog({
            entityType: "materials_bulk",
            entityId: "safeguard_blocked",
            action: "delete",
            before: {
              count: currentStoredCount,
              description: "Materials before blocked sync",
            },
            after: {
              count: newMaterials.length,
              blocked: true,
              reason: "Safeguard triggered: potential bulk data loss detected",
              materials_preview: newMaterials
                .slice(0, 3)
                .map((m) => ({ id: m.id, name: m.name })),
            },
          });
          syncLogger.info("Audit log created for blocked sync attempt");
        } catch (auditError) {
          syncLogger.error(
            "Failed to create audit log for blocked sync:",
            auditError
          );
        }

        return;
      }

      // Update the last known count
      localStorage.setItem(
        "materials_last_known_count",
        String(newMaterials.length)
      );

      setSyncStatus("syncing");
      syncLogger.info("Syncing to Supabase...");

      // Try syncing with retry logic

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

  // Sync a single material
  const syncSingleMaterial = async (
    material: Material,
    operation: "create" | "update" | "delete"
  ): Promise<boolean> => {
    if (!user || userRole !== "admin" || !supabaseAvailable) {
      return false; // Can't sync, but local save succeeded
    }

    setSyncStatus("syncing");
    try {
      const materialWithArticles = {
        ...material,
        articles: material.articles || {
          compostability: [],
          recyclability: [],
          reusability: [],
        },
      };

      if (operation === "create") {
        await api.saveMaterial(materialWithArticles);
      } else if (operation === "update") {
        await api.updateMaterial(materialWithArticles);
      } else if (operation === "delete") {
        await api.deleteMaterial(material.id);
      }

      setSyncStatus("synced");
      syncLogger.info(
        `Successfully ${operation}d material "${material.name}" in Supabase`
      );
      return true;
    } catch (error) {
      syncLogger.error(`Failed to ${operation} material in Supabase:`, error);
      setSyncStatus("error");
      toast.error(`Cloud sync failed - saved locally only`);
      return false;
    }
  };

  // CRUD Operations
  const addMaterial = async (materialData: Omit<Material, "id">) => {
    const newMaterial: Material = {
      ...materialData,
      id: Date.now().toString(),
    };
    materialsLogger.info("Adding material:", newMaterial.name);

    // Update local state and localStorage
    const updated = [...materials, newMaterial];
    setMaterials(updated);
    localStorage.setItem("materials", JSON.stringify(updated));
    localStorage.setItem("materials_last_known_count", String(updated.length));

    // Sync single material to Supabase
    await syncSingleMaterial(newMaterial, "create");
    toast.success(`Added ${materialData.name} successfully`);
  };

  const updateMaterial = async (
    materialData: Omit<Material, "id"> | Material
  ) => {
    if ("id" in materialData) {
      // Direct update with full material
      const existingIndex = materials.findIndex(
        (m) => m.id === materialData.id
      );
      if (existingIndex >= 0) {
        // Update existing material
        materialsLogger.info("Updating material:", materialData.name);

        // Update local state and localStorage
        const updated = materials.map((m) =>
          m.id === materialData.id ? materialData : m
        );
        setMaterials(updated);
        localStorage.setItem("materials", JSON.stringify(updated));

        // Sync single material to Supabase (much faster than batch!)
        await syncSingleMaterial(materialData, "update");
        toast.success(`Updated ${materialData.name} successfully`);
      } else {
        // Add new material (e.g., from CSV import)
        materialsLogger.info("Adding new material:", materialData.name);

        // Update local state and localStorage
        const updated = [...materials, materialData];
        setMaterials(updated);
        localStorage.setItem("materials", JSON.stringify(updated));
        localStorage.setItem(
          "materials_last_known_count",
          String(updated.length)
        );

        // Sync single material to Supabase
        await syncSingleMaterial(materialData, "create");
        toast.success(`Added ${materialData.name} successfully`);
      }
    } else {
      materialsLogger.warn("Update called without id - operation skipped");
    }
  };

  const deleteMaterial = async (id: string) => {
    const material = materials.find((m) => m.id === id);
    if (confirm("Are you sure you want to delete this material?")) {
      materialsLogger.info("Deleting material:", material?.name || id);

      // Update local state and localStorage
      const updated = materials.filter((m) => m.id !== id);
      setMaterials(updated);
      localStorage.setItem("materials", JSON.stringify(updated));
      localStorage.setItem(
        "materials_last_known_count",
        String(updated.length)
      );

      // Sync deletion to Supabase
      if (material) {
        await syncSingleMaterial(material, "delete");
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
