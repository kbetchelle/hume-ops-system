import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BoHChecklist {
  id: string;
  title: string;
  description: string | null;
  role_type: 'floater' | 'male_spa_attendant' | 'female_spa_attendant';
  shift_time: 'AM' | 'PM';
  is_weekend: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BoHChecklistItem {
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

export interface BoHCompletion {
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

export function useBoHChecklists() {
  return useQuery({
    queryKey: ['boh-checklists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('boh_checklists')
        .select('*')
        .order('role_type')
        .order('title');
      if (error) throw error;
      return data as BoHChecklist[];
    },
  });
}

export function useBoHActiveChecklists() {
  return useQuery({
    queryKey: ['boh-checklists', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('boh_checklists')
        .select('*')
        .eq('is_active', true)
        .order('role_type')
        .order('title');
      if (error) throw error;
      return data as BoHChecklist[];
    },
  });
}

export function useBoHChecklistItems(checklistId: string | undefined) {
  return useQuery({
    queryKey: ['boh-checklist-items', checklistId],
    queryFn: async () => {
      if (!checklistId) return [];
      const { data, error } = await supabase
        .from('boh_checklist_items')
        .select('*')
        .eq('checklist_id', checklistId)
        .order('sort_order');
      if (error) throw error;
      return data as BoHChecklistItem[];
    },
    enabled: !!checklistId,
  });
}

export function useBoHCompletions(date: string, shiftTime: string, userId?: string) {
  return useQuery({
    queryKey: ['boh-completions', date, shiftTime, userId],
    queryFn: async () => {
      let query = supabase
        .from('boh_completions')
        .select('*')
        .eq('completion_date', date)
        .eq('shift_time', shiftTime);
      
      if (userId) {
        query = query.eq('completed_by_id', userId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as BoHCompletion[];
    },
  });
}

export function useToggleBoHCompletion() {
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
          .from('boh_completions')
          .delete()
          .eq('item_id', itemId)
          .eq('completion_date', completionDate)
          .eq('shift_time', shiftTime);
        if (error) throw error;
      } else {
        // Create/update completion
        const { error } = await supabase
          .from('boh_completions')
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
      queryClient.invalidateQueries({ queryKey: ['boh-completions'] });
    },
  });
}

export function useCreateBoHChecklist() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (checklist: Partial<BoHChecklist>) => {
      const { data, error } = await supabase
        .from('boh_checklists')
        .insert(checklist)
        .select()
        .single();
      if (error) throw error;
      return data as BoHChecklist;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boh-checklists'] });
    },
  });
}

export function useUpdateBoHChecklist() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BoHChecklist> }) => {
      const { data, error } = await supabase
        .from('boh_checklists')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as BoHChecklist;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boh-checklists'] });
    },
  });
}

export function useDeleteBoHChecklist() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('boh_checklists')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boh-checklists'] });
    },
  });
}

export function useCreateBoHItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (item: Partial<BoHChecklistItem>) => {
      const { data, error } = await supabase
        .from('boh_checklist_items')
        .insert(item)
        .select()
        .single();
      if (error) throw error;
      return data as BoHChecklistItem;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['boh-checklist-items', variables.checklist_id] });
    },
  });
}

export function useUpdateBoHItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, checklistId, updates }: { id: string; checklistId: string; updates: Partial<BoHChecklistItem> }) => {
      const { data, error } = await supabase
        .from('boh_checklist_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as BoHChecklistItem;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['boh-checklist-items', variables.checklistId] });
    },
  });
}

export function useDeleteBoHItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, checklistId }: { id: string; checklistId: string }) => {
      const { error } = await supabase
        .from('boh_checklist_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['boh-checklist-items', variables.checklistId] });
    },
  });
}
