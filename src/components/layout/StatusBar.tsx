import { User, LogOut, Cloud, CloudOff } from "lucide-react";
import { NotificationBell } from "../NotificationBell";
import { RetroButtons } from "./RetroButtons";
import { AdminModeButton } from "./AdminModeButton";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export interface StatusBarProps {
  title: string;
  currentView: any;
  onViewChange: (view: any) => void;
  syncStatus?: "synced" | "syncing" | "offline" | "error";
  user?: { id: string; email: string; name?: string } | null;
  userRole?: "user" | "admin";
  onLogout?: () => void;
  onSignIn?: () => void;
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
}: StatusBarProps) {
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
        <div className="box-border content-stretch flex h-[42px] items-center justify-between px-[5px] py-0 relative w-full">
          <RetroButtons title={title} />

          <div className="flex items-center gap-1 md:gap-2">
            {/* User Controls */}
            {!user && onSignIn && (
              <button
                onClick={onSignIn}
                className="px-2 md:px-3 py-1 md:py-1.5 rounded-md border border-[#211f1c] dark:border-white/20 bg-[#b8c8cb] hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all font-['Sniglet:Regular',_sans-serif] text-[10px] md:text-[11px] text-black"
              >
                Sign In
              </button>
            )}
            {user && (
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
                        <User className="w-3 h-3 md:w-[12px] md:h-[12px] text-black dark:text-white" />
                        <span className="hidden md:inline font-['Sniglet:Regular',_sans-serif] text-[10px] text-black dark:text-white max-w-[100px] truncate">
                          {user.name || user.email.split("@")[0]}
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      className="bg-black text-white border-black"
                    >
                      <p className="font-['Sniglet:Regular',_sans-serif] text-[11px]">
                        View profile
                      </p>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
                <NotificationBell
                  userId={user.id}
                  isAdmin={userRole === "admin"}
                />
                {userRole === "admin" && (
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
                          className="p-1 md:p-1.5 rounded-md border border-[#211f1c] dark:border-white/20 bg-[#e6beb5] hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all"
                          aria-label="Sign out"
                        >
                          <LogOut className="w-3 h-3 md:w-[12px] md:h-[12px] text-black" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="bg-black text-white border-black"
                      >
                        <p className="font-['Sniglet:Regular',_sans-serif] text-[11px]">
                          Sign out
                        </p>
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
                        className="w-3 h-3 md:w-[14px] md:h-[14px] text-[#4a90a4] dark:text-[#6bb6d0]"
                        aria-hidden="true"
                      />
                    )}
                    {syncStatus === "syncing" && (
                      <Cloud
                        className="w-3 h-3 md:w-[14px] md:h-[14px] text-[#d4b400] dark:text-[#ffd700] animate-pulse"
                        aria-hidden="true"
                      />
                    )}
                    {syncStatus === "offline" && (
                      <CloudOff
                        className="w-3 h-3 md:w-[14px] md:h-[14px] text-black/40 dark:text-white/40"
                        aria-hidden="true"
                      />
                    )}
                    {syncStatus === "error" && (
                      <CloudOff
                        className="w-3 h-3 md:w-[14px] md:h-[14px] text-[#c74444] dark:text-[#ff6b6b]"
                        aria-hidden="true"
                      />
                    )}
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="bg-black text-white border-black"
                  >
                    <p className="font-['Sniglet:Regular',_sans-serif] text-[11px]">
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
