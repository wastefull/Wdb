import { Material } from "../../types/material";
import { CopyPermalinkButton } from "./CopyPermalinkButton";
import { LinkedMaterialsCard } from "./LinkedMaterialsCard";
import { PeriodicTableCard } from "./PeriodicTableCard";
import { useNavigationContext } from "../../contexts/NavigationContext";

interface MaterialDetailSidebarProps {
  isElementHub: boolean;
  hasCoverImage: boolean;
  isHub: boolean;
  linkedMaterials: Material[];
  parentHubs: Material[];
  materialName: string;
  copied: boolean;
  onCopyMaterialLink: () => void;
}

export function MaterialDetailSidebar({
  isElementHub,
  hasCoverImage,
  isHub,
  linkedMaterials,
  parentHubs,
  materialName,
  copied,
  onCopyMaterialLink,
}: MaterialDetailSidebarProps) {
  const { navigateToMaterialDetail } = useNavigationContext();

  return (
    <div
      className={`${isHub ? "bg-black/5 dark:bg-white/10 transition-colors rounded-md" : ""} pl-4 pt-4 col-start-1 col-end-3 min-w-67`}
    >
      <PeriodicTableCard
        isElementHub={isElementHub}
        hasCoverImage={hasCoverImage}
      />

      {/* Parent hub hierarchy */}
      {parentHubs.length > 0 && (
        <div className="mb-5">
          <p className="text-[11px] uppercase tracking-[0.08em] text-black/50 dark:text-white/40 mb-2">
            Linked to
          </p>
          <div className="flex flex-col gap-1">
            {parentHubs.map((hub) => (
              <div key={hub.id} className="flex flex-col items-start">
                <button
                  type="button"
                  onClick={() => navigateToMaterialDetail(hub.id)}
                  className="retro-btn-primary px-2 py-1 rounded-md border border-[#211f1c] dark:border-white/20 text-[11px] text-black/80 dark:text-white/80 bg-white dark:bg-[#2a2825] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  {hub.name}
                </button>
                {/* Connector line */}
                <div className="ml-3 flex flex-col items-center">
                  <div className="w-px h-3 bg-black/20 dark:bg-white/20" />
                  <div className="w-1.5 h-1.5 rounded-full bg-black/20 dark:bg-white/20" />
                </div>
              </div>
            ))}
            {/* Current material label */}
            <span className="ml-1 text-[11px] text-black/60 dark:text-white/50 font-medium">
              {materialName}
            </span>
          </div>
        </div>
      )}

      {isHub && <LinkedMaterialsCard linkedMaterials={linkedMaterials} />}
      {isHub && (
        <hr className="border-black/10 dark:border-white/10 w-auto pb-4" />
      )}
      <CopyPermalinkButton
        copied={copied}
        onClick={onCopyMaterialLink}
        linkType="material"
      />
    </div>
  );
}
