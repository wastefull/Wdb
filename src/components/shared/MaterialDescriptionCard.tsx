interface MaterialDescriptionCardProps {
  description: string;
}

export function MaterialDescriptionCard({
  description,
}: MaterialDescriptionCardProps) {
  return (
    <div className="rounded-(--retro-rounding) border-[1.5px] border-accent p-4 pl-4 pt-4 col-start-5 col-end-11 md:col-start-4 md:col-end-11 bg-[linear-gradient(135deg,color-mix(in_oklch,var(--waste-recycle)_25%,transparent),color-mix(in_oklch,var(--waste-reuse)_15%,transparent))] dark:bg-[linear-gradient(135deg,color-mix(in_oklch,var(--waste-reuse)_10%,transparent),color-mix(in_oklch,var(--waste-reuse)_8%,transparent))]">
      <p className="text-[13px] uppercase tracking-[0.08em] text-black/60 dark:text-white/60">
        Description
      </p>
      <p className="text-normal text-black/80 dark:text-white/80">
        {description}
      </p>
    </div>
  );
}
