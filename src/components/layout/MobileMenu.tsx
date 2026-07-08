import {
  Menu,
  Cloud,
  CloudOff,
  LogOut,
  User,
  Bell,
  Shield,
  Briefcase,
} from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";

export function MobileMenu({
  mobileMenuOpen,
  setMobileMenuOpen,
  syncStatus,
  onLogout,
  onViewChange,
  currentView,
  user,
  userRole,
  settings,
}: {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  syncStatus?: "synced" | "syncing" | "offline" | "error";
  onLogout?: () => void;
  onViewChange?: (view: any) => void;
  currentView?: any;
  user?: { id: string; email: string; name?: string } | null;
  userRole?: "admin" | "staff" | "user" | null;
  settings?: { adminMode: boolean };
}) {
  if (!onViewChange || !user) return null;
  return (
    <>
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild>
          <button
            className="p-1.5 rounded-md border border-[#211f1c] dark:border-white/20 bg-white/50 dark:bg-black/20 hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all"
            aria-label="Open menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        </SheetTrigger>
        <SheetContent
          side="top"
          className="bg-[#faf7f2] dark:bg-[#2a2825] border-t-[1.5px] border-[#211f1c] dark:border-white/20 rounded-t-xl px-6 max-h-[85svh] overflow-hidden"
          aria-describedby="mobile-menu-description"
        >
          <div id="mobile-menu-description" className="sr-only">
            Mobile menu with sync status, navigation, and quick logout options.
          </div>
          <SheetHeader className="shrink-0 border-b border-[#211f1c]/20 dark:border-white/20 pb-4">
            <div className="flex items-center justify-between">
              {/* Sync Status - left side */}
              <div className="flex items-center gap-1.5 text-sm text-black/50 dark:text-white/50 min-w-17.5">
                {syncStatus && (
                  <>
                    {syncStatus === "synced" && (
                      <>
                        <Cloud className="w-3 h-3" />
                        <span>Synced</span>
                      </>
                    )}
                    {syncStatus === "syncing" && (
                      <>
                        <Cloud className="w-3 h-3 animate-pulse" />
                        <span>Syncing...</span>
                      </>
                    )}
                    {syncStatus === "offline" && (
                      <>
                        <CloudOff className="w-3 h-3" />
                        <span>Offline</span>
                      </>
                    )}
                    {syncStatus === "error" && (
                      <>
                        <CloudOff className="w-3 h-3 text-[#c74444] dark:text-[#ff6b6b]" />
                        <span className="text-[#c74444] dark:text-[#ff6b6b]">
                          Sync error
                        </span>
                      </>
                    )}
                  </>
                )}
              </div>
              {/* Title - center */}
              <SheetTitle className="font-display">Menu</SheetTitle>
              {/* Quick logout on the right so it stays accessible without scrolling */}
              {onLogout ? (
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-md border border-[#211f1c] dark:border-white/20 arcade-bg-red hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all"
                  aria-label="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5 arcade-btn-red" />
                  <span className="text-[11px] font-medium arcade-btn-red uppercase">
                    Sign out
                  </span>
                </button>
              ) : (
                <div className="min-w-17.5" />
              )}
            </div>
          </SheetHeader>
          <div className="flex flex-col gap-2 p-4 grow min-h-0 overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]">
            {/* Profile */}
            <button
              onClick={() => {
                onViewChange({
                  type: "user-profile",
                  userId: user.id,
                });
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 p-3 rounded-lg border border-[#211f1c]/20 dark:border-white/20 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 transition-colors"
            >
              <User className="w-5 h-5" />
              <div className="flex flex-col items-start">
                <span className="text-[13px] font-medium">
                  {user.name || user.email.split("@")[0]}
                </span>
                <span className="text-sm text-black/60 dark:text-white/60">
                  View profile
                </span>
              </div>
            </button>

            {/* Notifications */}
            <button
              onClick={() => {
                // NotificationBell handles its own panel, so we just close menu
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 p-3 rounded-lg border border-[#211f1c]/20 dark:border-white/20 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="text-[13px] font-medium">Notifications</span>
            </button>

            {/* Admin Mode (if admin) */}
            {userRole === "admin" && currentView && (
              <button
                onClick={() => {
                  onViewChange({ type: "admin-dashboard" });
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 p-3 rounded-lg border border-[#211f1c]/20 dark:border-white/20 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 transition-colors"
              >
                <Shield className="w-5 h-5" />
                <span className="text-[13px] font-medium">Admin Dashboard</span>
              </button>
            )}

            {/* Staff Dashboard (if staff, or admin with admin mode on) */}
            {(userRole === "staff" ||
              (userRole === "admin" && settings && settings.adminMode)) &&
              currentView && (
                <button
                  onClick={() => {
                    onViewChange({ type: "staff-dashboard" });
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 p-3 rounded-lg border border-[#211f1c]/20 dark:border-white/20 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 transition-colors"
                >
                  <Briefcase className="w-5 h-5" />
                  <span className="text-[13px] font-medium">
                    Staff Dashboard
                  </span>
                </button>
              )}

            {/* Sign Out */}
            {onLogout && (
              <button
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 p-3 rounded-lg border border-[#211f1c] dark:border-white/20 arcade-bg-red hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all mt-2"
              >
                <LogOut className="w-5 h-5 arcade-btn-red" />
                <span className="text-[13px] font-medium arcade-btn-red">
                  Sign Out
                </span>
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
