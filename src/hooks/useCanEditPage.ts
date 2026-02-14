import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/features/auth/AuthProvider";

/**
 * Check if the current user can edit a specific page.
 * Returns whether they're a manager or a delegated editor.
 */
export function useCanEditPage(pageId: string | undefined) {
  const { user, userRoles } = useAuthContext();

  return useQuery({
    queryKey: ["can-edit-page", pageId, user?.id],
    queryFn: async () => {
      if (!user || !pageId) {
        return {
          canEdit: false,
          isManager: false,
          isDelegatedEditor: false,
          isLoading: false,
        };
      }

      // Check if user is manager or admin
      const isManager =
        userRoles.includes("admin") || userRoles.includes("manager");

      if (isManager) {
        return {
          canEdit: true,
          isManager: true,
          isDelegatedEditor: false,
          isLoading: false,
        };
      }

      // Check if user is a delegated editor
      const { data, error } = await supabase
        .from("resource_page_editors")
        .select("id")
        .eq("page_id", pageId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      const isDelegatedEditor = !!data;

      return {
        canEdit: isDelegatedEditor,
        isManager: false,
        isDelegatedEditor,
        isLoading: false,
      };
    },
    enabled: !!user && !!pageId,
  });
}
