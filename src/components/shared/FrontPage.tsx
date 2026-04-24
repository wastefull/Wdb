import { Material } from "../../types/material";
import { useNavigationContext } from "../../contexts/NavigationContext";
import { useAuthContext } from "../../contexts/AuthContext";
import { useMaterialsContext } from "../../contexts/MaterialsContext";
import { useAccessibility } from "./AccessibilityContext";
import { SearchBar } from "../search";
import type { SearchSuggestion } from "../search/SearchBar";
import { MaterialForm } from "../forms";
import { LoadingPlaceholder } from "./LoadingPlaceholder";
import { LogoLink } from "./LogoLink";
import { MaterialsDonutChart } from "./MaterialsDonutChart";
import { OfflineNoticeBox } from "./OfflineNoticeBox";
import { Welcome } from "./Welcome";

interface FrontPageProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  suggestions: SearchSuggestion[];
  showForm: boolean;
  setShowForm: (show: boolean) => void;
  editingMaterial: Material | null;
  setEditingMaterial: (m: Material | null) => void;
  onAddMaterial: (data: Omit<Material, "id">) => Promise<void>;
  onUpdateMaterial: (data: Omit<Material, "id"> | Material) => Promise<void>;
}

export function FrontPage({
  searchQuery,
  setSearchQuery,
  suggestions,
  showForm,
  setShowForm,
  editingMaterial,
  setEditingMaterial,
  onAddMaterial,
  onUpdateMaterial,
}: FrontPageProps) {
  const { navigateTo, navigateToSearchResults, navigateToUserProfile } =
    useNavigationContext();
  const { user, userRole } = useAuthContext();
  const { materials, isLoadingMaterials, syncStatus, retrySync } =
    useMaterialsContext();
  const { settings } = useAccessibility();

  const isAdminModeActive = !!(
    user &&
    userRole === "admin" &&
    settings.adminMode
  );

  return (
    <div className="p-3">
      {/* Sync error/offline banner - only show for authenticated users */}
      {user && (syncStatus === "error" || syncStatus === "offline") && (
        <OfflineNoticeBox syncStatus={syncStatus} onRetry={retrySync} />
      )}

      {/* Centered content */}
      <div className="flex flex-col items-center justify-center mb-6 max-w-2xl mx-auto px-4">
        <div className="w-full flex flex-col justify-center items-center gap-4">
          {/* Logo */}
          <LogoLink
            onNavigateHome={() => {
              setSearchQuery("");
              navigateTo({ type: "materials" });
            }}
          />

          {/* Search bar */}
          <div className="w-full max-w-xl">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              suggestions={suggestions}
              onSearch={(query) => {
                if (!query) setSearchQuery("");
                navigateToSearchResults(query);
              }}
            />
          </div>

          {/* Chart */}
          <MaterialsDonutChart />
        </div>
      </div>

      {showForm && (
        <div className="mb-6">
          <MaterialForm
            material={editingMaterial || undefined}
            onSave={editingMaterial ? onUpdateMaterial : onAddMaterial}
            onCancel={() => {
              setShowForm(false);
              setEditingMaterial(null);
            }}
            isAdminMode={isAdminModeActive}
          />
        </div>
      )}

      {/* Welcome message */}
      {isLoadingMaterials ? (
        <LoadingPlaceholder />
      ) : (
        <Welcome
          user={user}
          materials={materials}
          onViewProfile={navigateToUserProfile}
        />
      )}
    </div>
  );
}
