import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PageStatus = "Not Started" | "In Progress" | "Finishing Touches" | "Complete" | "Deprioritized" | "PHASE 2" | "TBD";

export interface PageDevStatus {
  id: string;
  category: string;
  task: string;
  status: PageStatus;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
  // Compatibility aliases
  page_title: string;
  role_category: string | null;
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
    queryKey: ["build-status"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("build_status")
        .select("*")
        .order("category", { ascending: true })
        .order("task", { ascending: true });

      if (error) throw error;
      // Map to expected interface; exclude Skipped Records (lives only in nav under Dev Tools, not on dashboard)
      return data
        .filter((item: any) => item.task !== "Skipped Records")
        .map((item: any) => ({
          id: item.id,
          category: item.category,
          task: item.task,
          page_title: item.task,
          status: item.status as PageStatus,
          role_category: item.category,
          notes: item.notes,
          created_at: item.created_at,
          updated_at: item.updated_at,
        }));
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
        .from("build_status")
        .update({ status })
        .eq("id", pageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["build-status"] });
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
        .from("build_status")
        .update({ category: roleCategory })
        .eq("id", pageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["build-status"] });
    },
  });
}

// Delete page status record
export function useDeletePageStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pageId: string) => {
      const { error } = await supabase
        .from("build_status")
        .delete()
        .eq("id", pageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["build-status"] });
    },
  });
}

// Create new page status record
export function useCreatePageStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pageTitle,
      pagePath,
      status,
      roleCategory,
    }: {
      pageTitle: string;
      pagePath: string;
      status: PageStatus;
      roleCategory: string;
    }) => {
      const { error } = await supabase
        .from("build_status")
        .insert({
          task: pageTitle,
          status,
          category: roleCategory,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["build-status"] });
    },
  });
}

// Update page title
export function useUpdatePageTitle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pageId,
      pageTitle,
    }: {
      pageId: string;
      pageTitle: string;
    }) => {
      const { error } = await supabase
        .from("build_status")
        .update({ task: pageTitle })
        .eq("id", pageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["build-status"] });
    },
  });
}

// Fetch dev notes (singleton)
export function useDevNotes() {
  return useQuery({
    queryKey: ["dev-notes"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("dev_notes" as any) as any)
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
      const { data: existing } = await (supabase
        .from("dev_notes" as any) as any)
        .select("id")
        .limit(1)
        .single();

      if (existing) {
        const { error } = await (supabase
          .from("dev_notes" as any) as any)
          .update({ content, updated_by: user?.id })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await (supabase
          .from("dev_notes" as any) as any)
          .insert({ content, updated_by: user?.id });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dev-notes"] });
    },
  });
}
