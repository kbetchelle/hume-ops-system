import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StaffDocument {
  id: string;
  title: string;
  description: string | null;
  category: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  target_roles: string[] | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  uploaded_by: string | null;
  uploaded_by_id: string | null;
}

/**
 * Fetch staff documents visible to the current user's roles.
 * Returns active documents where target_roles is null/empty (visible to all) or includes one of the user's actual roles.
 */
export function useStaffDocuments(userRoles: string[] | undefined) {
  return useQuery({
    queryKey: ["staff-documents", userRoles],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_documents")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const docs = (data || []) as StaffDocument[];
      if (!userRoles?.length) return docs;

      const roleSet = new Set(userRoles);
      return docs.filter((doc) => {
        const target = doc.target_roles;
        if (!target || target.length === 0) return true;
        return target.some((r) => roleSet.has(r));
      });
    },
    enabled: true,
  });
}
