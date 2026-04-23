interface AliasDisplayProps {
  aliases: string[];
}

export function AliasDisplay({ aliases }: AliasDisplayProps) {
  if (aliases.length === 0) return null;
  return (
    <div className="mt-2">
      <span className="text-black/60 dark:text-white/60 text-sm">
        also called:
      </span>{" "}
      <div className="text-black/60 dark:text-white/60">
        <span className="shadow-muted">{aliases.join(", ")}</span>
      </div>
    </div>
  );
}
