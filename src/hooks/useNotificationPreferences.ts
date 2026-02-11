import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface NotificationPreferences {
  id: string;
  user_id: string;
  type_enabled: Record<string, boolean>;
  delivery_method: Record<string, string>;
  dnd_enabled: boolean;
  dnd_sling_linked: boolean;
  dnd_manual_start: string | null;
  dnd_manual_end: string | null;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_TYPE_ENABLED: Record<string, boolean> = {
  qa_answered: true,
  qa_new_question: true,
  announcement: true,
  message: true,
  bug_report_update: true,
  member_alert: true,
  class_turnover: true,
  mat_cleaning: true,
};

export const DEFAULT_DELIVERY_METHOD: Record<string, string> = {
  qa_answered: 'push',
  qa_new_question: 'push',
  announcement: 'push',
  message: 'push',
  bug_report_update: 'banner',
  member_alert: 'push',
  class_turnover: 'banner',
  mat_cleaning: 'banner',
};

/**
 * Fetches the current user's notification preferences.
 * Returns virtual defaults if no row exists (same pattern as useUserPreferences).
 */
export function useNotificationPreferences() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('notification_preferences' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      // Return data if a row exists
      if (data) return data as unknown as NotificationPreferences;

      // Return virtual defaults (no row yet)
      return {
        id: '',
        user_id: user.id,
        type_enabled: { ...DEFAULT_TYPE_ENABLED },
        delivery_method: { ...DEFAULT_DELIVERY_METHOD },
        dnd_enabled: false,
        dnd_sling_linked: false,
        dnd_manual_start: null,
        dnd_manual_end: null,
        created_at: '',
        updated_at: '',
      } as NotificationPreferences;
    },
    enabled: !!user?.id,
  });
}

/**
 * Upserts notification preferences. Creates the row if it doesn't exist.
 */
export function useUpdateNotificationPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (
      updates: Partial<
        Pick<
          NotificationPreferences,
          'type_enabled' | 'delivery_method' | 'dnd_enabled' | 'dnd_sling_linked' | 'dnd_manual_start' | 'dnd_manual_end'
        >
      >
    ) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('notification_preferences' as any)
        .upsert(
          {
            user_id: user.id,
            ...updates,
          },
          { onConflict: 'user_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data as unknown as NotificationPreferences;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast({
        title: 'Preferences Updated',
        description: 'Your notification preferences have been saved.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to save preferences',
        variant: 'destructive',
      });
    },
  });
}
