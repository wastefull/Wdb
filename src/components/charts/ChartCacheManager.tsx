/**
 * ChartCacheManager Component
 *
 * Admin tool for managing the chart rasterization cache.
 * Provides cache statistics, manual clearing, and maintenance controls.
 *
 * Phase 8: Performance & Scalability
 */

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Trash2, RefreshCw, HardDrive, Clock, Image } from "lucide-react";
import {
  getCacheStats,
  clearAllCaches,
  clearExpiredCaches,
} from "../../utils/chartCache";
import { toast } from "sonner";
import { logger as log } from "../../utils/logger";
interface CacheStats {
  totalCount: number;
  totalSize: number;
  oldestTimestamp: number;
  newestTimestamp: number;
}

export function ChartCacheManager() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const cacheStats = await getCacheStats();
      setStats(cacheStats);
    } catch (error) {
      log.error("Error loading cache stats:", error);
      toast.error("Failed to load cache statistics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleClearAll = async () => {
    if (
      !confirm(
        "Are you sure you want to clear all cached charts? This cannot be undone."
      )
    ) {
      return;
    }

    setIsClearing(true);
    try {
      await clearAllCaches();
      toast.success("All cached charts cleared");
      await loadStats();
    } catch (error) {
      log.error("Error clearing cache:", error);
      toast.error("Failed to clear cache");
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearExpired = async () => {
    setIsClearing(true);
    try {
      const deletedCount = await clearExpiredCaches();
      toast.success(
        `Cleared ${deletedCount} expired chart${deletedCount !== 1 ? "s" : ""}`
      );
      await loadStats();
    } catch (error) {
      log.error("Error clearing expired caches:", error);
      toast.error("Failed to clear expired caches");
    } finally {
      setIsClearing(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading cache statistics...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg">Chart Cache Management</h3>
        <Button
          onClick={loadStats}
          variant="outline"
          size="sm"
          disabled={isLoading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Image className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-sm text-black/60 dark:text-white/60">
                Cached Charts
              </p>
              <p className="text-2xl font-bold">{stats?.totalCount || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <HardDrive className="h-5 w-5 text-purple-600 dark:text-purple-300" />
            </div>
            <div>
              <p className="text-sm text-black/60 dark:text-white/60">
                Cache Size
              </p>
              <p className="text-2xl font-bold">
                {formatBytes(stats?.totalSize || 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Clock className="h-5 w-5 text-green-600 dark:text-green-300" />
            </div>
            <div>
              <p className="text-sm text-black/60 dark:text-white/60">
                Oldest Cache
              </p>
              <p className="text-xs font-bold">
                {formatDate(stats?.oldestTimestamp || 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600 dark:text-orange-300" />
            </div>
            <div>
              <p className="text-sm text-black/60 dark:text-white/60">
                Newest Cache
              </p>
              <p className="text-xs font-bold">
                {formatDate(stats?.newestTimestamp || 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <Card className="p-6">
        <h4 className="mb-4">Cache Maintenance</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <p className="font-medium">Clear Expired Caches</p>
              <p className="text-sm text-black/60 dark:text-white/60">
                Remove caches older than 7 days
              </p>
            </div>
            <Button
              onClick={handleClearExpired}
              variant="outline"
              disabled={isClearing || !stats || stats.totalCount === 0}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear Expired
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div>
              <p className="font-medium">Clear All Caches</p>
              <p className="text-sm text-black/60 dark:text-white/60">
                Remove all cached charts (they will regenerate on next view)
              </p>
            </div>
            <Button
              onClick={handleClearAll}
              variant="destructive"
              disabled={isClearing || !stats || stats.totalCount === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>
      </Card>

      {/* Information */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-900/20">
        <h4 className="mb-2">About Chart Caching</h4>
        <div className="text-sm space-y-2 text-black/70 dark:text-white/70">
          <p>
            Chart rasterization converts SVG visualizations to cached images,
            improving performance especially when displaying many materials with
            complex visualizations.
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              Caches are automatically invalidated when material data changes
            </li>
            <li>Caches expire after 7 days and are automatically cleaned up</li>
            <li>
              Caches are stored in IndexedDB and persist across browser sessions
            </li>
            <li>
              All accessibility features (ARIA labels, keyboard navigation) are
              preserved
            </li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
