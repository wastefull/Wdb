import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import { useState } from "react";

export default function SectionComponent({ node, updateAttributes }: any) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <NodeViewWrapper className="my-6">
      <div className="retro-card p-4">
        {isEditing ? (
          <input
            value={node.attrs.title}
            onChange={(e) => updateAttributes({ title: e.target.value })}
            onBlur={() => setIsEditing(false)}
            className="text-[18px] font-display w-full bg-transparent border-b-2 border-black/20 dark:border-white/20 pb-2 mb-4 text-black dark:text-white"
            autoFocus
          />
        ) : (
          <h2
            onClick={() => setIsEditing(true)}
            className="text-[18px] font-display mb-4 cursor-pointer hover:text-black/60 dark:hover:text-white/60 transition-colors text-black dark:text-white"
          >
            {node.attrs.title}
          </h2>
        )}
        <NodeViewContent className="section-content prose prose-sm max-w-none" />
      </div>
    </NodeViewWrapper>
  );
}
