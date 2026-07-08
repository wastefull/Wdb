import { memo, useState } from "react";
import {
  User,
  LogOut,
  Cloud,
  CloudOff,
  X,
  Menu,
  Bell,
  Shield,
  Briefcase,
} from "lucide-react";
import { NotificationBell } from "../shared/NotificationBell";
import { RetroButtons } from "./RetroButtons";
import { AdminModeButton } from "./AdminModeButton";
import { useAccessibility } from "../shared/AccessibilityContext";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "../ui/sheet";
import { MobileMenu } from "./MobileMenu";

export interface StatusBarProps {
  /** Title displayed in the status bar (used by RetroButtons in full variant, centered in mini variant) */
  title: string;
  /** Optional second part of title */
  titlePop?: string;
  version?: string;
  /** Current view state for navigation */
  currentView?: any;
  /** Navigation handler */
  onViewChange?: (view: any) => void;
  /** Cloud sync status indicator */
  syncStatus?: "synced" | "syncing" | "offline" | "error";
  /** Current user */
  user?: { id: string; email: string; name?: string } | null;
  /** User role for admin features */
  userRole?: "user" | "staff" | "admin";
  /** Logout handler */
  onLogout?: () => void;
  /** Sign in handler (shows Sign In button when no user) */
  onSignIn?: () => void;
  /** Variant: "full" for main app bar, "mini" for modals/dialogs */
  variant?: "full" | "mini";
  /** Close handler for mini variant */
  onClose?: () => void;
}

export const StatusBar = memo(function StatusBar({
  title,
  titlePop,
  version,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { settings } = useAccessibility();

  // Mini variant for modals - simplified with just close button and title
  if (variant === "mini") {
    return (
      <div className="h-9 bg-[#faf7f2] dark:bg-[#2a2825] border-b-[1.5px] border-[#211f1c] dark:border-white/20 flex items-center justify-center relative">
        {/* Close Button - Red circle on left */}
        {onClose && (
          <button
            onClick={onClose}
            className="group absolute left-2 w-4.5 h-4.5 cursor-pointer"
            aria-label="Close"
          >
            <div className="absolute inset-0 arcade-fill-red">
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
                  r="6"
                  stroke="var(--stroke-0, #211F1C)"
                />
              </svg>
            </div>
            {/* X appears on hover */}
            <X
              size={10}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-black opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ willChange: "opacity" }}
              strokeWidth={2.5}
            />
          </button>
        )}
        {/* Centered Title */}
        <span className="normal">{title}</span>
        <span className="normal arcade-btn-green">{titlePop}</span>
        <span className="normal">{version}</span>
      </div>
    );
  }

  // Full variant - main app status bar
  return (
    <header
      className="h-10.5 md:min-w-100 relative shrink-0 w-full"
      role="banner"
    >
      <div
        aria-hidden="true"
        className="absolute border-[#211f1c] dark:border-white/20 border-[0px_0px_1.5px] border-solid inset-0 pointer-events-none"
      />
      <div className="size-full">
        <div className="status-bar-layout">
          <RetroButtons title={title} titlePop={titlePop} version={version} />

          <div className="flex items-center gap-1 md:gap-2">
            {/* User Controls */}
            {!user && onSignIn && (
              <button
                onClick={onSignIn}
                className="px-2 md:px-3 py-1 md:py-1.5 rounded-md border border-[#211f1c] dark:border-white/20 arcade-bg-cyan arcade-btn-cyan hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all text-xs md:text-sm"
              >
                Sign In
              </button>
            )}

            {/* Mobile Menu (< 768px) */}
            {user && onViewChange && (
              <div className="md:hidden">
                <MobileMenu
                  mobileMenuOpen={mobileMenuOpen}
                  setMobileMenuOpen={setMobileMenuOpen}
                  onViewChange={onViewChange}
                  onLogout={onLogout}
                  syncStatus={syncStatus}
                  user={user}
                  currentView={currentView}
                  userRole={userRole}
                  settings={settings}
                />
              </div>
            )}

            {/* Desktop Controls (>= 768px) */}
            {user && onViewChange && (
              <div className="hidden md:flex items-center gap-2">
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
                        className="flex items-center gap-1 px-2 py-1 bg-white/50 dark:bg-black/20 rounded-md border border-[#211f1c]/20 dark:border-white/20 hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all cursor-pointer"
                      >
                        <User className="w-3 h-3 normal" />
                        <span className="text-xs normal max-w-25 truncate">
                          {user.name || user.email.split("@")[0]}
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      className="bg-black text-white border-black"
                    >
                      <p className="text-sm">View profile</p>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
                <NotificationBell
                  userId={user.id}
                  isAdmin={userRole === "admin"}
                  onNavigate={onViewChange}
                />
                {userRole === "admin" && currentView && (
                  <AdminModeButton
                    currentView={currentView}
                    onViewChange={onViewChange}
                  />
                )}
                {(userRole === "staff" ||
                  (userRole === "admin" && settings.adminMode)) &&
                  currentView && (
                    <TooltipProvider delayDuration={300}>
                      <UITooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() =>
                              onViewChange({ type: "staff-dashboard" })
                            }
                            className="flex items-center gap-1 px-2 py-1 rounded-md border border-[#211f1c] dark:border-white/20 arcade-bg-cyan hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all"
                          >
                            <Briefcase className="w-3 h-3" />
                            <span className="text-xs uppercase arcade-btn-cyan">
                              Staff
                            </span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="bottom"
                          className="bg-black text-white border-black"
                        >
                          <p className="text-sm">Staff Dashboard</p>
                        </TooltipContent>
                      </UITooltip>
                    </TooltipProvider>
                  )}
                {onLogout && (
                  <TooltipProvider delayDuration={300}>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={onLogout}
                          className="p-1.5 rounded-md border border-[#211f1c] text-black  dark:border-white/20 arcade-bg-red hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all"
                          aria-label="Sign out"
                        >
                          <LogOut className="w-3 h-3 dark:text-black text-black" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="bg-black text-white border-black"
                      >
                        <p className="text-sm">Sign out</p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                )}
              </div>
            )}
          </div>
          {/* Sync Status - Desktop only (shown in mobile menu) */}
          {user && syncStatus && (
            <div className="hidden md:flex items-center justify-center gap-2 px-3 h-full">
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
                    <p className="text-sm">
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
});
