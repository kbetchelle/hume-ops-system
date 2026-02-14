import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Link2, ExternalLink } from "lucide-react";

export function LinkCardView({ node, selected }: NodeViewProps) {
  const { url, title, description } = node.attrs;

  return (
    <NodeViewWrapper className="my-2">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`block border border-border p-4 no-underline transition-colors hover:bg-muted/50 ${
          selected ? "ring-2 ring-primary" : ""
        }`}
        contentEditable={false}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <Link2 className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-foreground truncate">
                {title || url}
              </span>
              <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            </div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {description}
              </p>
            )}
            <span className="text-[10px] text-muted-foreground/60 mt-1 block truncate">
              {url}
            </span>
          </div>
        </div>
      </a>
    </NodeViewWrapper>
  );
}
