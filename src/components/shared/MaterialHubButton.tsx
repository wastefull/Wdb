import { useNavigationContext } from "../../contexts/NavigationContext";

interface MaterialHubButtonProps {
  materialName: string;
}

export function MaterialHubButton({ materialName }: MaterialHubButtonProps) {
  const { navigateToSearchResults } = useNavigationContext();

  return (
    <button
      type="button"
      onClick={() => navigateToSearchResults(`hub:${materialName}`)}
      className="tag-green cursor-pointer w-fit whitespace-nowrap"
      aria-label="Hub material"
    >
      Linked
    </button>
  );
}
