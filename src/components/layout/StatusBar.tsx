import { User, LogOut, Cloud, CloudOff, X } from "lucide-react";
import { NotificationBell } from "../shared/NotificationBell";
import { RetroButtons } from "./RetroButtons";
import { AdminModeButton } from "./AdminModeButton";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export interface StatusBarProps {
  /** Title displayed in the status bar (used by RetroButtons in full variant, centered in mini variant) */
  title: string;
  /** Current view state for navigation */
  currentView?: any;
  /** Navigation handler */
  onViewChange?: (view: any) => void;
  /** Cloud sync status indicator */
  syncStatus?: "synced" | "syncing" | "offline" | "error";
  /** Current user */
  user?: { id: string; email: string; name?: string } | null;
  /** User role for admin features */
  userRole?: "user" | "admin";
  /** Logout handler */
  onLogout?: () => void;
  /** Sign in handler (shows Sign In button when no user) */
  onSignIn?: () => void;
  /** Variant: "full" for main app bar, "mini" for modals/dialogs */
  variant?: "full" | "mini";
  /** Close handler for mini variant */
  onClose?: () => void;
}

export function StatusBar({
  title,
  currentView,
  onViewChange,
  syncStatus,
  user,
  userRole,
  onLogout,
  onSignIn,
  variant = "full",
  onClose,
}: StatusBarProps) {
  // Mini variant for modals - simplified with just close button and title
  if (variant === "mini") {
    return (
      <div className="h-8 bg-[#faf7f2] dark:bg-[#2a2825] border-b-[1.5px] border-[#211f1c] dark:border-white/20 flex items-center justify-center relative">
        {/* Close Button - Red circle on left */}
        {onClose && (
          <button
            onClick={onClose}
            className="group absolute left-2 w-[11px] h-[11px] cursor-pointer"
            aria-label="Close"
          >
            <div className="absolute inset-[-8.333%] arcade-fill-red">
              <svg
                className="block size-full"
                fill="none"
                preserveAspectRatio="none"
                viewBox="0 0 14 14"
              >
                <circle
                  cx="7"
                  cy="7"
                  fill="var(--fill-0, #E6BCB5)"
                  r="6.5"
                  stroke="var(--stroke-0, #211F1C)"
                />
              </svg>
            </div>
            {/* X appears on hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <X size={8} className="text-black" strokeWidth={2.5} />
            </div>
          </button>
        )}
        {/* Centered Title */}
        <span className="normal">{title}</span>
      </div>
    );
  }

  // Full variant - main app status bar
  return (
    <header
      className="h-[42px] md:min-w-[400px] relative shrink-0 w-full"
      role="banner"
    >
      <div
        aria-hidden="true"
        className="absolute border-[#211f1c] dark:border-white/20 border-[0px_0px_1.5px] border-solid inset-0 pointer-events-none"
      />
      <div className="size-full">
        <div className="status-bar-layout">
          <RetroButtons title={title} />

          <div className="flex items-center gap-1 md:gap-2">
            {/* User Controls */}
            {!user && onSignIn && (
              <button
                onClick={onSignIn}
                className="px-2 md:px-3 py-1 md:py-1.5 rounded-md border border-[#211f1c] dark:border-white/20 arcade-bg-cyan arcade-btn-cyan hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all text-[10px] md:text-[11px]"
              >
                Sign In
              </button>
            )}
            {user && onViewChange && (
              <>
                <TooltipProvider delayDuration={300}>
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() =>
                          onViewChange({
                            type: "user-profile",
                            userId: user.id,
                          })
                        }
                        className="flex items-center gap-1 px-1.5 md:px-2 py-1 bg-white/50 dark:bg-black/20 rounded-md border border-[#211f1c]/20 dark:border-white/20 hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all cursor-pointer"
                      >
                        <User className="w-3 h-3 md:w-3 md:h-3 normal" />
                        <span className="hidden md:inline text-[10px] normal max-w-[100px] truncate">
                          {user.name || user.email.split("@")[0]}
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      className="bg-black text-white border-black"
                    >
                      <p className="text-[11px]">View profile</p>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
                <NotificationBell
                  userId={user.id}
                  isAdmin={userRole === "admin"}
                />
                {userRole === "admin" && currentView && (
                  <AdminModeButton
                    currentView={currentView}
                    onViewChange={onViewChange}
                  />
                )}
                {onLogout && (
                  <TooltipProvider delayDuration={300}>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={onLogout}
                          className="p-1 md:p-1.5 rounded-md border border-[#211f1c] dark:border-white/20 arcade-bg-red hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all"
                          aria-label="Sign out"
                        >
                          <LogOut className="w-3 h-3 md:w-3 md:h-3 arcade-btn-red" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="bg-black text-white border-black"
                      >
                        <p className="text-[11px]">Sign out</p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                )}
              </>
            )}
          </div>
          {user && syncStatus && (
            <div className="flex items-center justify-center gap-1 md:gap-2 px-1.5 md:px-3 h-full">
              <TooltipProvider delayDuration={300}>
                <UITooltip>
                  <TooltipTrigger
                    aria-label={`Sync status: ${
                      syncStatus === "synced"
                        ? "Synced to cloud"
                        : syncStatus === "syncing"
                        ? "Syncing"
                        : syncStatus === "offline"
                        ? "Working offline"
                        : "Sync error"
                    }`}
                  >
                    {syncStatus === "synced" && (
                      <Cloud
                        className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#4a90a4] dark:text-[#6bb6d0]"
                        aria-hidden="true"
                      />
                    )}
                    {syncStatus === "syncing" && (
                      <Cloud
                        className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#d4b400] dark:text-[#ffd700] animate-pulse"
                        aria-hidden="true"
                      />
                    )}
                    {syncStatus === "offline" && (
                      <CloudOff
                        className="w-3 h-3 md:w-3.5 md:h-3.5 text-black/40 dark:text-white/40"
                        aria-hidden="true"
                      />
                    )}
                    {syncStatus === "error" && (
                      <CloudOff
                        className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#c74444] dark:text-[#ff6b6b]"
                        aria-hidden="true"
                      />
                    )}
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="bg-black text-white border-black"
                  >
                    <p className="text-[11px]">
                      {syncStatus === "synced" && "Synced to cloud"}
                      {syncStatus === "syncing" && "Syncing..."}
                      {syncStatus === "offline" && "Working offline"}
                      {syncStatus === "error" && "Sync error - saved locally"}
                    </p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
