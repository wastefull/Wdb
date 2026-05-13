export interface KbdProps {
  macText: string;
  pcText: string;
  className?: string;
}

const isMacPlatform =
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad/.test(navigator.platform);

export function Kbd({ macText, pcText, className }: KbdProps) {
  const label = isMacPlatform ? macText : pcText;

  return (
    <kbd
      className={["relative overflow-hidden", className]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-[inherit] bg-(--kbd)"
      />
      <span className="relative">{label}</span>
    </kbd>
  );
}
