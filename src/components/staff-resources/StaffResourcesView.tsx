import { useState } from "react";
import {
  Link2,
  FileText,
  Loader2,
  Copy,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Inbox } from
"lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { sanitizeHtml } from "@/lib/utils";
import { useActiveRole } from "@/hooks/useActiveRole";
import {
  useQuickLinkGroupsByRole,
  useResourcePagesByRole,
  type QuickLinkGroupWithItems,
  type ResourcePage } from
"@/hooks/useStaffResources";

// ---------------------------------------------------------------------------
// Quick Links Tab
// ---------------------------------------------------------------------------
function QuickLinksTab({ groups, isLoading }: {groups: QuickLinkGroupWithItems[];isLoading: boolean;}) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>);

  }

  if (groups.length === 0) {
    return (
      <Card className="rounded-none">
        <CardContent className="py-12 text-center">
          <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No quick links assigned to your role yet.
          </p>
        </CardContent>
      </Card>);

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
    <div className="space-y-4">
      {groups.map((group) =>
      <Card key={group.id} className="rounded-none">
          <CardContent className="p-4">
            <h3 className="font-medium mb-1">{group.title}</h3>
            {group.description &&
          <div
            className="prose prose-sm max-w-none [&_a]:text-primary [&_a]:underline text-muted-foreground mb-3"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(group.description) }} />

          }
            {group.items.length > 0 &&
          <div className="space-y-1">
                {group.items.map((link) =>
            <div
              key={link.id}
              className="group flex items-center gap-2 py-1.5 px-2 hover:bg-muted/50 rounded-sm">

                    <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                    <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary underline underline-offset-2 hover:text-primary/80 truncate">

                      {link.name}
                    </a>
                    <button
                type="button"
                onClick={() => handleCopy(link.url)}
                className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded-sm"
                title="Copy URL">

                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
            )}
              </div>
          }
          </CardContent>
        </Card>
      )}
    </div>);

}

// ---------------------------------------------------------------------------
// Resource Pages Tab
// ---------------------------------------------------------------------------
function ResourcePagesTab({ pages, isLoading }: {pages: ResourcePage[];isLoading: boolean;}) {
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());

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
      </div>);

  }

  if (pages.length === 0) {
    return (
      <Card className="rounded-none">
        <CardContent className="py-12 text-center">
          <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No resource pages assigned to your role yet.
          </p>
        </CardContent>
      </Card>);

  }

  return (
    <div className="space-y-3">
      {pages.map((page) => {
        const isExpanded = expandedPages.has(page.id);
        return (
          <Card key={page.id} className="rounded-none">
            <CardContent className="p-4">
              <button
                type="button"
                className="flex items-center gap-2 w-full text-left hover:text-foreground/80"
                onClick={() => toggleExpand(page.id)}>

                {isExpanded ?
                <ChevronDown className="h-4 w-4 shrink-0" /> :

                <ChevronRight className="h-4 w-4 shrink-0" />
                }
                <h3 className="font-medium">{page.title}</h3>
              </button>
              {isExpanded && page.content &&
              <div
                className="mt-4 pt-4 border-t prose prose-sm max-w-none [&_a]:text-primary [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content) }} />

              }
            </CardContent>
          </Card>);

      })}
    </div>);

}

// ---------------------------------------------------------------------------
// StaffResourcesView
// ---------------------------------------------------------------------------
export function StaffResourcesView() {
  const { activeRole } = useActiveRole();

  const {
    data: groups = [],
    isLoading: groupsLoading
  } = useQuickLinkGroupsByRole(activeRole ?? "concierge");

  const {
    data: pages = [],
    isLoading: pagesLoading
  } = useResourcePagesByRole(activeRole ?? "concierge");

  return (
    <div className="space-y-6">
      <h2 className="text-sm uppercase tracking-[0.15em] font-normal">

      </h2>

      <Tabs defaultValue="quick-links" className="w-full">
        <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-6 h-auto p-0">
          <TabsTrigger
            value="quick-links"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent text-[10px] uppercase tracking-widest px-0 pb-3">

            <Link2 className="h-3.5 w-3.5 mr-1.5" />
            Quick Links
          </TabsTrigger>
          <TabsTrigger
            value="resource-pages"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent text-[10px] uppercase tracking-widest px-0 pb-3">

            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Resource Pages
          </TabsTrigger>
        </TabsList>
        <TabsContent value="quick-links" className="pt-6">
          <QuickLinksTab groups={groups} isLoading={groupsLoading} />
        </TabsContent>
        <TabsContent value="resource-pages" className="pt-6">
          <ResourcePagesTab pages={pages} isLoading={pagesLoading} />
        </TabsContent>
      </Tabs>
    </div>);

}