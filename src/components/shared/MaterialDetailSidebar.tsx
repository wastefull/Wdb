import { Material } from "../../types/material";
import { CopyPermalinkButton } from "./CopyPermalinkButton";
import { LinkedMaterialsCard } from "./LinkedMaterialsCard";
import { PeriodicTableCard } from "./PeriodicTableCard";

interface MaterialDetailSidebarProps {
  isElementHub: boolean;
  hasCoverImage: boolean;
  isHub: boolean;
  linkedMaterials: Material[];
  copied: boolean;
  onCopyMaterialLink: () => void;
}

export function MaterialDetailSidebar({
  isElementHub,
  hasCoverImage,
  isHub,
  linkedMaterials,
  copied,
  onCopyMaterialLink,
}: MaterialDetailSidebarProps) {
  return (
    <div
      className={`${isHub ? "bg-black/5 dark:bg-white/10 transition-colors rounded-md" : ""} pl-4 pt-4 mr-50 min-w-xs xs:mr-0 md:mr-75 lg:mr-100 xl:mr-150`}
    >
      <PeriodicTableCard
        isElementHub={isElementHub}
        hasCoverImage={hasCoverImage}
      />
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
