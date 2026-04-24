import { Cloud, CloudOff } from "lucide-react";

interface OfflineNoticeBoxProps {
  syncStatus: "error" | "offline";
  onRetry: () => void;
}

export function OfflineNoticeBox({
  syncStatus,
  onRetry,
}: OfflineNoticeBoxProps) {
  return (
    <div className="mb-4 p-3 bg-waste-compost dark:bg-[#2a2825] border-[1.5px] border-[#211f1c] dark:border-white/20 rounded-xl flex items-center justify-between">
      <div className="flex items-center gap-2">
        <CloudOff size={16} className="normal" />
        <p className="text-[12px] normal">
          {syncStatus === "offline"
            ? "Working offline - data saved locally only"
            : "Failed to sync to cloud"}
        </p>
      </div>
      <button
        onClick={onRetry}
        className="px-3 py-1.5 bg-waste-reuse rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all text-[11px] text-black flex items-center gap-1"
      >
        <Cloud size={12} />
        Retry Sync
      </button>
    </div>
  );
}
