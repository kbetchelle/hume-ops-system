import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type DevTaskStatus = 'not_started' | 'in_progress' | 'finishing_touches' | 'completed';

export interface DevTask {
  id: string;
  name: string;
  status: DevTaskStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DevNotes {
  id: string;
  content: string;
  updated_at: string;
  updated_by: string | null;
}

const KAT_EMAIL = "kat@thehumeclub.com";

export function useIsKat(userEmail: string | undefined) {
  return userEmail?.toLowerCase() === KAT_EMAIL.toLowerCase();
}

export function useDevTasks() {
  return useQuery({
    queryKey: ["devTasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dev_tasks")
        .select("*")
        .order("sort_order", { ascending: true });
      
      if (error) throw error;
      return data as DevTask[];
    },
  });
}

export function useDevNotes() {
  return useQuery({
    queryKey: ["devNotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dev_notes")
        .select("*")
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as DevNotes | null;
    },
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: DevTaskStatus }) => {
      const { error } = await supabase
        .from("dev_tasks")
        .update({ status })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devTasks"] });
    },
  });
}

export function useAddTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (name: string) => {
      // Get max sort_order
      const { data: existing } = await supabase
        .from("dev_tasks")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1);
      
      const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;
      
      const { error } = await supabase
        .from("dev_tasks")
        .insert({ name, sort_order: nextOrder });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devTasks"] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("dev_tasks")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devTasks"] });
    },
  });
}

export function useUpdateDevNotes() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (content: string) => {
      // First check if a record exists
      const { data: existing } = await supabase
        .from("dev_notes")
        .select("id")
        .limit(1);
      
      if (existing && existing.length > 0) {
        const { error } = await supabase
          .from("dev_notes")
          .update({ content })
          .eq("id", existing[0].id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("dev_notes")
          .insert({ content });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devNotes"] });
    },
  });
}
