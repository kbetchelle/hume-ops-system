import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface UserPreferences {
  id: string;
  user_id: string;
  bug_report_badge_enabled: boolean;
  created_at: string;
  updated_at: string;
}

const DEFAULT_PREFERENCES: Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  bug_report_badge_enabled: true,
};

/**
 * Fetches the current user's preferences. Returns defaults if no row exists.
 */
export function useUserPreferences() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_preferences' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      // Return data or defaults
      if (data) return data as unknown as UserPreferences;

      // Return virtual defaults (no row yet)
      return {
        id: '',
        user_id: user.id,
        ...DEFAULT_PREFERENCES,
        created_at: '',
        updated_at: '',
      } as UserPreferences;
    },
    enabled: !!user?.id,
  });
}

/**
 * Upserts user preferences. Creates the row if it doesn't exist.
 */
export function useUpdateUserPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (updates: Partial<Pick<UserPreferences, 'bug_report_badge_enabled'>>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_preferences' as any)
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
      return data as unknown as UserPreferences;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
      queryClient.invalidateQueries({ queryKey: ['unread-bug-report-count'] });
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
