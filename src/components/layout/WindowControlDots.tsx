/**
 * WindowControlDots
 *
 * Purely decorative "traffic light" style window control dots, styled after
 * classic OS window chrome. They're part of the retro window aesthetic only -
 * they have no click behavior or settings tied to them.
 */
const DOT_COLORS = ["arcade-fill-red", "arcade-fill-amber", "arcade-fill-cyan"];

export function WindowControlDots() {
  return (
    <div
      className="hidden md:flex flex-row gap-2.5 items-center h-full"
      aria-hidden="true"
    >
      {DOT_COLORS.map((dotColorClass) => (
        <div
          key={dotColorClass}
          className={`relative shrink-0 w-4 h-4 ${dotColorClass}`}
        >
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="-0.5 -0.5 15 15"
          >
            <circle
              cx="7"
              cy="7"
              fill="var(--fill-0, #E6BCB5)"
              r="6.5"
              stroke="var(--stroke-0, #211F1C)"
            />
          </svg>
        </div>
      ))}
    </div>
  );
}
