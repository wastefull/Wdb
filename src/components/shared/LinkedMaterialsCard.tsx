import { useNavigationContext } from "../../contexts/NavigationContext";
import { Material } from "../../types/material";

interface LinkedMaterialsCardProps {
  linkedMaterials: Material[];
}

export function LinkedMaterialsCard({
  linkedMaterials,
}: LinkedMaterialsCardProps) {
  const { navigateToMaterialDetail } = useNavigationContext();

  if (linkedMaterials.length === 0) return null;

  return (
    <div className="pl-4 mb-6">
      <div className="flex flex-wrap gap-1">
        <p className="text-[13px] uppercase tracking-[0.08em] text-black/60 dark:text-white/60 mb-2">
          Linked Materials
        </p>
        {linkedMaterials.map((linkedMaterial) => (
          <button
            key={linkedMaterial.id}
            type="button"
            onClick={() => navigateToMaterialDetail(linkedMaterial.id)}
            className="retro-btn-primary px-2 py-1 rounded-md border border-[#211f1c] dark:border-white/20 text-[11px] text-black/80 dark:text-white/80 bg-white dark:bg-[#2a2825] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            {linkedMaterial.name}
          </button>
        ))}
      </div>
    </div>
  );
}
