import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import { Lightbulb } from "lucide-react";

export default function TipComponent() {
  return (
    <NodeViewWrapper className="my-4">
      <div className="retro-card p-4 bg-[var(--waste-compost)]/10 border-l-4 border-[var(--waste-compost)]">
        <div className="flex items-start gap-3">
          <Lightbulb
            size={18}
            className="text-[var(--waste-compost)] mt-1 shrink-0"
          />
          <NodeViewContent className="flex-1 text-[13px]" />
        </div>
      </div>
    </NodeViewWrapper>
  );
}
