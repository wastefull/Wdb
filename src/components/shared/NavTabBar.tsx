import { useNavigationContext } from "../../contexts/NavigationContext";
import { NavTabs, NavTabId } from "../layout/NavTabs";

const VIEW_TO_TAB: Record<string, NavTabId> = {
  materials: "search",
  guides: "guides",
  blog: "blog",
  about: "about",
  donate: "donate",
};

export function NavTabBar() {
  const {
    currentView,
    navigateToMaterials,
    navigateToGuides,
    navigateToBlog,
    navigateToAbout,
    navigateToDonate,
  } = useNavigationContext();

  const activeTab = VIEW_TO_TAB[currentView.type];
  if (!activeTab) return null;

  const handleTabChange = (tab: NavTabId) => {
    if (tab === "search") navigateToMaterials();
    else if (tab === "guides") navigateToGuides();
    else if (tab === "blog") navigateToBlog();
    else if (tab === "about") navigateToAbout();
    else if (tab === "donate") navigateToDonate();
  };

  return <NavTabs activeTab={activeTab} onTabChange={handleTabChange} />;
}
