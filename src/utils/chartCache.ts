/**
 * Chart Cache Utility
 *
 * Provides caching infrastructure for rasterized chart visualizations.
 * Uses IndexedDB for storage with automatic cache invalidation.
 *
 * Phase 8: Performance & Scalability
 */

import { ScoreType } from "../components/charts/QuantileVisualization";

export interface CacheKey {
  materialId: string;
  scoreType: ScoreType;
  width: number;
  height: number;
  darkMode: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
  // Data signature for invalidation
  dataHash: string;
}

export interface CachedChart {
  key: CacheKey;
  dataUrl: string;
  timestamp: number;
  version: string; // For cache versioning
}

const DB_NAME = "wastedb-chart-cache";
const STORE_NAME = "charts";
const DB_VERSION = 1;
const CACHE_VERSION = "1.0.0";
const MAX_CACHE_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

let db: IDBDatabase | null = null;

/**
 * Initialize IndexedDB
 */
async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("materialId", "materialId", { unique: false });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
  });
}

/**
 * Generate a unique cache ID from a cache key
 */
function generateCacheId(key: CacheKey): string {
  const parts = [
    key.materialId,
    key.scoreType,
    key.width,
    key.height,
    key.darkMode ? "dark" : "light",
    key.highContrast ? "hc" : "normal",
    key.reduceMotion ? "rm" : "motion",
    key.dataHash,
  ];
  return parts.join("|");
}

/**
 * Generate a hash of the data for cache invalidation
 */
export function generateDataHash(data: any): string {
  const str = JSON.stringify({
    practical_mean: data.practical_mean,
    theoretical_mean: data.theoretical_mean,
    practical_CI95: data.practical_CI95,
    theoretical_CI95: data.theoretical_CI95,
    confidence_level: data.confidence_level,
  });

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

/**
 * Get a cached chart
 */
export async function getCachedChart(key: CacheKey): Promise<string | null> {
  try {
    const db = await initDB();
    const id = generateCacheId(key);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const cached = request.result as CachedChart | undefined;

        if (!cached) {
          resolve(null);
          return;
        }

        // Check if cache is expired
        const age = Date.now() - cached.timestamp;
        if (age > MAX_CACHE_AGE_MS) {
          // Delete expired cache
          deleteCache(key).catch(console.error);
          resolve(null);
          return;
        }

        // Check version
        if (cached.version !== CACHE_VERSION) {
          deleteCache(key).catch(console.error);
          resolve(null);
          return;
        }

        resolve(cached.dataUrl);
      };
    });
  } catch (error) {
    console.error("Error getting cached chart:", error);
    return null;
  }
}

/**
 * Store a chart in cache
 */
export async function setCachedChart(
  key: CacheKey,
  dataUrl: string
): Promise<void> {
  try {
    const db = await initDB();
    const id = generateCacheId(key);

    const cached: CachedChart & { id: string; materialId: string } = {
      id,
      materialId: key.materialId,
      key,
      dataUrl,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(cached);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error("Error setting cached chart:", error);
  }
}

/**
 * Delete a specific cached chart
 */
export async function deleteCache(key: CacheKey): Promise<void> {
  try {
    const db = await initDB();
    const id = generateCacheId(key);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error("Error deleting cache:", error);
  }
}

/**
 * Invalidate all caches for a specific material
 */
export async function invalidateMaterialCache(
  materialId: string
): Promise<void> {
  try {
    const db = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index("materialId");
      const request = index.openCursor(IDBKeyRange.only(materialId));

      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
    });
  } catch (error) {
    console.error("Error invalidating material cache:", error);
  }
}

/**
 * Clear all expired caches
 */
export async function clearExpiredCaches(): Promise<number> {
  try {
    const db = await initDB();
    const cutoff = Date.now() - MAX_CACHE_AGE_MS;
    let deletedCount = 0;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index("timestamp");
      const request = index.openCursor(IDBKeyRange.upperBound(cutoff));

      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };
    });
  } catch (error) {
    console.error("Error clearing expired caches:", error);
    return 0;
  }
}

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<void> {
  try {
    const db = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error("Error clearing all caches:", error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalCount: number;
  totalSize: number;
  oldestTimestamp: number;
  newestTimestamp: number;
}> {
  try {
    const db = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const all = request.result as CachedChart[];

        if (all.length === 0) {
          resolve({
            totalCount: 0,
            totalSize: 0,
            oldestTimestamp: 0,
            newestTimestamp: 0,
          });
          return;
        }

        const totalSize = all.reduce(
          (sum, item) => sum + item.dataUrl.length,
          0
        );
        const timestamps = all.map((item) => item.timestamp);

        resolve({
          totalCount: all.length,
          totalSize,
          oldestTimestamp: Math.min(...timestamps),
          newestTimestamp: Math.max(...timestamps),
        });
      };
    });
  } catch (error) {
    console.error("Error getting cache stats:", error);
    return {
      totalCount: 0,
      totalSize: 0,
      oldestTimestamp: 0,
      newestTimestamp: 0,
    };
  }
}
