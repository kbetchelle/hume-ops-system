import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import type { JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Color from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";
import TiptapLink from "@tiptap/extension-link";

import { LinkCardNode } from "./extensions/LinkCardNode";
import { TwoColumns, Column } from "./extensions/TwoColumnNode";
import { ImageBlock } from "./extensions/ImageBlock";

export interface PageRendererProps {
  content: JSONContent;
  className?: string;
}

export function PageRenderer({ content, className = "" }: PageRendererProps) {
  const editor = useEditor({
    editable: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        horizontalRule: false,
      }),
      Heading.configure({ levels: [1, 2, 3] }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      HorizontalRule,
      Color,
      TextStyle,
      TiptapLink.configure({
        openOnClick: true,
        HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
      }),
      ImageBlock,
      LinkCardNode,
      TwoColumns,
      Column,
    ],
    content,
  });

  // Sync content when prop changes (useEditor only reads content at init)
  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  if (!editor) return null;

  if (
    !content ||
    !content.content ||
    content.content.length === 0
  ) {
    return (
      <p className="text-sm text-muted-foreground italic">No content</p>
    );
  }

  return (
    <EditorContent
      editor={editor}
      className={`prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-primary [&_a]:underline [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:my-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:my-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:my-2 [&_hr]:my-4 [&_hr]:border-border [&_.ProseMirror]:outline-none ${className}`}
    />
  );
}
