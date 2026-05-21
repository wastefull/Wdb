import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Power,
  Clock,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import * as api from "../../utils/api";
import type { MaintenanceStatus } from "../../utils/api";

interface MaintenanceModePanelProps {
  onBack: () => void;
}

function useCountUp(startedAt: number | null): string {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt) {
      setElapsed(0);
      return;
    }
    const tick = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function MaintenanceModePanel({ onBack }: MaintenanceModePanelProps) {
  const [status, setStatus] = useState<MaintenanceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [confirmEnable, setConfirmEnable] = useState(false);

  const elapsed = useCountUp(
    status?.enabled ? (status.startedAt ?? null) : null,
  );

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const s = await api.getMaintenanceMode();
      setStatus(s);
    } catch {
      toast.error("Failed to load maintenance status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleToggle = async (enable: boolean) => {
    setConfirmEnable(false);
    setToggling(true);
    try {
      const updated = await api.setMaintenanceMode(enable);
      setStatus(updated);
      toast.success(
        enable ? "Maintenance mode enabled" : "Site is back online",
      );
    } catch {
      toast.error("Failed to update maintenance mode");
    } finally {
      setToggling(false);
    }
  };

  const isEnabled = status?.enabled ?? false;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-[#211f1c]/10 dark:border-white/10 p-6 flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 normal hover:opacity-70 transition-opacity"
        >
          <ArrowLeft size={16} />
          <span className="text-sm">Back</span>
        </button>
        <h1 className="text-lg font-bold tracking-tight">Maintenance Mode</h1>
      </div>

      <div className="flex-1 p-8 max-w-xl mx-auto w-full">
        {/* Status card */}
        <div
          className={`retro-card p-6 mb-6 transition-colors duration-500 ${
            isEnabled
              ? "border-orange-400/60 bg-orange-50/50 dark:bg-orange-950/20"
              : "border-green-400/60 bg-green-50/50 dark:bg-green-950/20"
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            {isEnabled ? (
              <AlertTriangle size={22} className="text-orange-500 shrink-0" />
            ) : (
              <CheckCircle size={22} className="text-green-500 shrink-0" />
            )}
            <div>
              <p className="font-semibold text-sm">
                Site is currently{" "}
                <span
                  className={
                    isEnabled
                      ? "text-orange-600 dark:text-orange-400"
                      : "text-green-600 dark:text-green-400"
                  }
                >
                  {isEnabled ? "in maintenance" : "live"}
                </span>
              </p>
              <p className="text-xs opacity-60 mt-0.5">
                {isEnabled
                  ? "Non-admin visitors see the maintenance page"
                  : "All visitors can access the site normally"}
              </p>
            </div>
          </div>

          {/* Count-up timer */}
          {isEnabled && status?.startedAt && (
            <div className="flex items-center gap-2 mt-4 bg-black/5 dark:bg-white/5 rounded-lg p-3">
              <Clock size={14} className="text-orange-500 shrink-0" />
              <span className="text-xs opacity-70 mr-1">Down for</span>
              <span className="font-mono font-bold text-orange-600 dark:text-orange-400 tracking-widest text-sm">
                {elapsed}
              </span>
            </div>
          )}
        </div>

        {/* Toggle controls */}
        {loading ? (
          <div className="text-center py-8 opacity-50 text-sm">Loading…</div>
        ) : confirmEnable ? (
          /* Confirmation step */
          <div className="retro-card border-orange-400/60 p-5">
            <p className="font-semibold text-sm mb-1">
              Enable maintenance mode?
            </p>
            <p className="text-xs opacity-60 mb-4">
              Non-admin users will immediately see the maintenance page. You can
              disable it at any time from this panel.
            </p>
            <div className="flex gap-3">
              <button
                className="retro-btn-primary bg-orange-500 hover:bg-orange-600 border-orange-600 text-white text-sm px-4 py-2 flex-1"
                onClick={() => handleToggle(true)}
                disabled={toggling}
              >
                {toggling ? "Enabling…" : "Yes, enable now"}
              </button>
              <button
                className="retro-btn-primary text-sm px-4 py-2 flex-1"
                onClick={() => setConfirmEnable(false)}
                disabled={toggling}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            className={`w-full flex items-center justify-center gap-3 py-3 rounded-lg font-semibold text-sm transition-all border-2 ${
              isEnabled
                ? "bg-green-500 hover:bg-green-600 border-green-600 text-white"
                : "bg-orange-500 hover:bg-orange-600 border-orange-600 text-white"
            } ${toggling ? "opacity-60 cursor-not-allowed" : ""}`}
            onClick={() => {
              if (isEnabled) {
                handleToggle(false);
              } else {
                setConfirmEnable(true);
              }
            }}
            disabled={toggling}
          >
            <Power size={16} />
            {toggling
              ? isEnabled
                ? "Disabling…"
                : "Enabling…"
              : isEnabled
                ? "Disable maintenance mode"
                : "Enable maintenance mode"}
          </button>
        )}

        <p className="text-xs opacity-40 text-center mt-6">
          Admins always bypass maintenance mode and can access the site
          normally.
        </p>
      </div>
    </div>
  );
}
