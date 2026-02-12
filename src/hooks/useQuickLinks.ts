import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/types/roles';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QuickLinkGroup {
  id: string;
  title: string;
  description: string | null;
  display_order: number | null;
  assigned_roles: AppRole[];
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface QuickLinkItem {
  id: string;
  group_id: string;
  name: string;
  url: string;
  display_order: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface QuickLinkGroupWithItems extends QuickLinkGroup {
  items: QuickLinkItem[];
}

export interface CreateQuickLinkGroupInput {
  title: string;
  description?: string | null;
  display_order?: number;
  assigned_roles?: AppRole[];
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

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const QUICK_LINK_GROUPS_KEY = ['quick-link-groups'];
export const QUICK_LINK_ITEMS_KEY = ['quick-link-items'];

// ---------------------------------------------------------------------------
// Group hooks
// ---------------------------------------------------------------------------

export function useQuickLinkGroups() {
  return useQuery({
    queryKey: QUICK_LINK_GROUPS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quick_link_groups')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as QuickLinkGroup[];
    },
  });
}

export function useQuickLinkGroupsWithItems() {
  return useQuery({
    queryKey: [...QUICK_LINK_GROUPS_KEY, 'with-items'],
    queryFn: async () => {
      const { data: groups, error: gErr } = await supabase
        .from('quick_link_groups')
        .select('*')
        .order('display_order', { ascending: true });
      if (gErr) throw gErr;

      const { data: items, error: iErr } = await supabase
        .from('quick_link_items')
        .select('*')
        .order('display_order', { ascending: true });
      if (iErr) throw iErr;

      const typedGroups = (groups ?? []) as unknown as QuickLinkGroup[];
      const typedItems = (items ?? []) as unknown as QuickLinkItem[];

      return typedGroups.map((g) => ({
        ...g,
        items: typedItems.filter((i) => i.group_id === g.id),
      })) as QuickLinkGroupWithItems[];
    },
  });
}

export function useQuickLinkGroupsByRole(role: string) {
  return useQuery({
    queryKey: [...QUICK_LINK_GROUPS_KEY, 'by-role', role],
    queryFn: async () => {
      const { data: groups, error: gErr } = await supabase
        .from('quick_link_groups')
        .select('*')
        .contains('assigned_roles', [role])
        .order('display_order', { ascending: true });
      if (gErr) throw gErr;

      const groupIds = (groups ?? []).map((g: any) => g.id);
      if (groupIds.length === 0) return [] as QuickLinkGroupWithItems[];

      const { data: items, error: iErr } = await supabase
        .from('quick_link_items')
        .select('*')
        .in('group_id', groupIds)
        .order('display_order', { ascending: true });
      if (iErr) throw iErr;

      const typedGroups = (groups ?? []) as unknown as QuickLinkGroup[];
      const typedItems = (items ?? []) as unknown as QuickLinkItem[];

      return typedGroups.map((g) => ({
        ...g,
        items: typedItems.filter((i) => i.group_id === g.id),
      })) as QuickLinkGroupWithItems[];
    },
  });
}

export function useCreateQuickLinkGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateQuickLinkGroupInput) => {
      const { error } = await supabase.from('quick_link_groups').insert(input);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUICK_LINK_GROUPS_KEY }),
  });
}

export function useUpdateQuickLinkGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateQuickLinkGroupInput) => {
      const { error } = await supabase.from('quick_link_groups').update(input).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUICK_LINK_GROUPS_KEY }),
  });
}

export function useDeleteQuickLinkGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('quick_link_groups').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUICK_LINK_GROUPS_KEY }),
  });
}

// ---------------------------------------------------------------------------
// Item hooks
// ---------------------------------------------------------------------------

export function useQuickLinkItems() {
  return useQuery({
    queryKey: QUICK_LINK_ITEMS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quick_link_items')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as QuickLinkItem[];
    },
  });
}

export function useCreateQuickLinkItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateQuickLinkItemInput) => {
      const { error } = await supabase.from('quick_link_items').insert(input);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUICK_LINK_GROUPS_KEY }),
  });
}

export function useUpdateQuickLinkItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateQuickLinkItemInput) => {
      const { error } = await supabase.from('quick_link_items').update(input).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUICK_LINK_GROUPS_KEY }),
  });
}

export function useDeleteQuickLinkItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('quick_link_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUICK_LINK_GROUPS_KEY }),
  });
}
