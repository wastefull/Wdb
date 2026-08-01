import { useNavigationContext } from "../../contexts/NavigationContext";
import { WindowControlDots } from "./WindowControlDots";

export interface RetroButtonsProps {
  title: string;
  titlePop?: string;
  version?: string;
}

export function RetroButtons({ title, titlePop, version }: RetroButtonsProps) {
  const { navigateToMaterials } = useNavigationContext();

  const isLogo = title === "Waste" && titlePop === "DB";
  const handleLogoClick = () => {
    if (isLogo) {
      navigateToMaterials();
    }
  };

  return (
    <div className="access-menu-outer">
      <div className="access-menu-inner">
        <div className="access-menu-content">
          <WindowControlDots />

          <div className="window-title">
            <h1
              className={`pr-2 z-1 title-pop ${isLogo ? "cursor-pointer" : ""}`}
              onClick={handleLogoClick}
            >
              {title}
            </h1>
            <h1
              className={`pb-2 uppercase color-pop  ${isLogo ? "cursor-pointer" : ""}`}
              onClick={handleLogoClick}
            >
              {titlePop}
            </h1>
            <span className="beta-badge" style={{ marginLeft: 6 }}>
              {version}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
