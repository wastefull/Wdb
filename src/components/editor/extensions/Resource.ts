import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import ResourceComponent from "./ResourceComponent.tsx";

export const Resource = Node.create({
  name: "resource",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      title: { default: "" },
      url: { default: "" },
      type: { default: "article" }, // article | video | pdf | website
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="resource"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "resource" }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResourceComponent);
  },
});
