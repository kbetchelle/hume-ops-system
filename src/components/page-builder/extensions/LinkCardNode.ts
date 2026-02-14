import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { LinkCardView } from "./LinkCardView";

export interface LinkCardAttributes {
  url: string;
  title: string;
  description: string;
  image: string | null;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    linkCard: {
      setLinkCard: (attrs: { url: string; title?: string }) => ReturnType;
    };
  }
}

export const LinkCardNode = Node.create({
  name: "linkCard",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      url: { default: "" },
      title: { default: "" },
      description: { default: "" },
      image: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="link-card"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "link-card" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(LinkCardView);
  },

  addCommands() {
    return {
      setLinkCard:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              url: attrs.url,
              title: attrs.title || attrs.url,
              description: "",
              image: null,
            },
          });
        },
    };
  },
});
