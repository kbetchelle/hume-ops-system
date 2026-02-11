import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Returns the count of unread, non-dismissed notifications for the current user.
 * Subscribes to Supabase Realtime for INSERT events so the badge updates instantly.
 */
export function useUnreadNotificationCount() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['unread-notification-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const { count, error } = await supabase
        .from('staff_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
        .is('dismissed_at', null);

      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  // Subscribe to realtime INSERT events for instant badge updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('notifications-unread-count')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'staff_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['unread-notification-count'] });
          queryClient.invalidateQueries({ queryKey: ['staff-notifications'] });
          queryClient.invalidateQueries({ queryKey: ['notification-center'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return {
    count: query.data ?? 0,
    isLoading: query.isLoading,
  };
}
