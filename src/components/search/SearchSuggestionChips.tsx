import { useEffect, useMemo, useRef, useState } from "react";
import { useMaterialsContext } from "../../contexts/MaterialsContext";
import { useNavigationContext } from "../../contexts/NavigationContext";
import type { Material, MaterialCategory } from "../../types/material";
import { hasLearningLibraryContent } from "../../utils/materialArticles";
import {
  categoryToContrastCssVar,
  categoryToCssVar,
} from "../../utils/categoryColors";

const CHIPS_TO_SHOW = 5;

// Most pure-element entries are too obscure for a layman audience.
// Allow only the elements a typical user might realistically search for.
const ALLOWED_ELEMENTS = new Set([
  "aluminum",
  "iron",
  "copper",
  "lead",
  "mercury",
  "zinc",
  "silver",
  "tin",
]);

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

interface SearchSuggestionChipsProps {
  searchValue: string;
}

export function SearchSuggestionChips({
  searchValue,
}: SearchSuggestionChipsProps) {
  const { materials } = useMaterialsContext();
  const { navigateToMaterialDetail } = useNavigationContext();

  const eligibleMaterials = useMemo(
    () =>
      materials.filter(
        (material) =>
          (material.category !== "Elements" ||
            ALLOWED_ELEMENTS.has(material.name.toLowerCase())) &&
          hasLearningLibraryContent(material, materials),
      ),
    [materials],
  );

  const [chips, setChips] = useState<Material[]>([]);
  const isEmpty = searchValue.trim() === "";
  const wasEmptyRef = useRef(isEmpty);
  const initialPickedRef = useRef(false);

  // Initial pick once materials load
  useEffect(() => {
    if (eligibleMaterials.length && !initialPickedRef.current) {
      initialPickedRef.current = true;
      setChips(pickRandom(eligibleMaterials, CHIPS_TO_SHOW));
    }
  }, [eligibleMaterials.length]);

  // Re-shuffle when the search bar is cleared
  useEffect(() => {
    if (isEmpty && !wasEmptyRef.current && eligibleMaterials.length) {
      setChips(pickRandom(eligibleMaterials, CHIPS_TO_SHOW));
    }
    wasEmptyRef.current = isEmpty;
  }, [isEmpty, eligibleMaterials.length]);

  if (!chips.length) return null;

  return (
    <div
      className={`flex items-center justify-center gap-2 flex-wrap transition-all duration-200 ${
        isEmpty
          ? "opacity-100 max-h-20 mt-3"
          : "opacity-0 max-h-0 mt-0 pointer-events-none overflow-hidden"
      }`}
      aria-hidden={!isEmpty}
    >
      <span className="text-sm select-none line-clamp-1">Try:</span>
      {chips.map((chip) => {
        const cssVar = categoryToCssVar(chip.category as MaterialCategory);
        const contrastCssVar = categoryToContrastCssVar(
          chip.category as MaterialCategory,
        );
        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => navigateToMaterialDetail(chip.id)}
            style={{
              backgroundColor: `var(${cssVar})`,
              color: `var(${contrastCssVar})`,
            }}
            className="search-chip text-fine-outline"
          >
            {chip.name}
          </button>
        );
      })}
    </div>
  );
}
