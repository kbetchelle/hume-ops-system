import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { toast } from "sonner";
import { AppRole } from "@/types/roles";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

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
// Query key
// ---------------------------------------------------------------------------

export const RESOURCE_PAGES_KEY = "resource-pages";

// ===========================================================================
// Queries
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

// ===========================================================================
// Mutations
// ===========================================================================

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
