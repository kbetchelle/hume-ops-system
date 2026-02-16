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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="rounded-none">
            <CardContent className="p-4">
              <Skeleton className="h-5 w-3/4 mb-3" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <div className="flex gap-2 mb-3">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3 mt-2" />
            </CardContent>
          </Card>
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
      
      {/* Filter Bar */}
      <div className="space-y-3">
        {/* Tag Filters */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground self-center">
              Tags:
            </span>
            {allTags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className="rounded-none text-xs cursor-pointer"
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

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
        /* Card Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((page) => {
            const hasPendingFlag = pageFlagsMap?.has(page.id) ?? false;
            
            // Get search snippet if there's a search query
            const hasSearchQuery = parsedSearch.plainText.trim().length > 0;
            const titleSegments = hasSearchQuery 
              ? highlightMatches(page.title, parsedSearch.plainText)
              : [{ text: page.title, start: 0, end: page.title.length, isMatch: false }];
            
            const contentSnippet = hasSearchQuery && page.search_text
              ? extractSearchSnippet(page.search_text, parsedSearch.plainText)
              : [];
            
            const matchCount = hasSearchQuery && page.search_text
              ? countMatches(page.title, parsedSearch.plainText) + 
                countMatches(page.search_text, parsedSearch.plainText)
              : 0;

            return (
              <ResourceFlagContextMenu
                key={page.id}
                resourceType="resource_page"
                resourceId={page.id}
                resourceLabel={page.title}
                hasPendingFlag={hasPendingFlag}
              >
                <Card
                  data-resource-id={page.id}
                  className="rounded-none overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
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
                  <CardContent className="p-0">
                    {/* Cover Image */}
                    {page.cover_image_url && (
                      <div className="aspect-video bg-muted overflow-hidden">
                        <img
                          src={page.cover_image_url}
                          alt={page.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="p-4 space-y-3">
                      {/* Title with highlighting */}
                      <div>
                        <h3 className="font-medium line-clamp-2 mb-2">
                          {titleSegments.map((segment, idx) => (
                            segment.isMatch ? (
                              <span key={idx} className="bg-yellow-200 dark:bg-yellow-900/50">
                                {segment.text}
                              </span>
                            ) : (
                              <span key={idx}>{segment.text}</span>
                            )
                          ))}
                        </h3>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-1">
                          {page.page_type === 'pdf' && (
                            <Badge
                              variant="secondary"
                              className="rounded-none text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              PDF
                            </Badge>
                          )}
                          {matchCount > 0 && (
                            <Badge
                              variant="secondary"
                              className="rounded-none text-[10px] bg-green-500/10 text-green-600 dark:text-green-400"
                            >
                              {matchCount} {matchCount === 1 ? 'match' : 'matches'}
                            </Badge>
                          )}
                          {hasPendingFlag && <UnderReviewBadge />}
                          {page.tags.slice(0, 2).map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="rounded-none text-[10px]"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {page.tags.length > 2 && (
                            <Badge
                              variant="outline"
                              className="rounded-none text-[10px]"
                            >
                              +{page.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Search snippet */}
                      {contentSnippet.length > 0 && (
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {contentSnippet.map((segment, idx) => (
                            segment.isMatch ? (
                              <span key={idx} className="bg-yellow-200 dark:bg-yellow-900/50 font-medium">
                                {segment.text}
                              </span>
                            ) : (
                              <span key={idx}>{segment.text}</span>
                            )
                          ))}
                        </div>
                      )}

                      {/* Last Updated */}
                      <div className="text-xs text-muted-foreground">
                        {page.updated_at &&
                          format(new Date(page.updated_at), "MMM d, yyyy")}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ResourceFlagContextMenu>
            );
          })}
        </div>
      )}
    </div>
  );
}
