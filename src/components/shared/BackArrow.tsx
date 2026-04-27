import { ArrowLeft } from "lucide-react";

interface BackArrowProps {
  onBack: () => void;
  className?: string;
}

export function BackArrow({ onBack, className }: BackArrowProps) {
  return (
    <button
      onClick={onBack}
      className={`card-interactive shrink-0 cursor-pointer ${className ?? ""}`}
    >
      <ArrowLeft size={16} className="text-black dark:text-white" />
    </button>
  );
}
