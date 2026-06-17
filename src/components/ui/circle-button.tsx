import { AccessibilitySettings } from "../shared/AccessibilityContext";
import { PopoverTrigger } from "./popover";

export function CircleButton({
  ariaLabel,
  className,
  settings,
}: {
  ariaLabel: string;
  className: string;
  settings: AccessibilitySettings;
}) {
  return (
    <PopoverTrigger className="access-trigger" aria-label={ariaLabel}>
      <div className={`${className} ${settings.noPastel ? "opacity-80" : ""}`}>
        <svg fill="none" preserveAspectRatio="none" viewBox="-0.5 -0.5 15 15">
          <circle
            cx="7"
            cy="7"
            fill="var(--fill-0, #E6BCB5)"
            r="6.5"
            stroke="var(--stroke-0, #211F1C)"
          />
        </svg>
      </div>
    </PopoverTrigger>
  );
}
