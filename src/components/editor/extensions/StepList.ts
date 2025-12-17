import { Node } from "@tiptap/core";

export const StepList = Node.create({
  name: "stepList",
  group: "block",
  content: "stepItem+",

  parseHTML() {
    return [{ tag: 'ol[data-type="step-list"]' }];
  },

  renderHTML() {
    return ["ol", { "data-type": "step-list", class: "step-list" }, 0];
  },
});

export const StepItem = Node.create({
  name: "stepItem",
  content: "paragraph",

  parseHTML() {
    return [{ tag: 'li[data-type="step"]' }];
  },

  renderHTML() {
    return ["li", { "data-type": "step" }, 0];
  },
});
