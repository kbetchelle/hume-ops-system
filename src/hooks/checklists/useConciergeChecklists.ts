import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export interface ConciergeChecklist {
  id: string;
  title: string;
  description: string | null;
  shift_time: 'AM' | 'PM';
  is_weekend: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConciergeChecklistItem {
  id: string;
  checklist_id: string;
  task_description: string;
  task_type: string;
  sort_order: number;
  time_hint: string | null;
  category: string | null;
  color: string | null;
  is_high_priority: boolean;
  required: boolean;
  label_spanish: string | null;
  is_class_triggered: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConciergeCompletion {
  id: string;
  item_id: string;
  checklist_id: string;
  completion_date: string;
  shift_time: string;
  completed_by_id: string | null;
  completed_by: string | null;
  completed_at: string | null;
  photo_url: string | null;
  note_text: string | null;
  signature_data: string | null;
  submitted_at: string | null;
  deleted_at: string | null;
  created_at: string;
}

export function useConciergeChecklists() {
  return useQuery({
    queryKey: ['concierge-checklists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('concierge_checklists')
        .select('*')
        .order('title');
      if (error) throw error;
      return data as ConciergeChecklist[];
    },
  });
}

export function useConciergeActiveChecklists() {
  return useQuery({
    queryKey: ['concierge-checklists', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('concierge_checklists')
        .select('*')
        .eq('is_active', true)
        .order('title');
      if (error) throw error;
      return data as ConciergeChecklist[];
    },
  });
}

export function useConciergeChecklistItems(checklistId: string | undefined) {
  return useQuery({
    queryKey: ['concierge-checklist-items', checklistId],
    queryFn: async () => {
      if (!checklistId) return [];
      const { data, error } = await supabase
        .from('concierge_checklist_items')
        .select('*')
        .eq('checklist_id', checklistId)
        .order('sort_order');
      if (error) throw error;
      return data as ConciergeChecklistItem[];
    },
    enabled: !!checklistId,
  });
}

export function useConciergeCompletions(date: string, shiftTime: string, userId?: string) {
  return useQuery({
    queryKey: ['concierge-completions', date, shiftTime, userId],
    queryFn: async () => {
      let query = supabase
        .from('concierge_completions')
        .select('*')
        .eq('completion_date', date)
        .eq('shift_time', shiftTime);
      
      if (userId) {
        query = query.eq('completed_by_id', userId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as ConciergeCompletion[];
    },
  });
}

export function useToggleConciergeCompletion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      itemId,
      checklistId,
      completionDate,
      shiftTime,
      completedById,
      completedBy,
      isCompleted,
      value,
      photoUrl,
      signatureData,
    }: {
      itemId: string;
      checklistId: string;
      completionDate: string;
      shiftTime: string;
      completedById: string;
      completedBy: string;
      isCompleted: boolean;
      value?: string;
      photoUrl?: string;
      signatureData?: string;
    }) => {
      if (isCompleted) {
        // Delete completion (toggle off)
        const { error } = await supabase
          .from('concierge_completions')
          .delete()
          .eq('item_id', itemId)
          .eq('completion_date', completionDate)
          .eq('shift_time', shiftTime);
        if (error) throw error;
      } else {
        // Create/update completion
        const { error } = await supabase
          .from('concierge_completions')
          .upsert({
            item_id: itemId,
            checklist_id: checklistId,
            completion_date: completionDate,
            shift_time: shiftTime,
            completed_by_id: completedById,
            completed_by: completedBy,
            completed_at: new Date().toISOString(),
            note_text: value || null,
            photo_url: photoUrl || null,
            signature_data: signatureData || null,
          }, {
            onConflict: 'item_id,completion_date,shift_time'
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['concierge-completions'] });
    },
  });
}

export function useCreateConciergeChecklist() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (checklist: Partial<ConciergeChecklist>) => {
      const { data, error } = await supabase
        .from('concierge_checklists')
        .insert([checklist as Database["public"]["Tables"]["concierge_checklists"]["Insert"]])
        .select()
        .single();
      if (error) throw error;
      return data as ConciergeChecklist;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['concierge-checklists'] });
    },
  });
}

export function useUpdateConciergeChecklist() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ConciergeChecklist> }) => {
      const { data, error } = await supabase
        .from('concierge_checklists')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as ConciergeChecklist;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['concierge-checklists'] });
    },
  });
}

export function useDeleteConciergeChecklist() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('concierge_checklists')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['concierge-checklists'] });
    },
  });
}

export function useCreateConciergeItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (item: Partial<ConciergeChecklistItem> & { checklist_id: string }) => {
      const { data, error } = await supabase
        .from('concierge_checklist_items')
        .insert([item as Database["public"]["Tables"]["concierge_checklist_items"]["Insert"]])
        .select()
        .single();
      if (error) throw error;
      return data as ConciergeChecklistItem;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['concierge-checklist-items', variables.checklist_id] });
    },
  });
}

export function useUpdateConciergeItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, checklistId, updates }: { id: string; checklistId: string; updates: Partial<ConciergeChecklistItem> }) => {
      const { data, error } = await supabase
        .from('concierge_checklist_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as ConciergeChecklistItem;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['concierge-checklist-items', variables.checklistId] });
    },
  });
}

export function useDeleteConciergeItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, checklistId }: { id: string; checklistId: string }) => {
      const { error } = await supabase
        .from('concierge_checklist_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['concierge-checklist-items', variables.checklistId] });
    },
  });
}
