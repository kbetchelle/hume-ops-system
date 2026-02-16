import { useEffect, useRef, useCallback } from "react";
import { Extension } from "@tiptap/core";
import { useEditor, EditorContent } from "@tiptap/react";
import type { JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import TiptapLink from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";

import { LinkCardNode } from "./extensions/LinkCardNode";
import { TwoColumns, Column } from "./extensions/TwoColumnNode";
import { ImageBlock } from "./extensions/ImageBlock";
import { IndentExtension } from "./extensions/IndentExtension";
import { EditorToolbar } from "./EditorToolbar";

const TabIndent = Extension.create({
  name: "tabIndent",
  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        if (editor.isActive("listItem") && editor.can().sinkListItem("listItem")) {
          editor.commands.sinkListItem("listItem");
          return true;
        }
        return false;
      },
      "Shift-Tab": ({ editor }) => {
        if (editor.isActive("listItem") && editor.can().liftListItem("listItem")) {
          editor.commands.liftListItem("listItem");
          return true;
        }
        return false;
      },
    };
  },
});

export interface PageEditorProps {
  initialContent: JSONContent | null;
  onChange: (content: JSONContent) => void;
  onImageUpload: (file: File) => Promise<string>;
  editable?: boolean;
  placeholder?: string;
}

export function PageEditor({
  initialContent,
  onChange,
  onImageUpload,
  editable = true,
  placeholder = "Start writing...",
}: PageEditorProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInternalUpdate = useRef(false);

  const handleUpdate = useCallback(
    (json: JSONContent) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        isInternalUpdate.current = true;
        onChange(json);
      }, 300);
    },
    [onChange]
  );

  const editor = useEditor({
    editable,
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
        openOnClick: false,
        HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
      }),
      Placeholder.configure({ placeholder }),
      ImageBlock,
      LinkCardNode,
      TwoColumns,
      Column,
      TabIndent,
      IndentExtension,
    ],
    content: initialContent || undefined,
    onUpdate: ({ editor: ed }) => {
      handleUpdate(ed.getJSON());
    },
  });

  // Sync initialContent only for external changes (e.g. loading from DB, switching pages)
  // Skip when the change originated from the editor's own onUpdate
  const initialContentRef = useRef(initialContent);
  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      initialContentRef.current = initialContent;
      return;
    }
    if (editor && initialContent !== initialContentRef.current) {
      initialContentRef.current = initialContent;
      editor.commands.setContent(initialContent || { type: "doc", content: [] });
    }
  }, [editor, initialContent]);

  // Sync editable prop
  useEffect(() => {
    if (editor && editor.isEditable !== editable) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  if (!editor) return null;

  return (
    <div className="border border-input bg-background flex flex-col h-full max-h-[calc(100vh-200px)]">
      {editable && (
        <EditorToolbar editor={editor} onImageUpload={onImageUpload} />
      )}
      <div className="flex-1 overflow-y-auto">
        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none px-4 py-3 min-h-[300px] focus-within:outline-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-primary [&_a]:underline [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:my-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:my-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:my-2 [&_hr]:my-4 [&_hr]:border-border [&_.ProseMirror]:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none"
        />
      </div>
    </div>
  );
}
