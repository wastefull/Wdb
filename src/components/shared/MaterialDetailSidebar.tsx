import { Material } from "../../types/material";
import type { PublicMaterialRelationshipResource } from "../../types/manualMaterialRelationship";
import { useMemo } from "react";
import { CopyPermalinkButton } from "./CopyPermalinkButton";
import {
  LinkedMaterialsCard,
  type LinkedMaterialLink,
} from "./LinkedMaterialsCard";
import { MaterialDoodle } from "./MaterialDoodle";
import { PeriodicTableCard } from "./PeriodicTableCard";
import { useNavigationContext } from "../../contexts/NavigationContext";

interface MaterialDetailSidebarProps {
  materialId: string;
  isElementHub: boolean;
  isHub: boolean;
  linkedRelationships: PublicMaterialRelationshipResource[];
  parentHubs: Material[];
  materialName: string;
  copied: boolean;
  onCopyMaterialLink: () => void;
}

export function MaterialDetailSidebar({
  materialId,
  isElementHub,
  isHub,
  linkedRelationships,
  parentHubs,
  materialName,
  copied,
  onCopyMaterialLink,
}: MaterialDetailSidebarProps) {
  const { navigateToMaterialDetail } = useNavigationContext();
  const linkedMaterials = useMemo<LinkedMaterialLink[]>(() => {
    const relationshipPriority: Record<string, number> = {
      contains: 0,
      feedstock_for: 1,
      derived_from: 2,
      recycled_by: 3,
      related_to: 4,
    };

    const byMaterialName = new Map<string, LinkedMaterialLink>();
    const getMaterialKey = (link: LinkedMaterialLink) =>
      link.materialName.trim().toLowerCase();

    const getPriority = (link: LinkedMaterialLink) => {
      if (link.source === "hub") return 100;
      return relationshipPriority[link.relationshipType] ?? 50;
    };

    const consider = (link: LinkedMaterialLink) => {
      const key = getMaterialKey(link);
      const current = byMaterialName.get(key);
      if (
        !current ||
        getPriority(link) < getPriority(current) ||
        (getPriority(link) === getPriority(current) &&
          current.source === "hub" &&
          link.source === "relationship")
      ) {
        byMaterialName.set(key, link);
      }
    };

    for (const relationship of linkedRelationships) {
      consider({
        id: relationship.id,
        materialId: relationship.materialId,
        materialName: relationship.materialName,
        relationshipType: relationship.relationshipType,
        direction: relationship.direction,
        source: "relationship",
      });
    }

    for (const hub of parentHubs) {
      consider({
        id: `hub:${hub.id}`,
        materialId: hub.id,
        materialName: hub.name,
        relationshipType: "related_to",
        direction: "inbound",
        source: "hub",
      });
    }

    return [...byMaterialName.values()].sort(
      (left, right) =>
        getPriority(left) - getPriority(right) ||
        left.materialName.localeCompare(right.materialName),
    );
  }, [linkedRelationships, parentHubs]);

  return (
    <div className={`sidebar ${isHub ? "hub-sidebar" : "normal"}`}>
      <PeriodicTableCard isElementHub={isElementHub} />

      {linkedMaterials.length > 0 && (
        <div className="hub-container">
          <p className="mb-2 text-sm uppercase tracking-[0.08em] text-black/50">
            Linked To
          </p>
          <div className="parents">
            {/* TODO: replace this naive stacked graph with a denser layout when more linkages are present. */}
            {linkedMaterials.map((linkedMaterial) => (
              <div className="parent" key={linkedMaterial.id}>
                <button
                  type="button"
                  onClick={() =>
                    navigateToMaterialDetail(linkedMaterial.materialId)
                  }
                >
                  {linkedMaterial.materialName}
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
        <LinkedMaterialsCard
          linkedRelationships={linkedMaterials}
          currentMaterialName={materialName}
        />
      )}
      {linkedMaterials.length > 0 && <hr />}

      <CopyPermalinkButton
        copied={copied}
        onClick={onCopyMaterialLink}
        linkType="material"
      />
    </div>
  );
}
