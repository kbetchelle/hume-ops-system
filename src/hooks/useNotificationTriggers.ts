import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insertInto, updateTable, deleteFrom, eq } from '@/lib/dataApi';
import { supabase } from '@/integrations/supabase/client';

export type NotificationTriggerEventType =
  | 'class_end_heated_room'
  | 'class_end_high_roof'
  | 'room_turnover'
  | 'tour_alert';

export type NotificationTriggerTargetDepartment =
  | 'concierge'
  | 'floater'
  | 'cafe'
  | 'all_foh'
  | 'all_boh';

export interface NotificationTrigger {
  id: string;
  event_type: NotificationTriggerEventType;
  target_department: NotificationTriggerTargetDepartment;
  message: string;
  timing_description: string | null;
  timing_window_minutes: number;
  filter_by_working: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const EVENT_TYPE_LABELS: Record<NotificationTriggerEventType, string> = {
  class_end_heated_room: 'Heated Room Class End',
  class_end_high_roof: 'High Roof Class End',
  room_turnover: 'Room Turnover',
  tour_alert: 'Tour Alert',
};

export const TARGET_DEPARTMENT_LABELS: Record<NotificationTriggerTargetDepartment, string> = {
  concierge: 'Concierge',
  floater: 'Floater',
  cafe: 'Cafe',
  all_foh: 'All FOH',
  all_boh: 'All BOH',
};

export function useNotificationTriggers() {
  return useQuery({
    queryKey: ['notification-triggers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_triggers')
        .select('*')
        .order('event_type', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateTrigger() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      event_type: NotificationTriggerEventType;
      target_department: NotificationTriggerTargetDepartment;
      message: string;
      timing_description?: string | null;
      timing_window_minutes?: number;
      filter_by_working?: boolean;
    }) => {
      const { data, error } = await insertInto<NotificationTrigger>(
        'notification_triggers',
        {
          event_type: input.event_type,
          target_department: input.target_department,
          message: input.message,
          timing_description: input.timing_description ?? null,
          timing_window_minutes: input.timing_window_minutes ?? 5,
          filter_by_working: input.filter_by_working ?? true,
          is_active: true,
        }
      );
      if (error) throw error;
      return data?.[0] ?? null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-triggers'] });
    },
  });
}

export function useUpdateTrigger() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      event_type?: NotificationTriggerEventType;
      target_department?: NotificationTriggerTargetDepartment;
      message?: string;
      timing_description?: string | null;
      timing_window_minutes?: number;
      filter_by_working?: boolean;
      is_active?: boolean;
    }) => {
      const { id, ...updates } = input;
      const payload: Record<string, unknown> = {};
      if (updates.event_type !== undefined) payload.event_type = updates.event_type;
      if (updates.target_department !== undefined) payload.target_department = updates.target_department;
      if (updates.message !== undefined) payload.message = updates.message;
      if (updates.timing_description !== undefined) payload.timing_description = updates.timing_description;
      if (updates.timing_window_minutes !== undefined) payload.timing_window_minutes = updates.timing_window_minutes;
      if (updates.filter_by_working !== undefined) payload.filter_by_working = updates.filter_by_working;
      if (updates.is_active !== undefined) payload.is_active = updates.is_active;

      const { data, error } = await updateTable<NotificationTrigger>(
        'notification_triggers',
        payload,
        [eq('id', id)]
      );
      if (error) throw error;
      return data?.[0] ?? null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-triggers'] });
    },
  });
}

export function useDeleteTrigger() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await deleteFrom('notification_triggers', [eq('id', id)]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-triggers'] });
    },
  });
}
