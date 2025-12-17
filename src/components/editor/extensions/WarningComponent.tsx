import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import { AlertCircle } from "lucide-react";

export default function WarningComponent() {
  return (
    <NodeViewWrapper className="my-4">
      <div className="retro-card p-4 bg-[var(--waste-reuse)]/10 border-l-4 border-[var(--waste-reuse)]">
        <div className="flex items-start gap-3">
          <AlertCircle
            size={18}
            className="text-[var(--waste-reuse)] mt-1 shrink-0"
          />
          <NodeViewContent className="flex-1 text-[13px]" />
        </div>
      </div>
    </NodeViewWrapper>
  );
}
