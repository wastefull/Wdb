import { useAccessibility } from "./AccessibilityContext";
import { useNavigationContext } from "../../contexts/NavigationContext";

interface LogoLinkProps {
  onNavigateHome?: () => void;
}

export function LogoLink({ onNavigateHome }: LogoLinkProps) {
  const { settings } = useAccessibility();
  const { navigateTo } = useNavigationContext();

  const handleClick = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      navigateTo({ type: "materials" });
    }
  };

  return (
    <button
      onClick={handleClick}
      className="transition-transform hover:scale-105 cursor-pointer"
      aria-label="Go to home page"
    >
      <img
        src={
          settings.darkMode
            ? "https://bdvfwjmaufjeqmxphmtv.supabase.co/storage/v1/object/public/make-17cae920-assets/logo_darkmode-1763068549938.png"
            : "https://bdvfwjmaufjeqmxphmtv.supabase.co/storage/v1/object/public/make-17cae920-assets/uplogo_transparent-1761169051994.png"
        }
        alt="Wastefull Logo"
        className={
          settings.darkMode ? "h-52 lg:h-64 w-auto" : "h-36 lg:h-48 w-auto"
        }
      />
    </button>
  );
}
