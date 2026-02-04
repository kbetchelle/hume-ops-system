import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bold, Italic, Link, List, ListOrdered, Palette, Underline } from "lucide-react";
interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}
const TEXT_COLORS = [{
  name: "Default",
  value: ""
}, {
  name: "Red",
  value: "#ef4444"
}, {
  name: "Orange",
  value: "#f97316"
}, {
  name: "Green",
  value: "#22c55e"
}, {
  name: "Blue",
  value: "#3b82f6"
}, {
  name: "Purple",
  value: "#a855f7"
}, {
  name: "Gray",
  value: "#6b7280"
}];
export function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter content...",
  className = "",
  minHeight = "200px"
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [colorPopoverOpen, setColorPopoverOpen] = useState(false);
  const isInitializedRef = useRef(false);

  // Set initial value only once on mount
  useEffect(() => {
    if (editorRef.current && !isInitializedRef.current) {
      editorRef.current.innerHTML = value;
      isInitializedRef.current = true;
    }
  }, [value]);

  // Execute formatting command
  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      editorRef.current.focus();
    }
  }, [onChange]);

  // Handle bold
  const handleBold = () => execCommand("bold");

  // Handle italic
  const handleItalic = () => execCommand("italic");

  // Handle underline
  const handleUnderline = () => execCommand("underline");

  // Handle unordered list
  const handleUnorderedList = () => execCommand("insertUnorderedList");

  // Handle ordered list
  const handleOrderedList = () => execCommand("insertOrderedList");

  // Handle link insertion
  const handleLink = () => {
    if (linkUrl) {
      const selection = window.getSelection();
      if (selection && selection.toString()) {
        execCommand("createLink", linkUrl);
      } else {
        // Insert link with URL as text
        const linkHtml = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkUrl}</a>`;
        execCommand("insertHTML", linkHtml);
      }
      setLinkUrl("");
      setLinkPopoverOpen(false);
    }
  };

  // Handle text color
  const handleTextColor = (color: string) => {
    if (color) {
      execCommand("foreColor", color);
    } else {
      execCommand("removeFormat");
    }
    setColorPopoverOpen(false);
  };

  // Handle content change
  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  // Handle paste - clean up pasted content
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };
  return <div className={`border border-input bg-background ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/30 flex-wrap py-0">
        <Button type="button" variant="ghost" size="sm" onClick={handleBold} className="h-7 w-7 p-0 rounded-none" title="Bold">
          <Bold className="h-3.5 w-3.5" />
        </Button>

        <Button type="button" variant="ghost" size="sm" onClick={handleItalic} className="h-7 w-7 p-0 rounded-none" title="Italic">
          <Italic className="h-3.5 w-3.5" />
        </Button>

        <Button type="button" variant="ghost" size="sm" onClick={handleUnderline} className="h-7 w-7 p-0 rounded-none" title="Underline">
          <Underline className="h-3.5 w-3.5" />
        </Button>

        <div className="w-px h-5 bg-border mx-1" />

        <Popover open={colorPopoverOpen} onOpenChange={setColorPopoverOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-none" title="Text Color">
              <Palette className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2 rounded-none" align="start">
            <div className="flex gap-1">
              {TEXT_COLORS.map(color => <button key={color.name} type="button" onClick={() => handleTextColor(color.value)} className="w-6 h-6 border border-border hover:scale-110 transition-transform" style={{
              backgroundColor: color.value || "#000000"
            }} title={color.name} />)}
            </div>
          </PopoverContent>
        </Popover>

        <div className="w-px h-5 bg-border mx-1" />

        <Popover open={linkPopoverOpen} onOpenChange={setLinkPopoverOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-none" title="Insert Link">
              <Link className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3 rounded-none" align="start">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Select text first, then enter URL
              </p>
              <Input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://example.com" className="rounded-none text-xs h-8" onKeyDown={e => e.key === "Enter" && handleLink()} />
              <Button type="button" size="sm" onClick={handleLink} className="rounded-none h-7 text-xs w-full">
                Insert Link
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <div className="w-px h-5 bg-border mx-1" />

        <Button type="button" variant="ghost" size="sm" onClick={handleUnorderedList} className="h-7 w-7 p-0 rounded-none" title="Bullet List">
          <List className="h-3.5 w-3.5" />
        </Button>

        <Button type="button" variant="ghost" size="sm" onClick={handleOrderedList} className="h-7 w-7 p-0 rounded-none" title="Numbered List">
          <ListOrdered className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Editor */}
      <div ref={editorRef} contentEditable className="px-[10px] py-[6px] text-xs focus:outline-none prose prose-sm max-w-none 
          [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5
          [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
          [&_a]:text-primary [&_a]:underline" style={{
      minHeight
    }} onInput={handleInput} onPaste={handlePaste} data-placeholder={placeholder} suppressContentEditableWarning />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground));
          pointer-events: none;
        }
      `}</style>
    </div>;
}