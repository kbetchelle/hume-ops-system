import { useState, useRef, useEffect, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  ImageIcon,
  Link,
  Link2,
  Minus,
  Columns2,
  IndentIncrease,
  IndentDecrease,
  Type,
} from "lucide-react";

const FONT_SIZES = [
  { label: "Small", value: "12px" },
  { label: "Normal", value: "" },
  { label: "Medium", value: "18px" },
  { label: "Large", value: "24px" },
  { label: "XL", value: "32px" },
  { label: "XXL", value: "40px" },
];

const TEXT_COLORS = [
  { name: "Default", value: "" },
  { name: "Red", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Green", value: "#22c55e" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Purple", value: "#a855f7" },
  { name: "Gray", value: "#6b7280" },
];

interface EditorToolbarProps {
  editor: Editor;
  onImageUpload: (file: File) => Promise<string>;
}

export function EditorToolbar({ editor, onImageUpload }: EditorToolbarProps) {
  const [linkUrl, setLinkUrl] = useState("");
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [linkCardUrl, setLinkCardUrl] = useState("");
  const [linkCardPopoverOpen, setLinkCardPopoverOpen] = useState(false);
  const [colorPopoverOpen, setColorPopoverOpen] = useState(false);
  const [, setTick] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Force re-render on selection/transaction changes so active states stay in sync
  useEffect(() => {
    const handler = () => setTick((t) => t + 1);
    editor.on("selectionUpdate", handler);
    editor.on("transaction", handler);
    return () => {
      editor.off("selectionUpdate", handler);
      editor.off("transaction", handler);
    };
  }, [editor]);

  const btnClass = (isActive: boolean) =>
    `h-7 w-7 p-0 rounded-none ${isActive ? "bg-accent text-accent-foreground" : ""}`;

  // Link insertion
  const handleInsertLink = () => {
    if (!linkUrl) return;
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: linkUrl, target: "_blank" })
      .run();
    setLinkUrl("");
    setLinkPopoverOpen(false);
  };

  // Link Card insertion
  const handleInsertLinkCard = () => {
    if (!linkCardUrl) return;
    editor.chain().focus().setLinkCard({ url: linkCardUrl }).run();
    setLinkCardUrl("");
    setLinkCardPopoverOpen(false);
  };

  // Image upload
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await onImageUpload(file);
      editor
        .chain()
        .focus()
        .setImage({ src: url } as any)
        .run();
    } catch (err) {
      console.error("Image upload failed:", err);
    }
    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Text color
  const handleTextColor = (color: string) => {
    if (color) {
      editor.chain().focus().setColor(color).run();
    } else {
      editor.chain().focus().unsetColor().run();
    }
    setColorPopoverOpen(false);
  };

  return (
    <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/30 flex-wrap py-1">
      {/* --- Text formatting --- */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={btnClass(editor.isActive("bold"))}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold"
      >
        <Bold className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={btnClass(editor.isActive("italic"))}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic"
      >
        <Italic className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={btnClass(editor.isActive("underline"))}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Underline"
      >
        <UnderlineIcon className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={btnClass(editor.isActive("strike"))}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Strikethrough"
      >
        <Strikethrough className="h-3.5 w-3.5" />
      </Button>

      <div className="w-px h-5 bg-border mx-1" />

      {/* --- Font Size --- */}
      <Select
        value={editor.getAttributes("textStyle")?.fontSize || "normal"}
        onValueChange={(value) => {
          if (value === "normal") {
            editor.chain().focus().unsetFontSize().run();
          } else {
            editor.chain().focus().setFontSize(value).run();
          }
        }}
      >
        <SelectTrigger className="h-7 w-[95px] rounded-none text-xs border-none bg-transparent hover:bg-accent px-2">
          <Type className="h-3 w-3 mr-1 shrink-0" />
          <SelectValue placeholder="Size" />
        </SelectTrigger>
        <SelectContent className="rounded-none">
          {FONT_SIZES.map((size) => (
            <SelectItem key={size.label} value={size.value || "normal"} className="text-xs">
              {size.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="w-px h-5 bg-border mx-1" />

      {/* --- Headings --- */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={btnClass(editor.isActive("heading", { level: 1 }))}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        title="Heading 1"
      >
        <Heading1 className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={btnClass(editor.isActive("heading", { level: 2 }))}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="Heading 2"
      >
        <Heading2 className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={btnClass(editor.isActive("heading", { level: 3 }))}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        title="Heading 3"
      >
        <Heading3 className="h-3.5 w-3.5" />
      </Button>

      <div className="w-px h-5 bg-border mx-1" />

      {/* --- Text color --- */}
      <Popover open={colorPopoverOpen} onOpenChange={setColorPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 rounded-none"
            title="Text Color"
          >
            <Palette className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2 rounded-none" align="start">
          <div className="flex gap-1">
            {TEXT_COLORS.map((color) => (
              <button
                key={color.name}
                type="button"
                onClick={() => handleTextColor(color.value)}
                className="w-6 h-6 border border-border hover:scale-110 transition-transform"
                style={{ backgroundColor: color.value || "#000000" }}
                title={color.name}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <div className="w-px h-5 bg-border mx-1" />

      {/* --- Alignment --- */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={btnClass(editor.isActive({ textAlign: "left" }))}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        title="Align Left"
      >
        <AlignLeft className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={btnClass(editor.isActive({ textAlign: "center" }))}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        title="Align Center"
      >
        <AlignCenter className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={btnClass(editor.isActive({ textAlign: "right" }))}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        title="Align Right"
      >
        <AlignRight className="h-3.5 w-3.5" />
      </Button>

      <div className="w-px h-5 bg-border mx-1" />

      {/* --- Lists --- */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={btnClass(editor.isActive("bulletList"))}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet List"
      >
        <List className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={btnClass(editor.isActive("orderedList"))}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Numbered List"
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </Button>

      {/* --- Indent / Outdent --- */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 rounded-none"
        onClick={() => {
          if (editor.isActive("listItem") && editor.can().sinkListItem("listItem")) {
            editor.chain().focus().sinkListItem("listItem").run();
          } else {
            editor.chain().focus().indent().run();
          }
        }}
        title="Indent"
      >
        <IndentIncrease className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 rounded-none"
        onClick={() => {
          if (editor.isActive("listItem") && editor.can().liftListItem("listItem")) {
            editor.chain().focus().liftListItem("listItem").run();
          } else {
            editor.chain().focus().outdent().run();
          }
        }}
        title="Outdent"
      >
        <IndentDecrease className="h-3.5 w-3.5" />
      </Button>

      <div className="w-px h-5 bg-border mx-1" />

      {/* --- Insert: Image --- */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 rounded-none"
        onClick={() => fileInputRef.current?.click()}
        title="Insert Image"
      >
        <ImageIcon className="h-3.5 w-3.5" />
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelect}
      />

      {/* --- Insert: Link --- */}
      <Popover open={linkPopoverOpen} onOpenChange={setLinkPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={btnClass(editor.isActive("link"))}
            title="Insert Link"
          >
            <Link className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3 rounded-none" align="start">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Select text first, then enter URL
            </p>
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="rounded-none text-xs h-8"
              onKeyDown={(e) => e.key === "Enter" && handleInsertLink()}
            />
            <Button
              type="button"
              size="sm"
              onClick={handleInsertLink}
              className="rounded-none h-7 text-xs w-full"
            >
              Insert Link
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* --- Insert: Link Card --- */}
      <Popover
        open={linkCardPopoverOpen}
        onOpenChange={setLinkCardPopoverOpen}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 rounded-none"
            title="Insert Link Card"
          >
            <Link2 className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3 rounded-none" align="start">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Enter URL for link card
            </p>
            <Input
              value={linkCardUrl}
              onChange={(e) => setLinkCardUrl(e.target.value)}
              placeholder="https://example.com"
              className="rounded-none text-xs h-8"
              onKeyDown={(e) => e.key === "Enter" && handleInsertLinkCard()}
            />
            <Button
              type="button"
              size="sm"
              onClick={handleInsertLinkCard}
              className="rounded-none h-7 text-xs w-full"
            >
              Insert Link Card
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* --- Insert: Divider --- */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 rounded-none"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Divider"
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>

      {/* --- Insert: Two-Column Layout --- */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 rounded-none"
        onClick={() => editor.chain().focus().insertTwoColumns().run()}
        title="Two-Column Layout"
      >
        <Columns2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
