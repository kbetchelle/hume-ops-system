import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/types/roles';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ResourcePage {
  id: string;
  title: string;
  content: string | null;
  assigned_roles: AppRole[];
  is_published: boolean | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateResourcePageInput {
  title: string;
  content?: string | null;
  assigned_roles?: AppRole[];
  is_published?: boolean;
}

export interface UpdateResourcePageInput extends CreateResourcePageInput {
  id: string;
}

// ---------------------------------------------------------------------------
// Query key
// ---------------------------------------------------------------------------

export const RESOURCE_PAGES_KEY = ['resource-pages'];

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useResourcePages(publishedOnly = true) {
  return useQuery({
    queryKey: [...RESOURCE_PAGES_KEY, publishedOnly],
    queryFn: async () => {
      let query = supabase.from('resource_pages').select('*').order('title');
      if (publishedOnly) {
        query = query.eq('is_published', true);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as ResourcePage[];
    },
  });
}

export function useResourcePagesByRole(role: string) {
  return useQuery({
    queryKey: [...RESOURCE_PAGES_KEY, 'by-role', role],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('resource_pages')
        .select('*')
        .eq('is_published', true)
        .contains('assigned_roles', [role])
        .order('title');
      if (error) throw error;
      return (data ?? []) as unknown as ResourcePage[];
    },
  });
}

export function useCreateResourcePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateResourcePageInput) => {
      const { error } = await supabase.from('resource_pages').insert(input);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: RESOURCE_PAGES_KEY }),
  });
}

export function useUpdateResourcePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateResourcePageInput) => {
      const { error } = await supabase.from('resource_pages').update(input).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: RESOURCE_PAGES_KEY }),
  });
}

export function useDeleteResourcePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('resource_pages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: RESOURCE_PAGES_KEY }),
  });
}
