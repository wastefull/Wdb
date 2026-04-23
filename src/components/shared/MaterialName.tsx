import { useMaterialsContext } from "../../contexts/MaterialsContext";
import { useNavigationContext } from "../../contexts/NavigationContext";

interface MaterialNameProps {
  materialId: string;
  mode: "hero" | "heading";
}

export function MaterialName({ materialId, mode }: MaterialNameProps) {
  const { getMaterialById } = useMaterialsContext();
  const { navigateToMaterialDetail } = useNavigationContext();

  const name = getMaterialById(materialId)?.name ?? "";

  if (mode === "hero") {
    return (
      <h1 className="text-[42px] mouse-pointer text-shadow-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors rounded-md px-2 py-1">
        <a href="#" onClick={() => navigateToMaterialDetail(materialId)}>
          {name}
        </a>
      </h1>
    );
  }

  return (
    <button
      className="text-[18px] text-black dark:text-white mb-1 hover:underline cursor-pointer text-left block"
      aria-label={`View details for ${name}`}
      onClick={() => navigateToMaterialDetail(materialId)}
    >
      {name}
    </button>
  );
}
