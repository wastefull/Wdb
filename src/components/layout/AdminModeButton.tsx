import { useAccessibility } from "../shared/AccessibilityContext";
import { Switch } from "../ui/switch";

export interface AdminModeButtonProps {
  currentView: any;
  onViewChange: (view: any) => void;
}

export function AdminModeButton({
  currentView,
  onViewChange,
}: AdminModeButtonProps) {
  const { settings, toggleAdminMode } = useAccessibility();

  const handleAdminToggle = () => {
    // If turning off admin mode and currently on admin-only pages, go back to materials
    if (
      settings.adminMode &&
      (currentView.type === "data-management" ||
        currentView.type === "user-management" ||
        currentView.type === "scientific-editor" ||
        currentView.type === "whitepaper-sync" ||
        currentView.type === "review-center" ||
        currentView.type === "admin-dashboard" ||
        currentView.type === "audit-log")
    ) {
      onViewChange({ type: "materials" });
    }
    toggleAdminMode();
  };

  const handleNavigateToDashboard = () => {
    onViewChange({ type: "admin-dashboard" });
  };

  return (
    <div
      className={`flex items-center gap-1 rounded-md border border-[#211f1c] dark:border-white/20 overflow-hidden ${
        settings.adminMode
          ? "bg-[#bdd4b7] dark:bg-[#2a2f27] shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]"
          : "bg-[#e6beb5]"
      }`}
    >
      <button
        onClick={handleNavigateToDashboard}
        className="px-2 py-1 font-['Sniglet:Regular',_sans-serif] text-[10px] text-black dark:text-white uppercase hover:opacity-70 transition-opacity"
      >
        Admin
      </button>
      <div className="w-px h-4 bg-[#211f1c]/20 dark:bg-white/20" />
      <div className="px-1.5 py-1">
        <Switch
          checked={settings.adminMode}
          onCheckedChange={handleAdminToggle}
          className="scale-75"
          aria-label={
            settings.adminMode ? "Disable admin mode" : "Enable admin mode"
          }
        />
      </div>
    </div>
  );
}
