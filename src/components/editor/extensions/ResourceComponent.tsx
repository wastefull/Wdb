import { NodeViewWrapper } from "@tiptap/react";
import { ExternalLink, X } from "lucide-react";
import { useState } from "react";

export default function ResourceComponent({
  node,
  updateAttributes,
  deleteNode,
}: any) {
  const [isEditing, setIsEditing] = useState(!node.attrs.title);

  if (isEditing) {
    return (
      <NodeViewWrapper>
        <div className="retro-card p-4 my-3">
          <div className="space-y-3">
            <input
              placeholder="Resource title"
              value={node.attrs.title}
              onChange={(e) => updateAttributes({ title: e.target.value })}
              className="retro-input w-full"
            />
            <input
              placeholder="URL"
              value={node.attrs.url}
              onChange={(e) => updateAttributes({ url: e.target.value })}
              className="retro-input w-full"
            />
            <select
              value={node.attrs.type}
              onChange={(e) => updateAttributes({ type: e.target.value })}
              className="retro-input w-full"
            >
              <option key="article" value="article">
                Article
              </option>
              <option key="video" value="video">
                Video
              </option>
              <option key="pdf" value="pdf">
                PDF
              </option>
              <option key="website" value="website">
                Website
              </option>
            </select>
            <button
              onClick={() => {
                if (!node.attrs.title || !node.attrs.url) {
                  return; // Don't close if required fields are empty
                }
                setIsEditing(false);
              }}
              className="retro-button"
            >
              Save Resource
            </button>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper>
      <div className="my-3">
        <div
          className="retro-card-button w-full p-3 flex items-center justify-between cursor-pointer"
          onClick={() => setIsEditing(true)}
        >
          <div className="flex items-center gap-3">
            <ExternalLink
              size={16}
              className="text-black dark:text-white shrink-0"
            />
            <div className="text-left">
              <div className="text-[13px] font-medium text-black dark:text-white">
                {node.attrs.title || "Untitled Resource"}
              </div>
              <div className="text-[11px] text-black/60 dark:text-white/60">
                {node.attrs.type}
              </div>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteNode();
            }}
            className="text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </NodeViewWrapper>
  );
}
