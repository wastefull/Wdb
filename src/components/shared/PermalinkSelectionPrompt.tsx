import { useNavigationContext } from "../../contexts/NavigationContext";
import type { Material } from "../../types/material";
import { buildMaterialPermalinkPath } from "../../utils/permalinks";

interface PermalinkSelectionPromptProps {
  candidates: Material[];
  onClose: () => void;
}

export function PermalinkSelectionPrompt({
  candidates,
  onClose,
}: PermalinkSelectionPromptProps) {
  const { navigateToMaterialDetail } = useNavigationContext();

  const handleSelectCandidate = (candidate: Material) => {
    onClose();
    navigateToMaterialDetail(candidate.id);
    window.history.replaceState(
      {},
      "",
      `${buildMaterialPermalinkPath(candidate)}${window.location.search}${window.location.hash}`,
    );
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-(--retro-rounding) border-[1.5px] border-[#211f1c] w-full max-w-sm shadow-[4px_4px_0px_0px_#000000]">
        <div className="flex items-center justify-between p-4 border-b border-[#211f1c]">
          <h3 className="normal text-[14px]">Which material did you mean?</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-black/5 transition-colors"
            aria-label="Close"
          >
            <span className="text-[16px] leading-none">✕</span>
          </button>
        </div>
        <p className="px-4 pt-3 text-sm text-black/60">
          The link matches more than one material. Choose one to continue.
        </p>
        <ul className="p-4 space-y-2">
          {candidates.map((candidate) => (
            <li key={candidate.id}>
              <button
                type="button"
                onClick={() => handleSelectCandidate(candidate)}
                className="w-full text-left px-3 py-2 rounded-xl border border-[#211f1c]/20 hover:bg-black/5 transition-colors"
              >
                <span className="text-[13px] block">{candidate.name}</span>
                <span className="text-xs text-black/50">
                  {candidate.category}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
