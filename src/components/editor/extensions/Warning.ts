import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import WarningComponent from "./WarningComponent.tsx";

export const Warning = Node.create({
  name: "warning",
  group: "block",
  content: "paragraph",

  parseHTML() {
    return [{ tag: 'div[data-type="warning"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "warning",
        class: "warning-block",
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(WarningComponent);
  },
});
