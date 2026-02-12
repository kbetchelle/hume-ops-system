import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Returns the count of unread messages for the current user.
 * Subscribes to Supabase Realtime for instant updates.
 */
export function useUnreadMessageCount() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['unread-message-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      // Single DB function call replaces the previous two-query N+1 pattern
      const { data, error } = await supabase.rpc('get_unread_message_count' as any, {
        p_user_id: user.id,
      });

      if (error) throw error;
      return (data as number) ?? 0;
    },
    enabled: !!user?.id,
    // Realtime subscription (below) handles live updates; no polling needed.
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user?.id) return;

    const messagesChannel = supabase
      .channel('unread-messages-count')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'staff_messages',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['unread-message-count'] });
        }
      )
      .subscribe();

    const readsChannel = supabase
      .channel('message-reads-count')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'staff_message_reads',
          filter: `staff_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['unread-message-count'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(readsChannel);
    };
  }, [user?.id, queryClient]);

  return {
    count: query.data ?? 0,
    isLoading: query.isLoading,
  };
}
