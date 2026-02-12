import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { StaffMessage, StaffMessageRead } from '@/types/messaging';

export function useStaffMessages() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['staff-messages', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_messages')
        .select('*')
        .eq('is_sent', true)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as StaffMessage[];
    },
  });
}

export function useMessageReads() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['staff-message-reads', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_message_reads')
        .select('*')
        .eq('staff_id', user!.id);
      if (error) throw error;
      return (data ?? []) as unknown as StaffMessageRead[];
    },
  });
}

export function useStaffList() {
  return useQuery({
    queryKey: ['staff-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, email');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}
