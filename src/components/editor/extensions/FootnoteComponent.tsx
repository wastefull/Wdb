import { useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";

export default function FootnoteComponent({
  node,
  updateAttributes,
  selected,
}: NodeViewProps) {
  const [editing, setEditing] = useState(false);
  const [draftContent, setDraftContent] = useState<string>(
    node.attrs.content ?? "",
  );
  const [draftRefId, setDraftRefId] = useState<string>(node.attrs.refId ?? "");

  const handleDoubleClick = () => {
    setDraftContent(node.attrs.content ?? "");
    setDraftRefId(node.attrs.refId ?? "");
    setEditing(true);
  };

  const handleSave = () => {
    updateAttributes({ content: draftContent, refId: draftRefId });
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) handleSave();
    if (e.key === "Escape") setEditing(false);
  };

  const isBackRef = !node.attrs.content && !!node.attrs.refId;
  const tooltip = isBackRef
    ? `Back-reference to footnote ${node.attrs.refId}\nDouble-click to edit`
    : `Footnote: ${node.attrs.content || "(empty)"}\nRef ID: ${node.attrs.refId || "(none)"}\nDouble-click to edit`;

  return (
    <NodeViewWrapper as="span" className="inline-block" contentEditable={false}>
      {editing ? (
        <span
          className="inline-flex flex-col gap-1 border border-black/20 dark:border-white/20 bg-white dark:bg-[#1a1817] rounded p-2 shadow-sm z-50 relative"
          onKeyDown={handleKeyDown}
        >
          <input
            autoFocus
            value={draftContent}
            onChange={(e) => setDraftContent(e.target.value)}
            className="text-[11px] border border-black/20 dark:border-white/20 rounded px-1 py-0.5 bg-transparent text-black dark:text-white min-w-48 max-w-75"
            placeholder="Footnote text (leave blank for back-reference)…"
          />
          <div className="flex items-center gap-1">
            <input
              value={draftRefId}
              onChange={(e) => setDraftRefId(e.target.value)}
              className="text-[10px] font-mono border border-black/20 dark:border-white/20 rounded px-1 py-0.5 bg-transparent text-black/60 dark:text-white/60 flex-1"
              placeholder="Ref ID (share with back-references)…"
            />
            <button
              type="button"
              onClick={() =>
                navigator.clipboard.writeText(draftRefId).catch(() => {})
              }
              className="text-[10px] px-1 py-0.5 border border-black/20 dark:border-white/20 rounded hover:bg-black/5 dark:hover:bg-white/5 shrink-0"
              title="Copy ref ID"
            >
              copy
            </button>
          </div>
          <div className="flex gap-1 justify-end">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-[10px] px-2 py-0.5 border border-black/20 dark:border-white/20 rounded hover:bg-black/5 dark:hover:bg-white/5"
            >
              cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="text-[10px] px-2 py-0.5 bg-black dark:bg-white text-white dark:text-black rounded"
            >
              save
            </button>
          </div>
        </span>
      ) : (
        <span
          title={tooltip}
          onDoubleClick={handleDoubleClick}
          className={`inline-flex items-center cursor-pointer select-none ${
            selected ? "outline outline-offset-1 outline-blue-400 rounded" : ""
          }`}
        >
          <sup className="text-[10px] font-mono bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded px-1 leading-none text-black dark:text-white hover:bg-black/20 dark:hover:bg-white/20 transition-colors">
            {isBackRef ? "↩" : "fn"}
          </sup>
        </span>
      )}
    </NodeViewWrapper>
  );
}
