import { useNavigationContext } from "../../contexts/NavigationContext";
import { Material } from "../../types/material";

interface MaterialHubButtonProps {
  category: Material["category"];
}

export function MaterialHubButton({ category }: MaterialHubButtonProps) {
  const { navigateToSearchResults } = useNavigationContext();

  return (
    <button
      type="button"
      onClick={() => navigateToSearchResults(`category:${category}`)}
      className="tag-green cursor-pointer"
      aria-label="Hub material"
    >
      Material Hub
    </button>
  );
}
