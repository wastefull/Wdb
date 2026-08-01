import { useAdminMode } from "../../contexts/AdminModeContext";
import { Switch } from "../ui/switch";

export interface AdminModeButtonProps {
  currentView: any;
  onViewChange: (view: any) => void;
}

export function AdminModeButton({
  currentView,
  onViewChange,
}: AdminModeButtonProps) {
  const { isToggledOn, toggle: toggleAdminMode } = useAdminMode();

  const handleAdminToggle = () => {
    // If turning off admin mode and currently on admin-only pages, go back to materials
    if (
      isToggledOn &&
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
      className={`flex items-center gap-1 rounded-md border border-[#211f1c] overflow-hidden ${
        isToggledOn
          ? "arcade-bg-green shadow-[2px_2px_0px_0px_#000000]"
          : "arcade-bg-red"
      }`}
    >
      <button
        onClick={handleNavigateToDashboard}
        className={`px-2 py-1 text-xs uppercase hover:opacity-70 transition-opacity ${
          isToggledOn ? "arcade-btn-green" : "arcade-btn-red"
        }`}
      >
        Admin
      </button>
      <div className="w-px h-4 bg-[#211f1c]/20" />
      <div className="px-1.5 py-1">
        <Switch
          checked={isToggledOn}
          onCheckedChange={handleAdminToggle}
          className="scale-75"
          aria-label={
            isToggledOn ? "Disable admin mode" : "Enable admin mode"
          }
        />
      </div>
    </div>
  );
}
