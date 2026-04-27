interface LastUpdatedProps {
  date: string | Date;
  className?: string;
  relative?: boolean;
}

function formatRelativeDate(date: string | Date): string {
  const dateMs = new Date(date).getTime();
  const nowMs = Date.now();
  const elapsedSeconds = Math.max(0, Math.floor((nowMs - dateMs) / 1000));

  const units = [
    { unit: "year", seconds: 365 * 24 * 60 * 60 },
    { unit: "month", seconds: 30 * 24 * 60 * 60 },
    { unit: "week", seconds: 7 * 24 * 60 * 60 },
    { unit: "day", seconds: 24 * 60 * 60 },
    { unit: "hour", seconds: 60 * 60 },
    { unit: "minute", seconds: 60 },
    { unit: "second", seconds: 1 },
  ] as const;

  for (const { unit, seconds } of units) {
    const value = Math.floor(elapsedSeconds / seconds);
    if (value >= 1) {
      return `${value} ${unit}${value === 1 ? "" : "s"} ago`;
    }
  }

  return "0 seconds ago";
}

export function LastUpdated({ date, className, relative }: LastUpdatedProps) {
  const formatted = relative
    ? formatRelativeDate(date)
    : new Date(date).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  return (
    <span
      className={`text-[11px] text-black/40 dark:text-white/40 ${className ?? ""}`}
    >
      Last updated {formatted}
    </span>
  );
}
