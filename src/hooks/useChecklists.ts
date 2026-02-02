import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export interface Checklist {
  id: string;
  title: string;
  description: string | null;
  role: AppRole;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  template_id: string | null;
  task_description: string | null;
  is_class_triggered: boolean | null;
  task_type: string | null;
  label_spanish: string | null;
  required: boolean | null;
  time_hint: string | null;
  category: string | null;
  color: string | null;
  is_high_priority: boolean | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ChecklistCompletion {
  id: string;
  checklist_item_id: string;
  user_id: string;
  completion_date: string;
  completed_at: string;
}

export interface ChecklistWithItems extends Checklist {
  items: ChecklistItem[];
}

// Fetch all checklists (for managers)
export function useChecklists() {
  return useQuery({
    queryKey: ["checklists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checklists")
        .select("*")
        .order("role")
        .order("title");

      if (error) throw error;
      return data as Checklist[];
    },
  });
}

// Fetch checklists for specific roles (for staff)
export function useChecklistsForRoles(roles: AppRole[]) {
  return useQuery({
    queryKey: ["checklists", "roles", roles],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checklists")
        .select("*")
        .in("role", roles)
        .eq("is_active", true)
        .order("title");

      if (error) throw error;
      return data as Checklist[];
    },
    enabled: roles.length > 0,
  });
}

// Fetch items for a checklist (by template_id)
export function useChecklistItems(templateId: string | null) {
  return useQuery({
    queryKey: ["checklist-items", templateId],
    queryFn: async () => {
      if (!templateId) return [];
      const { data, error } = await supabase
        .from("checklist_items")
        .select("*")
        .eq("template_id", templateId)
        .order("sort_order");

      if (error) throw error;
      return data as ChecklistItem[];
    },
    enabled: !!templateId,
  });
}

// Fetch completions for today
export function useTodayCompletions(userId: string | null) {
  const today = new Date().toISOString().split("T")[0];
  
  return useQuery({
    queryKey: ["completions", "today", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("checklist_completions")
        .select("*")
        .eq("user_id", userId)
        .eq("completion_date", today);

      if (error) throw error;
      return data as ChecklistCompletion[];
    },
    enabled: !!userId,
  });
}

// Fetch completions for a date range (for managers viewing history)
export function useCompletionsForDate(date: string) {
  return useQuery({
    queryKey: ["completions", "date", date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checklist_completions")
        .select("*")
        .eq("completion_date", date);

      if (error) throw error;
      return data as ChecklistCompletion[];
    },
  });
}

// Fetch user's completion history
export function useCompletionHistory(userId: string | null, days: number = 7) {
  return useQuery({
    queryKey: ["completions", "history", userId, days],
    queryFn: async () => {
      if (!userId) return [];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data, error } = await supabase
        .from("checklist_completions")
        .select("*")
        .eq("user_id", userId)
        .gte("completion_date", startDate.toISOString().split("T")[0])
        .order("completion_date", { ascending: false });

      if (error) throw error;
      return data as ChecklistCompletion[];
    },
    enabled: !!userId,
  });
}

// Create checklist mutation
export function useCreateChecklist() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { title: string; description?: string; role: AppRole }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      const { data: result, error } = await supabase
        .from("checklists")
        .insert({
          title: data.title,
          description: data.description || null,
          role: data.role,
          created_by: user.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklists"] });
      toast({ title: "Checklist created successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to create checklist", description: error.message, variant: "destructive" });
    },
  });
}

// Update checklist mutation
export function useUpdateChecklist() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { id: string; title?: string; description?: string; is_active?: boolean }) => {
      const { error } = await supabase
        .from("checklists")
        .update({
          ...(data.title !== undefined && { title: data.title }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.is_active !== undefined && { is_active: data.is_active }),
        })
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklists"] });
      toast({ title: "Checklist updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to update checklist", description: error.message, variant: "destructive" });
    },
  });
}

// Delete checklist mutation
export function useDeleteChecklist() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("checklists").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklists"] });
      toast({ title: "Checklist deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to delete checklist", description: error.message, variant: "destructive" });
    },
  });
}

// Add checklist item mutation
export function useAddChecklistItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { checklist_id: string; task_description: string; sort_order: number }) => {
      const { data: result, error } = await supabase
        .from("checklist_items")
        .insert({
          template_id: null,
          task_description: data.task_description,
          sort_order: data.sort_order,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["checklist-items", variables.checklist_id] });
      toast({ title: "Task added successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to add task", description: error.message, variant: "destructive" });
    },
  });
}

// Update checklist item mutation
export function useUpdateChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; checklist_id: string; task_description?: string; sort_order?: number }) => {
      const { error } = await supabase
        .from("checklist_items")
        .update({
          ...(data.task_description !== undefined && { task_description: data.task_description }),
          ...(data.sort_order !== undefined && { sort_order: data.sort_order }),
        })
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["checklist-items", variables.checklist_id] });
    },
  });
}

// Delete checklist item mutation
export function useDeleteChecklistItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { id: string; checklist_id: string }) => {
      const { error } = await supabase.from("checklist_items").delete().eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["checklist-items", variables.checklist_id] });
      toast({ title: "Task removed successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to remove task", description: error.message, variant: "destructive" });
    },
  });
}

// Toggle completion mutation
export function useToggleCompletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { item_id: string; user_id: string; is_completed: boolean }) => {
      const today = new Date().toISOString().split("T")[0];

      if (data.is_completed) {
        // Add completion
        const { error } = await supabase.from("checklist_completions").insert({
          checklist_item_id: data.item_id,
          user_id: data.user_id,
          completion_date: today,
        });
        if (error) throw error;
      } else {
        // Remove completion
        const { error } = await supabase
          .from("checklist_completions")
          .delete()
          .eq("checklist_item_id", data.item_id)
          .eq("user_id", data.user_id)
          .eq("completion_date", today);
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["completions", "today", variables.user_id] });
      queryClient.invalidateQueries({ queryKey: ["completions", "history"] });
    },
  });
}

// Reorder items mutation
export function useReorderItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { checklist_id: string; items: { id: string; sort_order: number }[] }) => {
      // Update each item's sort order
      for (const item of data.items) {
        const { error } = await supabase
          .from("checklist_items")
          .update({ sort_order: item.sort_order })
          .eq("id", item.id);
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["checklist-items", variables.checklist_id] });
    },
  });
}
