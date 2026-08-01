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
  const copyLabel = compact ? "" : `Copy ${linkType} link`;
  const containerClassName = compact ? "" : "pl-4 mb-6";
  const buttonClassName =
    "rounded-md border border-[#211f1c] text-sm text-black/80 bg-white hover:bg-black/5 transition-colors inline-flex items-center gap-2 px-2 py-1 mt-4 cursor-pointer";
  return (
    <div className={containerClassName}>
      <button onClick={onClick} className={buttonClassName} title={copyLabel}>
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? "Copied" : copyLabel}
      </button>
    </div>
  );
}
