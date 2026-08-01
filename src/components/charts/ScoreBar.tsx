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
  const displayColor = color;

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between items-center">
        <button
          onClick={onClick}
          className="text-sm normal hover:underline cursor-pointer text-left flex items-center gap-1"
          aria-label={`View ${label.toLowerCase()} articles (${
            articleCount || 0
          } articles, score: ${score})`}
        >
          <span className="text-sm normal">{label}</span>
          {articleCount !== undefined && articleCount > 0 && (
            <span className="text-[9px] text-black/60">({articleCount})</span>
          )}
        </button>
        <span className="text-sm normal">{score}</span>
      </div>
      <div
        className="h-2 bg-[#211f1c]/10 rounded-full overflow-hidden border border-[#211f1c]"
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
