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

      // Get all messages where user is recipient
      const { data: messages, error: msgError } = await supabase
        .from('staff_messages')
        .select('id')
        .eq('is_sent', true)
        .contains('recipient_ids', [user.id]);

      if (msgError) throw msgError;

      const messageIds = (messages || []).map((m) => m.id);
      if (messageIds.length === 0) return 0;

      // Get reads
      const { data: reads, error: readError } = await supabase
        .from('staff_message_reads')
        .select('message_id')
        .eq('staff_id', user.id)
        .in('message_id', messageIds);

      if (readError) throw readError;

      const readIds = new Set((reads || []).map((r) => r.message_id));
      const unreadCount = messageIds.filter((id) => !readIds.has(id)).length;

      return unreadCount;
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
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
