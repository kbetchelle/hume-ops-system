import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Inbox } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { sanitizeHtml } from "@/lib/utils";
import type { ResourcePage } from "@/hooks/useStaffResources";

export function ResourcePagesTab({
  pages,
  isLoading,
  searchTerm,
}: {
  pages: ResourcePage[];
  isLoading: boolean;
  searchTerm: string;
}) {
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (!searchTerm) return pages;
    const q = searchTerm.toLowerCase();
    return pages.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.content ?? "").toLowerCase().includes(q)
    );
  }, [pages, searchTerm]);

  const toggleExpand = (id: string) => {
    setExpandedPages((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <Card className="rounded-none">
        <CardContent className="py-12 text-center">
          <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {searchTerm
              ? "No resource pages match your search."
              : "No resource pages assigned to your role yet."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {filtered.map((page) => {
        const isExpanded = expandedPages.has(page.id);
        return (
          <Card key={page.id} className="rounded-none">
            <CardContent className="p-4">
              <button
                type="button"
                className="flex items-center gap-2 w-full text-left hover:text-foreground/80"
                onClick={() => toggleExpand(page.id)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0" />
                )}
                <h3 className="font-medium">{page.title}</h3>
              </button>
              {isExpanded && page.content && (
                <div
                  className="mt-4 pt-4 border-t prose prose-sm max-w-none [&_a]:text-primary [&_a]:underline"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(page.content),
                  }}
                />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
