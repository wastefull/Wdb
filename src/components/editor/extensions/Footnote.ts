import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import FootnoteComponent from "./FootnoteComponent.tsx";

export const Footnote = Node.create({
  name: "footnote",
  group: "inline",
  inline: true,
  atom: true,
  marks: "",

  addAttributes() {
    return {
      content: {
        default: "",
      },
      // Shared identifier: multiple inline references with the same refId
      // point to the same numbered footnote entry.
      refId: {
        default: "",
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="footnote"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { "data-type": "footnote" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FootnoteComponent);
  },
});
