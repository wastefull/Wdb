import { createPortal } from "react-dom";

interface DiscardChangesDialogProps {
  onKeepEditing: () => void;
  onDiscard: () => void;
}

export function DiscardChangesDialog({
  onKeepEditing,
  onDiscard,
}: DiscardChangesDialogProps) {
  return createPortal(
    <div
      className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-200"
      onClick={onKeepEditing}
    >
      <div
        className="bg-white dark:bg-[#2a2825] rounded-(--retro-rounding) border-[1.5px] border-[#211f1c] dark:border-white/20 p-6 w-full max-w-sm shadow-[4px_4px_0px_0px_#000000] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[16px] font-semibold text-black dark:text-white mb-2">
          Discard changes?
        </h3>
        <p className="text-[13px] text-black/70 dark:text-white/60 mb-5">
          You have unsaved changes that will be lost.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onKeepEditing}
            className="flex-1 h-9 rounded-md border border-[#211f1c] dark:border-white/20 text-[13px] text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            Keep editing
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="flex-1 h-9 rounded-md bg-red-500 hover:bg-red-600 text-white text-[13px] border border-red-700 transition-colors"
          >
            Discard
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
