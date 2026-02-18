import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface ResourcePageEditor {
  id: string;
  page_id: string;
  user_id: string;
  granted_by: string | null;
  granted_at: string;
}

export interface PageEditorWithProfile extends ResourcePageEditor {
  user_profile?: {
    full_name: string | null;
    email: string | null;
  };
}

// ---------------------------------------------------------------------------
// Query key
// ---------------------------------------------------------------------------

export const RESOURCE_PAGE_EDITORS_KEY = "resource-page-editors";

// ===========================================================================
// Queries
// ===========================================================================

/**
 * Fetch all delegated editors for a specific page, joined with user profiles.
 */
export function usePageEditors(pageId: string | undefined) {
  return useQuery({
    queryKey: [RESOURCE_PAGE_EDITORS_KEY, pageId],
    queryFn: async () => {
      if (!pageId) return [];

      const { data, error } = await (supabase.from("resource_page_editors") as any)
        .select(
          `
          *,
          user_profile:profiles!user_id(full_name, email)
        `
        )
        .eq("page_id", pageId);

      if (error) throw error;
      return (data ?? []) as unknown as PageEditorWithProfile[];
    },
    enabled: !!pageId,
  });
}

/**
 * Fetch all pages where the current user has delegated edit access.
 * For non-manager users to see which pages they can edit.
 */
export function useMyEditablePages() {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: [RESOURCE_PAGE_EDITORS_KEY, "my-pages", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("resource_page_editors")
        .select(
          `
          *,
          page:resource_pages(*)
        `
        )
        .eq("user_id", user.id);

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

// ===========================================================================
// Mutations
// ===========================================================================

/**
 * Grant edit access to a user for a specific page.
 */
export function useAddPageEditor() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async ({
      pageId,
      userId,
    }: {
      pageId: string;
      userId: string;
    }) => {
      const { data, error } = await supabase
        .from("resource_page_editors")
        .insert({
          page_id: pageId,
          user_id: userId,
          granted_by: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ResourcePageEditor;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [RESOURCE_PAGE_EDITORS_KEY, variables.pageId],
      });
      toast.success("Editor access granted");
    },
    onError: (error: Error) => {
      toast.error("Failed to grant editor access: " + error.message);
    },
  });
}

/**
 * Revoke edit access from a user for a specific page.
 */
export function useRemovePageEditor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pageId,
      userId,
    }: {
      pageId: string;
      userId: string;
    }) => {
      const { error } = await supabase
        .from("resource_page_editors")
        .delete()
        .eq("page_id", pageId)
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [RESOURCE_PAGE_EDITORS_KEY, variables.pageId],
      });
      toast.success("Editor access revoked");
    },
    onError: (error: Error) => {
      toast.error("Failed to revoke editor access: " + error.message);
    },
  });
}
