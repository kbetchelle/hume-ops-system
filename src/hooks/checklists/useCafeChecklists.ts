import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CafeChecklist {
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

export interface CafeChecklistItem {
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

export interface CafeCompletion {
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

export function useCafeChecklists() {
  return useQuery({
    queryKey: ['cafe-checklists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cafe_checklists')
        .select('*')
        .order('title');
      if (error) throw error;
      return data as CafeChecklist[];
    },
  });
}

export function useCafeActiveChecklists() {
  return useQuery({
    queryKey: ['cafe-checklists', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cafe_checklists')
        .select('*')
        .eq('is_active', true)
        .order('title');
      if (error) throw error;
      return data as CafeChecklist[];
    },
  });
}

export function useCafeChecklistItems(checklistId: string | undefined) {
  return useQuery({
    queryKey: ['cafe-checklist-items', checklistId],
    queryFn: async () => {
      if (!checklistId) return [];
      const { data, error } = await supabase
        .from('cafe_checklist_items')
        .select('*')
        .eq('checklist_id', checklistId)
        .order('sort_order');
      if (error) throw error;
      return data as CafeChecklistItem[];
    },
    enabled: !!checklistId,
  });
}

export function useCafeCompletions(date: string, shiftTime: string, userId?: string) {
  return useQuery({
    queryKey: ['cafe-completions', date, shiftTime, userId],
    queryFn: async () => {
      let query = supabase
        .from('cafe_completions')
        .select('*')
        .eq('completion_date', date)
        .eq('shift_time', shiftTime);
      
      if (userId) {
        query = query.eq('completed_by_id', userId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as CafeCompletion[];
    },
  });
}

export function useToggleCafeCompletion() {
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
          .from('cafe_completions')
          .delete()
          .eq('item_id', itemId)
          .eq('completion_date', completionDate)
          .eq('shift_time', shiftTime);
        if (error) throw error;
      } else {
        // Create/update completion
        const { error } = await supabase
          .from('cafe_completions')
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
      queryClient.invalidateQueries({ queryKey: ['cafe-completions'] });
    },
  });
}

export function useCreateCafeChecklist() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (checklist: Partial<CafeChecklist>) => {
      const { data, error } = await supabase
        .from('cafe_checklists')
        .insert([checklist] as any)
        .select()
        .single();
      if (error) throw error;
      return data as CafeChecklist;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cafe-checklists'] });
    },
  });
}

export function useUpdateCafeChecklist() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CafeChecklist> }) => {
      const { data, error } = await supabase
        .from('cafe_checklists')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as CafeChecklist;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cafe-checklists'] });
    },
  });
}

export function useDeleteCafeChecklist() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cafe_checklists')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cafe-checklists'] });
    },
  });
}

export function useCreateCafeItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (item: Partial<CafeChecklistItem> & { checklist_id: string }) => {
      const { data, error } = await supabase
        .from('cafe_checklist_items')
        .insert([item] as any)
        .select()
        .single();
      if (error) throw error;
      return data as CafeChecklistItem;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cafe-checklist-items', variables.checklist_id] });
    },
  });
}

export function useUpdateCafeItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, checklistId, updates }: { id: string; checklistId: string; updates: Partial<CafeChecklistItem> }) => {
      const { data, error } = await supabase
        .from('cafe_checklist_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as CafeChecklistItem;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cafe-checklist-items', variables.checklistId] });
    },
  });
}

export function useDeleteCafeItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, checklistId }: { id: string; checklistId: string }) => {
      const { error } = await supabase
        .from('cafe_checklist_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cafe-checklist-items', variables.checklistId] });
    },
  });
}
