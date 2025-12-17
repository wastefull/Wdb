import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import { Check, X } from "lucide-react";

export default function CheckItemComponent({ node }: { node: any }) {
  const variant = node.attrs.variant || "check";
  const isCheck = variant === "check";

  return (
    <NodeViewWrapper className="my-2">
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 shrink-0 text-base ${
            isCheck
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {isCheck ? (
            <Check size={18} strokeWidth={3} />
          ) : (
            <X size={18} strokeWidth={3} />
          )}
        </span>
        <NodeViewContent className="flex-1 text-[13px] text-black dark:text-white" />
      </div>
    </NodeViewWrapper>
  );
}
