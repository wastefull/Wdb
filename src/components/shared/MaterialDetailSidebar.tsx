import { Material } from "../../types/material";
import { CopyPermalinkButton } from "./CopyPermalinkButton";
import { LinkedMaterialsCard } from "./LinkedMaterialsCard";
import { MaterialDoodle } from "./MaterialDoodle";
import { PeriodicTableCard } from "./PeriodicTableCard";
import { useNavigationContext } from "../../contexts/NavigationContext";

interface MaterialDetailSidebarProps {
  materialId: string;
  isElementHub: boolean;
  isHub: boolean;
  linkedMaterials: Material[];
  parentHubs: Material[];
  materialName: string;
  copied: boolean;
  onCopyMaterialLink: () => void;
}

export function MaterialDetailSidebar({
  materialId,
  isElementHub,
  isHub,
  linkedMaterials,
  parentHubs,
  materialName,
  copied,
  onCopyMaterialLink,
}: MaterialDetailSidebarProps) {
  const { navigateToMaterialDetail } = useNavigationContext();

  return (
    <div className={`sidebar ${isHub ? "hub-sidebar" : "normal"}`}>
      <PeriodicTableCard isElementHub={isElementHub} />

      {/* Parent hub hierarchy */}
      {parentHubs.length > 0 && (
        <div className="hub-container">
          <p>Linked to</p>
          <div className="parents">
            {parentHubs.map((hub) => (
              <div className="parent" key={hub.id}>
                <button
                  type="button"
                  onClick={() => navigateToMaterialDetail(hub.id)}
                >
                  {hub.name}
                </button>
                {/* Connector line */}
                <div className="connector">
                  <div className="line" />
                  <div className="dot" />
                </div>
              </div>
            ))}
            {/* Current material label */}
            <span className="material-label">{materialName}</span>
          </div>
        </div>
      )}

      {linkedMaterials.length > 0 && (
        <LinkedMaterialsCard linkedMaterials={linkedMaterials} />
      )}
      {(isHub || linkedMaterials.length > 0) && <hr />}

      <CopyPermalinkButton
        copied={copied}
        onClick={onCopyMaterialLink}
        linkType="material"
      />
    </div>
  );
}
