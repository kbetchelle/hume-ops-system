import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { toast } from "sonner";
import { AppRole } from "@/types/roles";

// ---------------------------------------------------------------------------
// Manual interfaces (tables not yet in auto-generated Supabase types)
// ---------------------------------------------------------------------------

export interface QuickLinkGroup {
  id: string;
  title: string;
  description: string | null;
  display_order: number;
  assigned_roles: AppRole[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuickLinkItem {
  id: string;
  group_id: string;
  name: string;
  url: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface QuickLinkGroupWithItems extends QuickLinkGroup {
  items: QuickLinkItem[];
}

export interface ResourcePage {
  id: string;
  title: string;
  content: string | null;
  assigned_roles: AppRole[];
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateQuickLinkGroupInput {
  title: string;
  description?: string | null;
  display_order?: number;
  assigned_roles: AppRole[];
}

export interface UpdateQuickLinkGroupInput extends CreateQuickLinkGroupInput {
  id: string;
}

export interface CreateQuickLinkItemInput {
  group_id: string;
  name: string;
  url: string;
  display_order?: number;
}

export interface UpdateQuickLinkItemInput extends CreateQuickLinkItemInput {
  id: string;
}

export interface CreateResourcePageInput {
  title: string;
  content?: string | null;
  assigned_roles: AppRole[];
  is_published?: boolean;
}

export interface UpdateResourcePageInput extends CreateResourcePageInput {
  id: string;
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const QUICK_LINK_GROUPS_KEY = "quick-link-groups";
const QUICK_LINK_ITEMS_KEY = "quick-link-items";
const RESOURCE_PAGES_KEY = "resource-pages";

// ===========================================================================
// Quick Link Groups
// ===========================================================================

/**
 * Fetch all quick link groups ordered by display_order.
 */
export function useQuickLinkGroups() {
  return useQuery({
    queryKey: [QUICK_LINK_GROUPS_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quick_link_groups" as any)
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return (data ?? []) as unknown as QuickLinkGroup[];
    },
  });
}

/**
 * Fetch all groups with their items combined client-side.
 */
export function useQuickLinkGroupsWithItems() {
  return useQuery({
    queryKey: [QUICK_LINK_GROUPS_KEY, "with-items"],
    queryFn: async () => {
      const [groupsResult, itemsResult] = await Promise.all([
        supabase
          .from("quick_link_groups" as any)
          .select("*")
          .order("display_order", { ascending: true }),
        supabase
          .from("quick_link_items" as any)
          .select("*")
          .order("display_order", { ascending: true }),
      ]);

      if (groupsResult.error) throw groupsResult.error;
      if (itemsResult.error) throw itemsResult.error;

      const groups = (groupsResult.data ?? []) as unknown as QuickLinkGroup[];
      const items = (itemsResult.data ?? []) as unknown as QuickLinkItem[];

      return groups.map((group) => ({
        ...group,
        items: items.filter((item) => item.group_id === group.id),
      })) as QuickLinkGroupWithItems[];
    },
  });
}

/**
 * Fetch groups (with items) filtered by role.
 * Admin/manager see all groups; other roles see only groups whose
 * assigned_roles array contains their role.
 */
export function useQuickLinkGroupsByRole(role: AppRole) {
  return useQuery({
    queryKey: [QUICK_LINK_GROUPS_KEY, "by-role", role],
    queryFn: async () => {
      const isPrivileged = role === "admin" || role === "manager";

      let groupsQuery = supabase
        .from("quick_link_groups" as any)
        .select("*")
        .order("display_order", { ascending: true });

      if (!isPrivileged) {
        groupsQuery = groupsQuery.contains("assigned_roles", [role]);
      }

      const { data: groupsData, error: groupsError } = await groupsQuery;
      if (groupsError) throw groupsError;

      const groups = (groupsData ?? []) as unknown as QuickLinkGroup[];

      if (groups.length === 0) return [] as QuickLinkGroupWithItems[];

      const groupIds = groups.map((g) => g.id);

      const { data: itemsData, error: itemsError } = await supabase
        .from("quick_link_items" as any)
        .select("*")
        .in("group_id", groupIds)
        .order("display_order", { ascending: true });

      if (itemsError) throw itemsError;

      const items = (itemsData ?? []) as unknown as QuickLinkItem[];

      return groups.map((group) => ({
        ...group,
        items: items.filter((item) => item.group_id === group.id),
      })) as QuickLinkGroupWithItems[];
    },
  });
}

/**
 * Create a new quick link group.
 */
export function useCreateQuickLinkGroup() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async (input: CreateQuickLinkGroupInput) => {
      const { data, error } = await supabase
        .from("quick_link_groups" as any)
        .insert({
          title: input.title,
          description: input.description ?? null,
          display_order: input.display_order ?? 0,
          assigned_roles: input.assigned_roles,
          created_by: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as QuickLinkGroup;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUICK_LINK_GROUPS_KEY] });
      toast.success("Quick link group created successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to create quick link group: " + error.message);
    },
  });
}

/**
 * Update an existing quick link group.
 */
export function useUpdateQuickLinkGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateQuickLinkGroupInput) => {
      const { id, ...rest } = input;
      const { data, error } = await supabase
        .from("quick_link_groups" as any)
        .update(rest)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as QuickLinkGroup;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUICK_LINK_GROUPS_KEY] });
      toast.success("Quick link group updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update quick link group: " + error.message);
    },
  });
}

/**
 * Hard-delete a quick link group (CASCADE removes its items).
 */
export function useDeleteQuickLinkGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("quick_link_groups" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUICK_LINK_GROUPS_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUICK_LINK_ITEMS_KEY] });
      toast.success("Quick link group deleted");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete quick link group: " + error.message);
    },
  });
}

// ===========================================================================
// Quick Link Items
// ===========================================================================

/**
 * Fetch items for a specific group ordered by display_order.
 */
export function useQuickLinkItems(groupId: string) {
  return useQuery({
    queryKey: [QUICK_LINK_ITEMS_KEY, groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quick_link_items" as any)
        .select("*")
        .eq("group_id", groupId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return (data ?? []) as unknown as QuickLinkItem[];
    },
    enabled: !!groupId,
  });
}

/**
 * Create a new quick link item.
 */
export function useCreateQuickLinkItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateQuickLinkItemInput) => {
      const { data, error } = await supabase
        .from("quick_link_items" as any)
        .insert({
          group_id: input.group_id,
          name: input.name,
          url: input.url,
          display_order: input.display_order ?? 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as QuickLinkItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUICK_LINK_ITEMS_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUICK_LINK_GROUPS_KEY] });
      toast.success("Quick link created successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to create quick link: " + error.message);
    },
  });
}

/**
 * Update an existing quick link item.
 */
export function useUpdateQuickLinkItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateQuickLinkItemInput) => {
      const { id, ...rest } = input;
      const { data, error } = await supabase
        .from("quick_link_items" as any)
        .update(rest)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as QuickLinkItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUICK_LINK_ITEMS_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUICK_LINK_GROUPS_KEY] });
      toast.success("Quick link updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update quick link: " + error.message);
    },
  });
}

/**
 * Hard-delete a quick link item.
 */
export function useDeleteQuickLinkItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("quick_link_items" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUICK_LINK_ITEMS_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUICK_LINK_GROUPS_KEY] });
      toast.success("Quick link deleted");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete quick link: " + error.message);
    },
  });
}

// ===========================================================================
// Resource Pages
// ===========================================================================

/**
 * Fetch all resource pages, optionally filtered to published only.
 */
export function useResourcePages(publishedOnly?: boolean) {
  return useQuery({
    queryKey: [RESOURCE_PAGES_KEY, publishedOnly],
    queryFn: async () => {
      let query = supabase
        .from("resource_pages" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (publishedOnly) {
        query = query.eq("is_published", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as ResourcePage[];
    },
  });
}

/**
 * Fetch published resource pages filtered by role.
 * Admin/manager see all published pages; other roles see only pages
 * whose assigned_roles contains their role.
 */
export function useResourcePagesByRole(role: AppRole) {
  return useQuery({
    queryKey: [RESOURCE_PAGES_KEY, "by-role", role],
    queryFn: async () => {
      const isPrivileged = role === "admin" || role === "manager";

      let query = supabase
        .from("resource_pages" as any)
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (!isPrivileged) {
        query = query.contains("assigned_roles", [role]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as ResourcePage[];
    },
  });
}

/**
 * Create a new resource page.
 */
export function useCreateResourcePage() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async (input: CreateResourcePageInput) => {
      const { data, error } = await supabase
        .from("resource_pages" as any)
        .insert({
          title: input.title,
          content: input.content ?? null,
          assigned_roles: input.assigned_roles,
          is_published: input.is_published ?? false,
          created_by: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as ResourcePage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RESOURCE_PAGES_KEY] });
      toast.success("Resource page created successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to create resource page: " + error.message);
    },
  });
}

/**
 * Update an existing resource page.
 */
export function useUpdateResourcePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateResourcePageInput) => {
      const { id, ...rest } = input;
      const { data, error } = await supabase
        .from("resource_pages" as any)
        .update(rest)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as ResourcePage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RESOURCE_PAGES_KEY] });
      toast.success("Resource page updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update resource page: " + error.message);
    },
  });
}

/**
 * Hard-delete a resource page.
 */
export function useDeleteResourcePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("resource_pages" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RESOURCE_PAGES_KEY] });
      toast.success("Resource page deleted");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete resource page: " + error.message);
    },
  });
}
