import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ImageBlockView } from "./ImageBlockView";

export const ImageBlock = Image.extend({
  name: "imageBlock",
  draggable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      width: { default: 100 },
      alignment: { default: "center" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="image-block"] img' }, { tag: "img[src]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      { "data-type": "image-block" },
      ["img", HTMLAttributes],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageBlockView);
  },
});
