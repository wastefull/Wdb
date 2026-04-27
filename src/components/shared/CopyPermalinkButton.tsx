import { Check, Copy } from "lucide-react";

interface CopyPermalinkButtonProps {
  copied: boolean;
  onClick: () => void;
  linkType: string;
  compact?: boolean;
}

export function CopyPermalinkButton({
  copied,
  onClick,
  linkType,
  compact = false,
}: CopyPermalinkButtonProps) {
  const copyLabel = `Copy ${linkType} link`;
  const containerClassName = compact ? "" : "pl-4 mb-6";
  const buttonClassName = compact
    ? "px-2 py-1 rounded-md border border-[#211f1c] dark:border-white/20 text-[11px] text-black/80 dark:text-white/80 bg-white dark:bg-[#2a2825] hover:bg-black/5 dark:hover:bg-white/10 transition-colors inline-flex items-center gap-1"
    : "px-2 py-1 mt-8 rounded-md border border-[#211f1c] dark:border-white/20 text-[11px] text-black/80 dark:text-white/80 bg-white dark:bg-[#2a2825] hover:bg-black/5 dark:hover:bg-white/10 transition-colors inline-flex items-center gap-1";

  return (
    <div className={containerClassName}>
      <button onClick={onClick} className={buttonClassName} title={copyLabel}>
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? "Copied" : copyLabel}
      </button>
    </div>
  );
}
