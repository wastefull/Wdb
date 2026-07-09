import { useNavigationContext } from "../../contexts/NavigationContext";

export interface LinkedMaterialLink {
  id: string;
  materialId: string;
  materialName: string;
  relationshipType: string;
  direction: "inbound" | "outbound";
  source: "relationship" | "hub";
}

interface LinkedMaterialsCardProps {
  linkedRelationships: LinkedMaterialLink[];
  currentMaterialName: string;
}

function formatRelationshipType(relationshipType: string): string {
  return relationshipType.replaceAll("_", " ").toUpperCase();
}

const relationshipPillClassName =
  "mx-1 inline-flex items-center rounded-full border border-waste-science/50 bg-waste-science px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-black shadow-sm dark:border-waste-science/40 dark:bg-waste-science dark:text-black";

export function LinkedMaterialsCard({
  linkedRelationships,
  currentMaterialName,
}: LinkedMaterialsCardProps) {
  const { navigateToMaterialDetail } = useNavigationContext();

  if (linkedRelationships.length === 0) return null;

  return (
    <div className="mb-6 pl-4">
      <p className="mb-2 text-sm uppercase tracking-[0.08em] text-black/50">
        Related Materials
      </p>
      <div className="flex flex-col gap-2">
        {linkedRelationships.map((relationship) => (
          <button
            key={relationship.id}
            type="button"
            onClick={() => navigateToMaterialDetail(relationship.materialId)}
            className="retro-btn-primary inline-flex w-fit max-w-full items-center rounded-full border border-[#211f1c] bg-white px-3 py-1.5 text-left text-sm text-black/80 transition-colors hover:bg-black/5 dark:border-white/20 dark:bg-[#2a2825] dark:text-white/80 dark:hover:bg-white/10 cursor-pointer"
          >
            <span className="whitespace-normal leading-snug">
              {(() => {
                const { left, verb, right } = (() => {
                  const relatedMaterialName = relationship.materialName;
                  const relationshipType = formatRelationshipType(
                    relationship.relationshipType,
                  );

                  if (relationship.direction === "inbound") {
                    return {
                      left: relatedMaterialName,
                      verb: relationshipType,
                      right: currentMaterialName,
                    };
                  }

                  return {
                    left: currentMaterialName,
                    verb: relationshipType,
                    right: relatedMaterialName,
                  };
                })();

                return (
                  <>
                    {left}{" "}
                    <span className={relationshipPillClassName}>
                      {verb}
                    </span>{" "}
                    {right}
                  </>
                );
              })()}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
