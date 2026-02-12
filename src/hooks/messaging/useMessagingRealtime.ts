import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useMessagingRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('staff-messages-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'staff_messages' },
        () => {
          qc.invalidateQueries({ queryKey: ['staff-messages'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'staff_message_reads' },
        () => {
          qc.invalidateQueries({ queryKey: ['staff-message-reads'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}
