import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PageStatus = "not_started" | "in_progress" | "finishing_touches" | "completed";

export interface PageDevStatus {
  id: string;
  page_path: string;
  page_title: string;
  status: PageStatus;
  role_category: string | null;
  created_at: string;
  updated_at: string;
}

export interface DevNote {
  id: string;
  content: string;
  updated_at: string;
  updated_by: string | null;
}

// Fetch all page statuses
export function usePageStatuses() {
  return useQuery({
    queryKey: ["page-dev-status"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_dev_status")
        .select("*")
        .order("page_title", { ascending: true });

      if (error) throw error;
      return data as PageDevStatus[];
    },
  });
}

// Update page status
export function useUpdatePageStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pageId,
      status,
    }: {
      pageId: string;
      status: PageStatus;
    }) => {
      const { error } = await supabase
        .from("page_dev_status")
        .update({ status })
        .eq("id", pageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["page-dev-status"] });
    },
  });
}

// Update page role category
export function useUpdatePageRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pageId,
      roleCategory,
    }: {
      pageId: string;
      roleCategory: string;
    }) => {
      const { error } = await supabase
        .from("page_dev_status")
        .update({ role_category: roleCategory })
        .eq("id", pageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["page-dev-status"] });
    },
  });
}

// Delete page status record
export function useDeletePageStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pageId: string) => {
      const { error } = await supabase
        .from("page_dev_status")
        .delete()
        .eq("id", pageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["page-dev-status"] });
    },
  });
}

// Fetch dev notes (singleton)
export function useDevNotes() {
  return useQuery({
    queryKey: ["dev-notes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dev_notes")
        .select("*")
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as DevNote | null;
    },
  });
}

// Update or create dev notes
export function useUpdateDevNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ content }: { content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Try to update existing record
      const { data: existing } = await supabase
        .from("dev_notes")
        .select("id")
        .limit(1)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("dev_notes")
          .update({ content, updated_by: user?.id })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("dev_notes")
          .insert({ content, updated_by: user?.id });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dev-notes"] });
    },
  });
}
