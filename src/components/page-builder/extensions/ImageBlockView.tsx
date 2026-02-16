import { useCallback, useRef, useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ImageBlockView({
  node,
  updateAttributes,
  selected,
}: NodeViewProps) {
  const { src, alt, width, alignment } = node.attrs;
  const containerRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  const alignmentClass =
    alignment === "left"
      ? "mr-auto"
      : alignment === "right"
        ? "ml-auto"
        : "mx-auto";

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);

      const startX = e.clientX;
      const container = containerRef.current?.parentElement;
      if (!container) return;

      const containerWidth = container.getBoundingClientRect().width;
      const startWidthPx = (width / 100) * containerWidth;

      const onMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startX;
        const newWidthPx = Math.max(100, startWidthPx + delta);
        const newWidthPercent = Math.min(
          100,
          Math.round((newWidthPx / containerWidth) * 100)
        );
        updateAttributes({ width: newWidthPercent });
      };

      const onMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [width, updateAttributes]
  );

  return (
    <NodeViewWrapper className="my-2 relative">
      <div
        ref={containerRef}
        className={`relative inline-block ${alignmentClass}`}
        style={{ width: `${width}%` }}
        contentEditable={false}
      >
        {/* Alignment controls — shown when selected */}
        {selected && (
          <div
            className="absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-0.5 border border-border bg-background p-0.5 z-10"
            onMouseDown={(e) => e.preventDefault()}
          >
            <Button
              type="button"
              variant={alignment === "left" ? "default" : "ghost"}
              size="sm"
              className="h-6 w-6 p-0 rounded-none"
              onClick={() => updateAttributes({ alignment: "left" })}
            >
              <AlignLeft className="h-3 w-3" />
            </Button>
            <Button
              type="button"
              variant={alignment === "center" ? "default" : "ghost"}
              size="sm"
              className="h-6 w-6 p-0 rounded-none"
              onClick={() => updateAttributes({ alignment: "center" })}
            >
              <AlignCenter className="h-3 w-3" />
            </Button>
            <Button
              type="button"
              variant={alignment === "right" ? "default" : "ghost"}
              size="sm"
              className="h-6 w-6 p-0 rounded-none"
              onClick={() => updateAttributes({ alignment: "right" })}
            >
              <AlignRight className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Image */}
        <img
          src={src}
          alt={alt || ""}
          className={`w-full h-auto block ${selected ? "ring-2 ring-primary" : ""}`}
          draggable={false}
        />

        {/* Resize handle — bottom-right corner */}
        {selected && (
          <div
            className={`absolute bottom-0 right-0 w-3 h-3 bg-primary cursor-se-resize ${
              isResizing ? "opacity-100" : "opacity-70 hover:opacity-100"
            }`}
            onMouseDown={handleMouseDown}
          />
        )}
      </div>
    </NodeViewWrapper>
  );
}
