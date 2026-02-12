import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Subscribe to realtime message and read-status updates.
 * Call this once in a top-level messaging component.
 */
export function useMessagingRealtime() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel('staff-messages-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'staff_messages',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['staff-messages'] });
        }
      )
      .subscribe();

    // Subscribe to read status changes
    const readsChannel = supabase
      .channel('staff-message-reads-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'staff_message_reads',
          filter: `staff_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['staff-message-reads'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(readsChannel);
    };
  }, [user?.id, queryClient]);
}
