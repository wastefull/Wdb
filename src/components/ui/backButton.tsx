import { ArrowLeft } from "lucide-react";

export function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button onClick={onBack} className="back-btn">
      <ArrowLeft size={16} />
      <span>Back</span>
    </button>
  );
}
