import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    twoColumns: {
      insertTwoColumns: () => ReturnType;
    };
  }
}

/**
 * Column node — an editable container inside a two-column layout.
 * Each column can hold paragraphs, images, lists, etc.
 */
export const Column = Node.create({
  name: "column",
  group: "column",
  content: "block+",
  isolating: true,

  parseHTML() {
    return [{ tag: 'div[data-type="column"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "column",
        class: "min-h-[2rem] border border-dashed border-border/50 p-3",
      }),
      0,
    ];
  },
});

/**
 * TwoColumns node — a block container holding exactly 2 Column children.
 * Renders as a responsive CSS grid: 2 columns on md+, 1 column on mobile.
 */
export const TwoColumns = Node.create({
  name: "twoColumns",
  group: "block",
  content: "column column",
  isolating: true,
  draggable: true,

  parseHTML() {
    return [{ tag: 'div[data-type="two-columns"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "two-columns",
        class: "grid grid-cols-1 md:grid-cols-2 gap-4 my-2",
      }),
      0,
    ];
  },

  addCommands() {
    return {
      insertTwoColumns:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            content: [
              {
                type: "column",
                content: [{ type: "paragraph" }],
              },
              {
                type: "column",
                content: [{ type: "paragraph" }],
              },
            ],
          });
        },
    };
  },
});
