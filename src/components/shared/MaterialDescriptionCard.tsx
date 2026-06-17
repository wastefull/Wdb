interface MaterialDescriptionCardProps {
  description: string;
  category?: string;
  aliases?: string[];
  onViewCategory?: () => void;
}

export function MaterialDescriptionCard({
  description,
  category,
  aliases = [],
  onViewCategory,
}: MaterialDescriptionCardProps) {
  return (
    <div className="rounded-(--retro-rounding) border-[1.5px] border-accent bg-[linear-gradient(135deg,color-mix(in_oklch,var(--waste-recycle)_25%,transparent),color-mix(in_oklch,var(--waste-reuse)_15%,transparent))] p-5 dark:bg-[linear-gradient(135deg,color-mix(in_oklch,var(--waste-reuse)_10%,transparent),color-mix(in_oklch,var(--waste-reuse)_8%,transparent))]">
      <p className="text-[13px] uppercase tracking-[0.08em] text-black/60 dark:text-white/60">
        Description
      </p>
      <p className="mt-2 max-w-3xl leading-7 text-black/80 dark:text-white/80">
        {description}
      </p>
      {(category || aliases.length > 0) && (
        <dl className="mt-6 grid gap-4 border-t border-black/10 pt-4 text-sm dark:border-white/10 sm:grid-cols-2">
          {category && (
            <div>
              <dt className="text-black/50 dark:text-white/50">Category</dt>
              <dd className="mt-1">
                {onViewCategory ? (
                  <button
                    type="button"
                    onClick={onViewCategory}
                    className="underline hover:no-underline"
                  >
                    {category}
                  </button>
                ) : (
                  category
                )}
              </dd>
            </div>
          )}
          {aliases.length > 0 && (
            <div>
              <dt className="text-black/50 dark:text-white/50">Also called</dt>
              <dd className="mt-1">{aliases.join(", ")}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}
