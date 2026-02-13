import { useState, useMemo } from "react";
import {
  Link2,
  FileText,
  BookOpen,
  Loader2,
  Copy,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Inbox,
  Search } from
"lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger } from
"@/components/ui/accordion";
import { toast } from "sonner";
import { sanitizeHtml } from "@/lib/utils";
import { useActiveRole } from "@/hooks/useActiveRole";
import { supabase } from "@/integrations/supabase/client";
import {
  useQuickLinkGroupsByRole,
  useResourcePagesByRole,
  type QuickLinkGroupWithItems,
  type ResourcePage } from
"@/hooks/useStaffResources";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Policy {
  id: string;
  title: string;
  content: string;
  category: string | null;
  sort_order: number;
  last_updated_by: string | null;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Quick Links Tab
// ---------------------------------------------------------------------------
function QuickLinksTab({
  groups,
  isLoading,
  searchTerm




}: {groups: QuickLinkGroupWithItems[];isLoading: boolean;searchTerm: string;}) {
  const filtered = useMemo(() => {
    if (!searchTerm) return groups;
    const q = searchTerm.toLowerCase();
    return groups.
    map((group) => {
      const groupMatches =
      group.title.toLowerCase().includes(q) ||
      (group.description ?? "").toLowerCase().includes(q);
      const matchingItems = group.items.filter((item) =>
      item.name.toLowerCase().includes(q)
      );
      if (groupMatches) return group;
      if (matchingItems.length > 0) return { ...group, items: matchingItems };
      return null;
    }).
    filter(Boolean) as QuickLinkGroupWithItems[];
  }, [groups, searchTerm]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>);

  }

  if (filtered.length === 0) {
    return (
      <Card className="rounded-none">
        <CardContent className="py-12 text-center">
          <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {searchTerm ?
            "No quick links match your search." :
            "No quick links assigned to your role yet."}
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
      {filtered.map((group) =>
      <Card key={group.id} className="rounded-none">
          <CardContent className="p-4">
            <h3 className="font-medium mb-1">{group.title}</h3>
            {group.description &&
          <div
            className="prose prose-sm max-w-none [&_a]:text-primary [&_a]:underline text-muted-foreground mb-3"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(group.description)
            }} />

          }
            {group.items.length > 0 &&
          <div className="flex flex-col">
                {group.items.map((link) =>
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 px-1 py-1.5 hover:bg-muted/50 transition-colors">

                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="text-sm text-primary hover:text-primary/80 truncate">
                      {link.name}
                    </span>
                    <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCopy(link.url);
                }}
                className="ml-[10px] opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded-sm"
                title="Copy URL">

                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </a>
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
function ResourcePagesTab({
  pages,
  isLoading,
  searchTerm




}: {pages: ResourcePage[];isLoading: boolean;searchTerm: string;}) {
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
      </div>);

  }

  if (filtered.length === 0) {
    return (
      <Card className="rounded-none">
        <CardContent className="py-12 text-center">
          <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {searchTerm ?
            "No resource pages match your search." :
            "No resource pages assigned to your role yet."}
          </p>
        </CardContent>
      </Card>);

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
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(page.content)
                }} />

              }
            </CardContent>
          </Card>);

      })}
    </div>);

}

// ---------------------------------------------------------------------------
// Policies Tab
// ---------------------------------------------------------------------------
function PoliciesTab({
  policies,
  isLoading,
  searchTerm




}: {policies: Policy[];isLoading: boolean;searchTerm: string;}) {
  const filtered = useMemo(() => {
    if (!searchTerm) return policies;
    const q = searchTerm.toLowerCase();
    return policies.filter(
      (p) =>
      p.title.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q)
    );
  }, [policies, searchTerm]);

  const policiesByCategory = useMemo(() => {
    return filtered.reduce(
      (acc, policy) => {
        const cat = policy.category || "General";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(policy);
        return acc;
      },
      {} as Record<string, Policy[]>
    );
  }, [filtered]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>);

  }

  if (Object.keys(policiesByCategory).length === 0) {
    return (
      <Card className="rounded-none">
        <CardContent className="py-12 text-center">
          <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {searchTerm ?
            "No policies match your search." :
            "No policies available."}
          </p>
        </CardContent>
      </Card>);

  }

  return (
    <Accordion type="multiple" className="space-y-2">
      {Object.entries(policiesByCategory).map(
        ([category, categoryPolicies]) =>
        <div key={category}>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {category}
            </h4>
            {categoryPolicies.map((policy) =>
          <AccordionItem
            key={policy.id}
            value={policy.id}
            className="border mb-1">

                <AccordionTrigger className="px-3 py-2 text-xs hover:no-underline">
                  {policy.title}
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                    {policy.content}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-3 pt-2 border-t">
                    Last updated by {policy.last_updated_by} &bull;{" "}
                    {format(parseISO(policy.updated_at), "MMM d, yyyy")}
                  </p>
                </AccordionContent>
              </AccordionItem>
          )}
          </div>

      )}
    </Accordion>);

}

// ---------------------------------------------------------------------------
// StaffResourcesView
// ---------------------------------------------------------------------------
export function StaffResourcesView() {
  const { activeRole } = useActiveRole();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: groups = [], isLoading: groupsLoading } =
  useQuickLinkGroupsByRole(activeRole ?? "concierge");

  const { data: pages = [], isLoading: pagesLoading } =
  useResourcePagesByRole(activeRole ?? "concierge");

  const { data: policies = [], isLoading: policiesLoading } = useQuery({
    queryKey: ["club-policies"],
    queryFn: async () => {
      const { data, error } = await supabase.
      from("club_policies").
      select("*").
      eq("is_active", true).
      order("sort_order", { ascending: true });

      if (error) throw error;
      return (data || []) as Policy[];
    }
  });

  return (
    <div className="space-y-6">
      



      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search resources..."
          className="pl-10 rounded-none" />

      </div>

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
          <TabsTrigger
            value="policies"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent text-[10px] uppercase tracking-widest px-0 pb-3">

            <BookOpen className="h-3.5 w-3.5 mr-1.5" />
            Policies
          </TabsTrigger>
        </TabsList>
        <TabsContent value="quick-links" className="pt-6">
          <QuickLinksTab
            groups={groups}
            isLoading={groupsLoading}
            searchTerm={searchTerm} />

        </TabsContent>
        <TabsContent value="resource-pages" className="pt-6">
          <ResourcePagesTab
            pages={pages}
            isLoading={pagesLoading}
            searchTerm={searchTerm} />

        </TabsContent>
        <TabsContent value="policies" className="pt-6">
          <PoliciesTab
            policies={policies}
            isLoading={policiesLoading}
            searchTerm={searchTerm} />

        </TabsContent>
      </Tabs>
    </div>);

}