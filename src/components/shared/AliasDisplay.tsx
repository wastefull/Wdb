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
      <div className="w-50 text-sm line-clamp-2 hover:line-clamp-none hover:w-auto transition-all ">
        <span className="shadow-muted cursor-ew-resize">
          {aliases.join(", ")}
        </span>
      </div>
    </div>
  );
}
