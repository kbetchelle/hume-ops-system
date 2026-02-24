import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ResourcePage } from "@/hooks/useStaffResources";
import { ResourceFlagContextMenu } from "@/components/shared/ResourceFlagContextMenu";
import { UnderReviewBadge } from "@/components/shared/UnderReviewBadge";
import { useActiveResourceFlags } from "@/hooks/useResourceFlags";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { AdvancedSearchInput } from "@/components/search/AdvancedSearchInput";
import { useSearchAutocomplete } from "@/hooks/useSearchAutocomplete";
import { parseSearchQuery } from "@/lib/searchFilterParser";
import { extractSearchSnippet, highlightMatches, countMatches } from "@/lib/searchSnippets";

function isValidReturnPath(path: string | null | undefined): string | null {
  if (!path) return null;
  if (typeof path !== 'string') return null;
  if (!path.startsWith('/dashboard/')) return null;
  if (path.includes('://') || path.startsWith('javascript:') || path.startsWith('data:')) return null;
  if (path.includes('\\\\')) return null;
  if (path.includes('../') || path.includes('/..')) return null;
  return path;
}

export function ResourcePagesTab({
  pages,
  isLoading,
  searchTerm,
  onSearchChange,
  focusSearch,
  onSearchFocus,
  returnPath,
}: {
  pages: ResourcePage[];
  isLoading: boolean;
  searchTerm: string;
  onSearchChange?: (value: string) => void;
  focusSearch?: boolean;
  onSearchFocus?: () => void;
  returnPath?: string;
}) {
  const navigate = useNavigate();

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Get autocomplete suggestions
  const suggestions = useSearchAutocomplete(pages, searchTerm);
  
  // Parse search query for advanced filters
  const parsedSearch = useMemo(() => parseSearchQuery(searchTerm), [searchTerm]);

  // Extract all unique tags from pages
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    pages.forEach((page) => {
      page.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [pages]);

  // Filter pages by tags and search term
  const filtered = useMemo(() => {
    let list = pages;

    // Filter by selected tags (UI tags)
    if (selectedTags.length > 0) {
      list = list.filter((p) =>
        selectedTags.some((tag) => p.tags.includes(tag))
      );
    }

    // Apply advanced search tag filters
    if (parsedSearch.filters.tags.length > 0) {
      list = list.filter((p) =>
        parsedSearch.filters.tags.some((filterTag) =>
          p.tags.some((pageTag) => 
            pageTag.toLowerCase().includes(filterTag.toLowerCase())
          )
        )
      );
    }

    // Filter by plain text search
    if (parsedSearch.plainText.trim()) {
      const q = parsedSearch.plainText.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.search_text && p.search_text.toLowerCase().includes(q)) ||
          p.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    return list;
  }, [pages, selectedTags, parsedSearch]);

  const pageIds = useMemo(() => filtered.map((p) => p.id), [filtered]);
  const { data: pageFlagsMap } = useActiveResourceFlags("resource_page", pageIds);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      {onSearchChange && (
        <AdvancedSearchInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Search pages... Try 'tag:training'"
          suggestions={suggestions}
          showHistory={true}
          focusTrigger={focusSearch}
          onFocus={onSearchFocus}
        />
      )}
      

      {/* Empty State */}
      {filtered.length === 0 ? (
        <Card className="rounded-none">
          <CardContent className="py-16 text-center">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm || selectedTags.length > 0
                ? "No pages found"
                : "No resource pages available"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm || selectedTags.length > 0
                ? "Try adjusting your search or filters."
                : "No resource pages have been assigned to your role yet. Check back later or contact your manager."}
            </p>
          </CardContent>
        </Card>
      ) : (
        /* Compact List */
        <div className="border border-border rounded-none">
          <div className="flex items-center gap-3 px-3 py-1.5 border-b border-border bg-muted/30 text-[11.75px] uppercase tracking-widest text-muted-foreground">
            <span className="w-4 shrink-0" />
            <span className="flex-1 min-w-0">Name</span>
            <span className="hidden md:block w-48 shrink-0">Tags</span>
            <span className="hidden sm:block w-24 shrink-0 text-right">Last Edited</span>
          </div>
          {filtered.map((page) => {
            const hasPendingFlag = pageFlagsMap?.has(page.id) ?? false;
            const hasSearchQuery = parsedSearch.plainText.trim().length > 0;
            const titleSegments = hasSearchQuery 
              ? highlightMatches(page.title, parsedSearch.plainText)
              : [{ text: page.title, start: 0, end: page.title.length, isMatch: false }];

            return (
              <ResourceFlagContextMenu
                key={page.id}
                resourceType="resource_page"
                resourceId={page.id}
                resourceLabel={page.title}
                hasPendingFlag={hasPendingFlag}
              >
                <div
                  data-resource-id={page.id}
                  className="group flex items-center gap-3 px-3 py-2 border-b border-border last:border-b-0 hover:bg-muted/40 transition-colors cursor-pointer"
                  onClick={() => {
                    const url = `/dashboard/resources/pages/${page.id}`;
                    const validReturnPath = isValidReturnPath(returnPath);
                    if (validReturnPath) {
                      navigate(`${url}?returnTo=${encodeURIComponent(validReturnPath)}`);
                    } else {
                      navigate(url);
                    }
                  }}
                >
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 min-w-0 text-xs truncate font-medium">
                    {titleSegments.map((segment, idx) => (
                      segment.isMatch ? (
                        <span key={idx} className="bg-yellow-200 dark:bg-yellow-900/50">{segment.text}</span>
                      ) : (
                        <span key={idx}>{segment.text}</span>
                      )
                    ))}
                    {page.page_type === 'pdf' && (
                      <Badge variant="secondary" className="rounded-none text-[10px] ml-2 border-none" style={{ backgroundColor: '#009ddc', color: '#ffffff', padding: '2.25px 6.25px' }}>PDF</Badge>
                    )}
                    {hasPendingFlag && <span className="ml-1"><UnderReviewBadge /></span>}
                  </span>

                  <div className="hidden md:flex items-center gap-1 shrink-0 w-48">
                    {page.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="rounded-none text-[10px] border-none" style={{ backgroundColor: '#fcb827', color: '#ffffff', padding: '2.25px 6.25px' }}>
                        {tag}
                      </Badge>
                    ))}
                    {page.tags.length > 3 && (
                      <Badge variant="outline" className="rounded-none text-[10px]">
                        +{page.tags.length - 3}
                      </Badge>
                    )}
                  </div>

                  <span className="hidden sm:block text-[11.5px] text-muted-foreground shrink-0 w-24 text-right">
                    {page.updated_at && format(new Date(page.updated_at), "MMM d, yyyy")}
                  </span>
                </div>
              </ResourceFlagContextMenu>
            );
          })}
        </div>
      )}
    </div>
  );
}
