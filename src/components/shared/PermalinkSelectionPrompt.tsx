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
    <div className="fixed inset-0 bg-black/30 dark:bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-[#2a2825] rounded-(--retro-rounding) border-[1.5px] border-[#211f1c] dark:border-white/20 w-full max-w-sm shadow-[4px_4px_0px_0px_#000000] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
        <div className="flex items-center justify-between p-4 border-b border-[#211f1c] dark:border-white/20">
          <h3 className="normal text-[14px]">Which material did you mean?</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            aria-label="Close"
          >
            <span className="text-[16px] leading-none">✕</span>
          </button>
        </div>
        <p className="px-4 pt-3 text-[11px] text-black/60 dark:text-white/60">
          The link matches more than one material. Choose one to continue.
        </p>
        <ul className="p-4 space-y-2">
          {candidates.map((candidate) => (
            <li key={candidate.id}>
              <button
                type="button"
                onClick={() => handleSelectCandidate(candidate)}
                className="w-full text-left px-3 py-2 rounded-[8px] border border-[#211f1c]/20 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <span className="text-[13px] block">{candidate.name}</span>
                <span className="text-[10px] text-black/50 dark:text-white/50">
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
