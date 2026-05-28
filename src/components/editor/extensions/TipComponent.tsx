import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import { Lightbulb } from "lucide-react";

export default function TipComponent() {
  return (
    <NodeViewWrapper className="my-4">
      <div className="retro-card p-4 bg-waste-compost/10 border-l-4 border-waste-compost">
        <div className="flex items-start gap-3">
          <Lightbulb
            size={18}
            className="text-waste-compostink-0"
          />
          <NodeViewContent className="flex-1 text-[13px]" />
        </div>
      </div>
    </NodeViewWrapper>
  );
}
