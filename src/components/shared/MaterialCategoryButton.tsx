import { useNavigationContext } from "../../contexts/NavigationContext";
import { Material } from "../../types/material";

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
      className="tag-cyan cursor-pointer"
      aria-label={`View all ${category} materials`}
    >
      {category}
    </button>
  );
}
