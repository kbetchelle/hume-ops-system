import { useMemo } from "react";
import { Copy, ExternalLink, Inbox } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { sanitizeHtml } from "@/lib/utils";
import type { QuickLinkGroupWithItems } from "@/hooks/useStaffResources";
import { ResourceFlagContextMenu } from "@/components/shared/ResourceFlagContextMenu";
import { UnderReviewBadge } from "@/components/shared/UnderReviewBadge";
import { useActiveResourceFlags } from "@/hooks/useResourceFlags";

export function QuickLinksTab({
  groups,
  isLoading,
  searchTerm,
}: {
  groups: QuickLinkGroupWithItems[];
  isLoading: boolean;
  searchTerm: string;
}) {
  const filtered = useMemo(() => {
    if (!searchTerm) return groups;
    const q = searchTerm.toLowerCase();
    return groups
      .map((group) => {
        const groupMatches =
          group.title.toLowerCase().includes(q) ||
          (group.description ?? "").toLowerCase().includes(q);
        const matchingItems = group.items.filter((item) =>
          item.name.toLowerCase().includes(q)
        );
        if (groupMatches) return group;
        if (matchingItems.length > 0) return { ...group, items: matchingItems };
        return null;
      })
      .filter(Boolean) as QuickLinkGroupWithItems[];
  }, [groups, searchTerm]);

  const groupIds = useMemo(() => filtered.map((g) => g.id), [filtered]);
  const itemIds = useMemo(
    () => filtered.flatMap((g) => g.items.map((i) => i.id)),
    [filtered]
  );
  const { data: groupFlagsMap } = useActiveResourceFlags("quick_link_group", groupIds);
  const { data: itemFlagsMap } = useActiveResourceFlags("quick_link_item", itemIds);

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
              ? "No quick links match your search."
              : "No quick links assigned to your role yet."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {filtered.map((group) => (
        <ResourceFlagContextMenu
          key={group.id}
          resourceType="quick_link_group"
          resourceId={group.id}
          resourceLabel={group.title}
          hasPendingFlag={groupFlagsMap?.has(group.id) ?? false}
        >
          <Card data-resource-id={group.id} className="rounded-none">
            <CardContent className="p-[10px]">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium">{group.title}</h3>
                {groupFlagsMap?.has(group.id) && <UnderReviewBadge />}
              </div>
              {group.description && (
                <div
                  className="prose prose-sm max-w-none [&_a]:text-primary [&_a]:underline text-muted-foreground mb-3"
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
                        className="group flex items-center gap-2 px-1 py-1.5 hover:bg-muted/50 transition-colors"
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
      ))}
    </div>
  );
}
