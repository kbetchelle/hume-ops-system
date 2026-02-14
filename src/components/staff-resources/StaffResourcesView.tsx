import { useState, useMemo } from "react";
import { Search, Copy, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { sanitizeHtml } from "@/lib/utils";
import { useActiveRole } from "@/hooks/useActiveRole";
import {
  useResourceSearch,
  type SearchQuickLinkGroup,
  type SearchResourcePage,
  type SearchPolicy,
} from "@/hooks/useResourceSearch";
import { ResourceFlagContextMenu } from "@/components/shared/ResourceFlagContextMenu";
import { UnderReviewBadge } from "@/components/shared/UnderReviewBadge";
import { useActiveResourceFlags } from "@/hooks/useResourceFlags";
import { MyEditablePages } from "./MyEditablePages";
import { useMyEditablePages } from "@/hooks/useResourcePageEditors";

const resourceSubPages = [
  { label: "Quick Links", path: "/dashboard/resources/quick-links" },
  { label: "Resource Pages", path: "/dashboard/resources/pages" },
  { label: "Policies", path: "/dashboard/resources/policies" },
];

export function StaffResourcesView() {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { activeRole } = useActiveRole();
  const { results, isLoading } = useResourceSearch(searchTerm, activeRole);
  const { data: myEditablePages = [] } = useMyEditablePages();

  const hasSearch = searchTerm.trim().length >= 2;

  // When no search: filter the 3 sub-page labels
  const filteredPages = searchTerm
    ? resourceSubPages.filter((p) =>
        p.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : resourceSubPages;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* My Editable Pages - Show when not searching and user has editable pages */}
        {!hasSearch && myEditablePages.length > 0 && (
          <Card className="rounded-none">
            <CardContent className="p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3">
                Pages You Can Edit
              </h3>
              <MyEditablePages />
            </CardContent>
          </Card>
        )}

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search all resources..."
            className="pl-10 rounded-none"
            autoFocus
          />
        </div>

        {/* Show unified search results when there's a query */}
        {hasSearch ? (
          <SearchResults results={results} isLoading={isLoading} />
        ) : (
          /* Default: show sub-page navigation */
          <div className="space-y-1">
            {filteredPages.map((page) => (
              <button
                key={page.path}
                type="button"
                onClick={() => navigate(page.path)}
                className="w-full text-left px-3 py-2.5 text-sm uppercase tracking-widest hover:bg-muted/50 transition-colors flex items-center gap-2"
              >
                <span className="text-muted-foreground text-base leading-none">
                  &bull;
                </span>
                <span className="hover:underline">{page.label}</span>
              </button>
            ))}
            {filteredPages.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-4">
                No resources match your search.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ===========================================================================
// Search results component
// ===========================================================================

function SearchResults({
  results,
  isLoading,
}: {
  results: ReturnType<typeof useResourceSearch>["results"];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (results.totalCount === 0) {
    return (
      <p className="text-center text-muted-foreground text-sm py-8">
        No results found.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {results.quickLinks.length > 0 && (
        <ResultSection title="Quick Links" count={results.quickLinks.length}>
          <QuickLinkResults groups={results.quickLinks} />
        </ResultSection>
      )}

      {results.resourcePages.length > 0 && (
        <ResultSection
          title="Resource Pages"
          count={results.resourcePages.length}
        >
          <ResourcePageResults pages={results.resourcePages} />
        </ResultSection>
      )}

      {results.policies.length > 0 && (
        <ResultSection title="Policies" count={results.policies.length}>
          <PolicyResults policies={results.policies} />
        </ResultSection>
      )}
    </div>
  );
}

// ===========================================================================
// Section wrapper with own-role / other-role divider
// ===========================================================================

function ResultSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        {title}
        <span className="ml-1.5 text-muted-foreground/60">({count})</span>
      </h3>
      {children}
    </div>
  );
}

// ===========================================================================
// Quick link results
// ===========================================================================

function QuickLinkResults({ groups }: { groups: SearchQuickLinkGroup[] }) {
  const ownRole = groups.filter((g) => g.isOwnRole);
  const otherRole = groups.filter((g) => !g.isOwnRole);

  const groupIds = useMemo(() => groups.map((g) => g.id), [groups]);
  const itemIds = useMemo(
    () => groups.flatMap((g) => g.items.map((i) => i.id)),
    [groups]
  );
  const { data: groupFlagsMap } = useActiveResourceFlags("quick_link_group", groupIds);
  const { data: itemFlagsMap } = useActiveResourceFlags("quick_link_item", itemIds);

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const renderGroup = (group: SearchQuickLinkGroup) => (
    <ResourceFlagContextMenu
      key={group.id}
      resourceType="quick_link_group"
      resourceId={group.id}
      resourceLabel={group.title}
      hasPendingFlag={groupFlagsMap?.has(group.id) ?? false}
    >
      <Card data-resource-id={group.id} className="rounded-none">
        <CardContent className="p-2.5">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm">{group.title}</h4>
            {groupFlagsMap?.has(group.id) && <UnderReviewBadge />}
            {!group.isOwnRole && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                other role
              </Badge>
            )}
          </div>
          {group.description && (
            <div
              className="prose prose-sm max-w-none [&_a]:text-primary [&_a]:underline text-muted-foreground mb-2 text-xs"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(group.description),
              }}
            />
          )}
          {group.items.length > 0 && (
            <div className="flex flex-col">
              {group.items.map((link) => (
                <ResourceFlagContextMenu
                  key={link.id}
                  resourceType="quick_link_item"
                  resourceId={link.id}
                  resourceLabel={link.name}
                  hasPendingFlag={itemFlagsMap?.has(link.id) ?? false}
                >
                  <a
                    data-resource-id={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2 px-1 py-1 hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-muted-foreground text-base shrink-0 leading-none">
                      &bull;
                    </span>
                    <span className="text-sm text-primary hover:underline truncate">
                      {link.name}
                    </span>
                    {itemFlagsMap?.has(link.id) && <UnderReviewBadge />}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCopy(link.url);
                      }}
                      className="ml-[10px] opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded-sm"
                      title="Copy URL"
                    >
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </a>
                </ResourceFlagContextMenu>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </ResourceFlagContextMenu>
  );

  return (
    <div className="grid grid-cols-2 gap-3">
      {ownRole.map(renderGroup)}
      {otherRole.length > 0 && ownRole.length > 0 && (
        <div className="col-span-2">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground/50 mt-1 mb-2">
            From other roles
          </p>
        </div>
      )}
      {otherRole.map(renderGroup)}
    </div>
  );
}

// ===========================================================================
// Resource page results
// ===========================================================================

function ResourcePageResults({ pages }: { pages: SearchResourcePage[] }) {
  const navigate = useNavigate();
  const ownRole = pages.filter((p) => p.isOwnRole);
  const otherRole = pages.filter((p) => !p.isOwnRole);

  const pageIds = useMemo(() => pages.map((p) => p.id), [pages]);
  const { data: pageFlagsMap } = useActiveResourceFlags("resource_page", pageIds);

  const renderPage = (page: SearchResourcePage) => {
    return (
      <ResourceFlagContextMenu
        key={page.id}
        resourceType="resource_page"
        resourceId={page.id}
        resourceLabel={page.title}
        hasPendingFlag={pageFlagsMap?.has(page.id) ?? false}
      >
        <Card
          data-resource-id={page.id}
          className="rounded-none cursor-pointer hover:shadow-sm transition-shadow"
          onClick={() => navigate(`/dashboard/resources/pages/${page.id}`)}
        >
          <CardContent className="p-3">
            <div className="flex items-center gap-2 w-full">
              <h4 className="font-medium text-sm flex-1">{page.title}</h4>
              {pageFlagsMap?.has(page.id) && <UnderReviewBadge />}
              {!page.isOwnRole && (
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0">
                  other role
                </Badge>
              )}
            </div>
            {/* Show tags if available */}
            {page.tags && page.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {page.tags.slice(0, 3).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-[9px] px-1.5 py-0"
                  >
                    {tag}
                  </Badge>
                ))}
                {page.tags.length > 3 && (
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                    +{page.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </ResourceFlagContextMenu>
    );
  };

  return (
    <div className="space-y-2">
      {ownRole.map(renderPage)}
      {otherRole.length > 0 && ownRole.length > 0 && (
        <p className="text-[9px] uppercase tracking-wider text-muted-foreground/50 mt-1 mb-1">
          From other roles
        </p>
      )}
      {otherRole.map(renderPage)}
    </div>
  );
}

// ===========================================================================
// Policy results
// ===========================================================================

function PolicyResults({ policies }: { policies: SearchPolicy[] }) {
  const [expandedPolicies, setExpandedPolicies] = useState<Set<string>>(
    new Set()
  );

  const policyIds = useMemo(() => policies.map((p) => p.id), [policies]);
  const { data: policyFlagsMap } = useActiveResourceFlags("club_policy", policyIds);

  const toggleExpand = (id: string) => {
    setExpandedPolicies((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-1">
      {policies.map((policy) => {
        const isExpanded = expandedPolicies.has(policy.id);
        return (
          <ResourceFlagContextMenu
            key={policy.id}
            resourceType="club_policy"
            resourceId={policy.id}
            resourceLabel={policy.title}
            hasPendingFlag={policyFlagsMap?.has(policy.id) ?? false}
          >
            <Card data-resource-id={policy.id} className="rounded-none border">
              <CardContent className="p-0">
                <button
                  type="button"
                  className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-muted/30 transition-colors"
                  onClick={() => toggleExpand(policy.id)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                  )}
                  <span className="text-xs font-medium">{policy.title}</span>
                  {policyFlagsMap?.has(policy.id) && <UnderReviewBadge />}
                  {policy.category && (
                    <Badge
                      variant="secondary"
                      className="text-[9px] px-1.5 py-0 ml-auto shrink-0"
                    >
                      {policy.category}
                    </Badge>
                  )}
                </button>
                {isExpanded && (
                  <div className="px-3 pb-3 border-t">
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap pt-2">
                      {policy.content}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-3 pt-2 border-t">
                      Last updated by {policy.last_updated_by} &bull;{" "}
                      {format(parseISO(policy.updated_at), "MMM d, yyyy")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </ResourceFlagContextMenu>
        );
      })}
    </div>
  );
}
