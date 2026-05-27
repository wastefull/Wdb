import { Modal } from "./Modal";

interface DiscardChangesDialogProps {
  onKeepEditing: () => void;
  onDiscard: () => void;
}

export function DiscardChangesDialog({
  onKeepEditing,
  onDiscard,
}: DiscardChangesDialogProps) {
  return (
    <Modal
      onClose={onKeepEditing}
      panelClassName="w-full max-w-sm p-6"
      overlayClassName="pt-10"
    >
      <div>
        <h1 className="text-[16px] font-semibold text-black dark:text-white mb-2">
          Discard changes?
        </h1>
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
    </Modal>
  );
}
