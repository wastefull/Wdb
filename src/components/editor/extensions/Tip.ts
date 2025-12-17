import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import TipComponent from "./TipComponent.tsx";

export const Tip = Node.create({
  name: "tip",
  group: "block",
  content: "paragraph",

  parseHTML() {
    return [{ tag: 'div[data-type="tip"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "tip",
        class: "tip-block",
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TipComponent);
  },
});
