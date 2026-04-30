import { useNavigationContext } from "../../contexts/NavigationContext";
import { Material } from "../../types/material";
import { categoryToCssVar } from "../../utils/categoryColors";

interface MaterialCategoryButtonProps {
  category: Material["category"];
}

export function MaterialCategoryButton({
  category,
}: MaterialCategoryButtonProps) {
  const { navigateToSearchResults } = useNavigationContext();

  return (
    <button
      type="button"
      onClick={() => navigateToSearchResults(`category:${category}`)}
      style={{ backgroundColor: `var(${categoryToCssVar(category)})` }}
      className="tag cursor-pointer w-fit whitespace-nowrap"
      aria-label={`View all ${category} materials`}
    >
      {category}
    </button>
  );
}
