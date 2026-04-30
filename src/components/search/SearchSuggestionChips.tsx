import { useEffect, useRef, useState } from "react";
import { useMaterialsContext } from "../../contexts/MaterialsContext";
import { useNavigationContext } from "../../contexts/NavigationContext";
import type { Material, MaterialCategory } from "../../types/material";
import { categoryToCssVar } from "../../utils/categoryColors";

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

  const eligibleMaterials = materials.filter(
    (m) =>
      m.category !== "Elements" || ALLOWED_ELEMENTS.has(m.name.toLowerCase()),
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
      <span className="text-[11px] text-black/40 dark:text-white/35 select-none line-clamp-1">
        Try:
      </span>
      {chips.map((chip) => {
        const cssVar = categoryToCssVar(chip.category as MaterialCategory);
        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => navigateToMaterialDetail(chip.id)}
            style={{ backgroundColor: `var(${cssVar})` }}
            className="text-xs px-2.5 py-1 rounded-full
            border border-[#211f1c]/20 dark:border-white/15
            text-black dark:text-black/80
            shadow-[1.5px_1.5px_0px_0px_#211f1c] dark:shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,0.12)]
            hover:shadow-[0.5px_0.5px_0px_0px_#211f1c] dark:hover:shadow-[0.5px_0.5px_0px_0px_rgba(255,255,255,0.12)]
            hover:translate-y-px hover:opacity-80
            active:translate-y-0.5 active:shadow-none
            transition-all duration-100 cursor-pointer"
          >
            {chip.name}
          </button>
        );
      })}
    </div>
  );
}
