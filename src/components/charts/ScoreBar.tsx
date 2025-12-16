import { useAccessibility } from "../shared/AccessibilityContext";

export interface ScoreBarProps {
  score: number;
  label: string;
  color: string;
  articleCount?: number;
  onClick?: () => void;
}

export function ScoreBar({
  score,
  label,
  color,
  articleCount,
  onClick,
}: ScoreBarProps) {
  const { settings } = useAccessibility();

  // Map pastel colors to high-contrast colors
  const getHighContrastColor = (originalColor: string): string => {
    const isDark = settings.darkMode;
    const colorMap: { [key: string]: { light: string; dark: string } } = {
      "#e6beb5": { light: "#c74444", dark: "#ff6b6b" }, // Compostability
      "#e4e3ac": { light: "#d4b400", dark: "#ffd700" }, // Recyclability
      "#b8c8cb": { light: "#4a90a4", dark: "#6bb6d0" }, // Reusability
    };

    const mapping = colorMap[originalColor.toLowerCase()];
    if (mapping) {
      return isDark ? mapping.dark : mapping.light;
    }
    return originalColor;
  };

  // Use high-contrast color if high contrast or no pastel mode is enabled
  const displayColor =
    settings.highContrast || settings.noPastel
      ? getHighContrastColor(color)
      : color;

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between items-center">
        <button
          onClick={onClick}
          className="text-[11px] normal hover:underline cursor-pointer text-left flex items-center gap-1"
          aria-label={`View ${label.toLowerCase()} articles (${
            articleCount || 0
          } articles, score: ${score})`}
        >
          <span className="text-[11px] normal">{label}</span>
          {articleCount !== undefined && articleCount > 0 && (
            <span className="text-[9px] text-black/60 dark:text-white/60">
              ({articleCount})
            </span>
          )}
        </button>
        <span className="text-[11px] normal">{score}</span>
      </div>
      <div
        className="h-2 bg-[#211f1c]/10 dark:bg-white/10 rounded-full overflow-hidden border border-[#211f1c] dark:border-white/20"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} score: ${score} out of 100`}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${score}%`, backgroundColor: displayColor }}
        />
      </div>
    </div>
  );
}
