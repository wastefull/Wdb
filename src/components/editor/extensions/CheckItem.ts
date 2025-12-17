import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import CheckItemComponent from "./CheckItemComponent.tsx";

export interface CheckItemOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    checkItem: {
      /**
       * Insert a check item (✅)
       */
      insertCheckItem: () => ReturnType;
      /**
       * Insert a cross item (❌)
       */
      insertCrossItem: () => ReturnType;
      /**
       * Convert selection to check items or insert if nothing selected
       */
      toggleCheckItems: () => ReturnType;
      /**
       * Convert selection to cross items or insert if nothing selected
       */
      toggleCrossItems: () => ReturnType;
    };
  }
}

export const CheckItem = Node.create<CheckItemOptions>({
  name: "checkItem",
  group: "block",
  content: "paragraph",

  addAttributes() {
    return {
      variant: {
        default: "check",
        parseHTML: (element) => element.getAttribute("data-variant") || "check",
        renderHTML: (attributes) => ({
          "data-variant": attributes.variant,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="check-item"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "check-item",
        class: "check-item-block",
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CheckItemComponent);
  },

  addCommands() {
    return {
      insertCheckItem:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { variant: "check" },
            content: [{ type: "paragraph" }],
          });
        },
      insertCrossItem:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { variant: "cross" },
            content: [{ type: "paragraph" }],
          });
        },
      toggleCheckItems:
        () =>
        ({ state, chain, commands }) => {
          const { selection } = state;
          const { $from, $to } = selection;

          // Collect list items in selection
          const listItems: { pos: number; node: any; textContent: string }[] =
            [];

          state.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
            if (node.type.name === "listItem") {
              // Extract text content from the list item
              let textContent = "";
              node.forEach((child) => {
                if (child.type.name === "paragraph") {
                  child.forEach((textNode) => {
                    if (textNode.isText) {
                      textContent += textNode.text;
                    }
                  });
                }
              });
              listItems.push({ pos, node, textContent });
            }
          });

          // If we found list items, convert them
          if (listItems.length > 0) {
            // Build check items from list items (reverse order to preserve positions)
            const checkItems = listItems.map((item) => ({
              type: this.name,
              attrs: { variant: "check" },
              content: [
                {
                  type: "paragraph",
                  content: item.textContent
                    ? [{ type: "text", text: item.textContent }]
                    : [],
                },
              ],
            }));

            // Find the parent list node
            const $start = state.doc.resolve(listItems[0].pos);
            let listPos = -1;
            let listNode = null;

            for (let d = $start.depth; d >= 0; d--) {
              const node = $start.node(d);
              if (
                node.type.name === "bulletList" ||
                node.type.name === "orderedList"
              ) {
                listPos = $start.before(d);
                listNode = node;
                break;
              }
            }

            if (listPos >= 0 && listNode) {
              // Replace the entire list with check items
              return chain()
                .deleteRange({ from: listPos, to: listPos + listNode.nodeSize })
                .insertContentAt(listPos, checkItems)
                .run();
            }
          }

          // Fallback: just insert a new check item
          return commands.insertContent({
            type: this.name,
            attrs: { variant: "check" },
            content: [{ type: "paragraph" }],
          });
        },
      toggleCrossItems:
        () =>
        ({ state, chain, commands }) => {
          const { selection } = state;
          const { $from, $to } = selection;

          // Collect list items in selection
          const listItems: { pos: number; node: any; textContent: string }[] =
            [];

          state.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
            if (node.type.name === "listItem") {
              // Extract text content from the list item
              let textContent = "";
              node.forEach((child) => {
                if (child.type.name === "paragraph") {
                  child.forEach((textNode) => {
                    if (textNode.isText) {
                      textContent += textNode.text;
                    }
                  });
                }
              });
              listItems.push({ pos, node, textContent });
            }
          });

          // If we found list items, convert them
          if (listItems.length > 0) {
            // Build cross items from list items
            const crossItems = listItems.map((item) => ({
              type: this.name,
              attrs: { variant: "cross" },
              content: [
                {
                  type: "paragraph",
                  content: item.textContent
                    ? [{ type: "text", text: item.textContent }]
                    : [],
                },
              ],
            }));

            // Find the parent list node
            const $start = state.doc.resolve(listItems[0].pos);
            let listPos = -1;
            let listNode = null;

            for (let d = $start.depth; d >= 0; d--) {
              const node = $start.node(d);
              if (
                node.type.name === "bulletList" ||
                node.type.name === "orderedList"
              ) {
                listPos = $start.before(d);
                listNode = node;
                break;
              }
            }

            if (listPos >= 0 && listNode) {
              // Replace the entire list with cross items
              return chain()
                .deleteRange({ from: listPos, to: listPos + listNode.nodeSize })
                .insertContentAt(listPos, crossItems)
                .run();
            }
          }

          // Fallback: just insert a new cross item
          return commands.insertContent({
            type: this.name,
            attrs: { variant: "cross" },
            content: [{ type: "paragraph" }],
          });
        },
    };
  },
});
