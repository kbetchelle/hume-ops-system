import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UserWithSlingInfo {
  user_id: string;
  email: string;
  full_name: string | null;
  sling_id: string | null;
  sling_user_name: string | null;
  sling_email: string | null;
  is_auto_matched: boolean | null;
}

export interface SlingUserSearchResult {
  id: string;
  sling_user_id: number;
  full_name: string;
  email: string;
  is_active: boolean;
}

export function useUsersWithSlingInfo() {
  return useQuery({
    queryKey: ["admin", "users-sling-info"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_users_with_sling_info");
      
      if (error) throw error;
      return data as UserWithSlingInfo[];
    },
  });
}

export function useSearchSlingUsers(search: string) {
  return useQuery({
    queryKey: ["sling-users-search", search],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("search_sling_users", {
        _search: search,
      });
      
      if (error) throw error;
      return data as SlingUserSearchResult[];
    },
    enabled: true,
  });
}

export function useLinkUserToSling() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, slingId }: { userId: string; slingId: string | null }) => {
      const { error } = await supabase.rpc("admin_link_user_to_sling", {
        _user_id: userId,
        _sling_id: slingId,
      });
      
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users-sling-info"] });
    },
  });
}
