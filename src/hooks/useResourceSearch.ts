import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { stripHtml } from "@/lib/utils";
import type { AppRole } from "@/types/roles";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface SearchQuickLinkGroup {
  id: string;
  title: string;
  description: string | null;
  display_order: number;
  assigned_roles: AppRole[];
  items: SearchQuickLinkItem[];
  isOwnRole: boolean;
}

export interface SearchQuickLinkItem {
  id: string;
  group_id: string;
  name: string;
  url: string;
  display_order: number;
}

export interface SearchResourcePage {
  id: string;
  title: string;
  content: string | null;
  assigned_roles: AppRole[];
  isOwnRole: boolean;
  tags: string[];
}

export interface SearchPolicy {
  id: string;
  content: string;
  category: string | null;
  tags: string[];
  last_updated_by: string | null;
  updated_at: string;
  isOwnRole: boolean;
}

export interface ResourceSearchResults {
  quickLinks: SearchQuickLinkGroup[];
  resourcePages: SearchResourcePage[];
  policies: SearchPolicy[];
  totalCount: number;
}

// ---------------------------------------------------------------------------
// Raw types from DB
// ---------------------------------------------------------------------------

interface RawQuickLinkGroup {
  id: string;
  title: string;
  description: string | null;
  display_order: number;
  assigned_roles: AppRole[];
}

interface RawQuickLinkItem {
  id: string;
  group_id: string;
  name: string;
  url: string;
  display_order: number;
}

interface RawResourcePage {
  id: string;
  title: string;
  content: string | null;
  assigned_roles: AppRole[];
  tags: string[];
  search_text: string | null;
}

interface RawPolicy {
  id: string;
  content: string;
  category: string | null;
  tags: string[];
  last_updated_by: string | null;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Data fetching hook — loads ALL resources once, cached by React Query
// ---------------------------------------------------------------------------

function useAllResources() {
  return useQuery({
    queryKey: ["resource-search-all"],
    queryFn: async () => {
      const [groupsResult, itemsResult, pagesResult, policiesResult] =
        await Promise.all([
          supabase
            .from("quick_link_groups")
            .select("id, title, description, display_order, assigned_roles")
            .order("display_order", { ascending: true }),
          supabase
            .from("quick_link_items")
            .select("id, group_id, name, url, display_order")
            .order("display_order", { ascending: true }),
          supabase
            .from("resource_pages")
            .select("id, title, content, assigned_roles, tags, search_text")
            .eq("is_published", true)
            .order("created_at", { ascending: false }),
          supabase
            .from("club_policies")
            .select(
              "id, content, category, tags, last_updated_by, updated_at"
            )
            .eq("is_active", true)
            .order("updated_at", { ascending: false }),
        ]);

      if (groupsResult.error) throw groupsResult.error;
      if (itemsResult.error) throw itemsResult.error;
      if (pagesResult.error) throw pagesResult.error;
      if (policiesResult.error) throw policiesResult.error;

      return {
        groups: (groupsResult.data ?? []) as unknown as RawQuickLinkGroup[],
        items: (itemsResult.data ?? []) as unknown as RawQuickLinkItem[],
        pages: (pagesResult.data ?? []) as unknown as RawResourcePage[],
        policies: (policiesResult.data ?? []) as unknown as RawPolicy[],
      };
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}

// ---------------------------------------------------------------------------
// Smart substring matcher — case-insensitive, searches within strings
// ---------------------------------------------------------------------------

function matches(text: string | null | undefined, query: string): boolean {
  if (!text) return false;
  return text.toLowerCase().includes(query);
}

function matchesHtml(
  html: string | null | undefined,
  query: string
): boolean {
  if (!html) return false;
  return stripHtml(html).toLowerCase().includes(query);
}

// ---------------------------------------------------------------------------
// Check if a resource is assigned to the active role
// ---------------------------------------------------------------------------

function isAssignedToRole(
  assignedRoles: AppRole[] | null | undefined,
  activeRole: AppRole | null
): boolean {
  // Policies and resources with no assigned roles are considered "own role"
  if (!assignedRoles || assignedRoles.length === 0) return true;
  if (!activeRole) return false;
  // Admin/manager see everything as "own role"
  if (activeRole === "admin" || activeRole === "manager") return true;
  return assignedRoles.includes(activeRole);
}

// ---------------------------------------------------------------------------
// Main search hook
// ---------------------------------------------------------------------------

export function useResourceSearch(
  searchTerm: string,
  activeRole: AppRole | null
): { results: ResourceSearchResults; isLoading: boolean } {
  const { data, isLoading } = useAllResources();

  const results = useMemo<ResourceSearchResults>(() => {
    const empty: ResourceSearchResults = {
      quickLinks: [],
      resourcePages: [],
      policies: [],
      totalCount: 0,
    };

    if (!data || !searchTerm || searchTerm.trim().length < 2) return empty;

    const q = searchTerm.trim().toLowerCase();

    // --- Quick Links ---
    // Track seen group IDs to avoid duplicates
    const seenGroupIds = new Set<string>();
    const matchedGroups: SearchQuickLinkGroup[] = [];

    for (const group of data.groups) {
      if (seenGroupIds.has(group.id)) continue;
      seenGroupIds.add(group.id);

      const groupItems = data.items.filter((i) => i.group_id === group.id);

      const groupTitleMatch = matches(group.title, q);
      const groupDescMatch = matchesHtml(group.description, q);
      const matchingItems = groupItems.filter((item) =>
        matches(item.name, q)
      );

      if (groupTitleMatch || groupDescMatch || matchingItems.length > 0) {
        matchedGroups.push({
          ...group,
          // If the group itself matches, show all items; otherwise only matching items
          items:
            groupTitleMatch || groupDescMatch ? groupItems : matchingItems,
          isOwnRole: isAssignedToRole(group.assigned_roles, activeRole),
        });
      }
    }

    // --- Resource Pages ---
    const seenPageIds = new Set<string>();
    const matchedPages: SearchResourcePage[] = [];

    for (const page of data.pages) {
      if (seenPageIds.has(page.id)) continue;
      seenPageIds.add(page.id);

      const titleMatch = matches(page.title, q);
      const contentMatch = matchesHtml(page.content, q);
      const searchTextMatch = page.search_text && page.search_text.toLowerCase().includes(q);
      const tagMatch = page.tags.some((tag) => tag.toLowerCase().includes(q));

      if (titleMatch || contentMatch || searchTextMatch || tagMatch) {
        matchedPages.push({
          ...page,
          isOwnRole: isAssignedToRole(page.assigned_roles, activeRole),
        });
      }
    }

    // --- Policies ---
    const seenPolicyIds = new Set<string>();
    const matchedPolicies: SearchPolicy[] = [];

    for (const policy of data.policies) {
      if (seenPolicyIds.has(policy.id)) continue;
      seenPolicyIds.add(policy.id);

      const contentMatch = matches(policy.content, q);
      const categoryMatch = matches(policy.category, q);
      const tagMatch = policy.tags.some((tag) => tag.toLowerCase().includes(q));

      if (contentMatch || categoryMatch || tagMatch) {
        matchedPolicies.push({
          ...policy,
          // Policies have no role assignment — always "own role"
          isOwnRole: true,
        });
      }
    }

    // Sort each category: own-role first, then other-role
    const sortByRole = <T extends { isOwnRole: boolean }>(arr: T[]): T[] =>
      [...arr].sort((a, b) => (a.isOwnRole === b.isOwnRole ? 0 : a.isOwnRole ? -1 : 1));

    const quickLinks = sortByRole(matchedGroups);
    const resourcePages = sortByRole(matchedPages);
    const policies = sortByRole(matchedPolicies);

    return {
      quickLinks,
      resourcePages,
      policies,
      totalCount:
        quickLinks.length + resourcePages.length + policies.length,
    };
  }, [data, searchTerm, activeRole]);

  return { results, isLoading };
}
