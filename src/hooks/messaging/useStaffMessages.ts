import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { StaffMessage, StaffMessageRead } from '@/types/messaging';

/**
 * Fetch staff messages with filters
 */
export function useStaffMessages(filter?: {
  conversationKey?: string;
  includeArchived?: boolean;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['staff-messages', user?.id, filter],
    queryFn: async () => {
      if (!user?.id) return [];

      const query = supabase
        .from('staff_messages')
        .select('*')
        .eq('is_sent', true)
        .order('created_at', { ascending: false });

      // Filter to messages where user is sender or recipient
      const { data, error } = await query;

      if (error) throw error;

      // Client-side filter for user participation
      const filtered = (data || []).filter(
        (msg) =>
          msg.sender_id === user.id ||
          msg.recipient_ids?.includes(user.id)
      );

      return filtered as StaffMessage[];
    },
    enabled: !!user?.id,
  });
}

/**
 * Fetch scheduled messages (is_sent = false, scheduled_at in the future) for the current user as sender.
 * Filters out past-scheduled messages to avoid confusion from failed or stale sends.
 */
export function useScheduledMessages() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['staff-messages-scheduled', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const nowIso = new Date().toISOString();

      const { data, error } = await supabase
        .from('staff_messages')
        .select('*')
        .eq('sender_id', user.id)
        .eq('is_sent', false)
        .not('scheduled_at', 'is', null)
        .gt('scheduled_at', nowIso)
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      return (data || []) as StaffMessage[];
    },
    enabled: !!user?.id,
  });
}

/**
 * Fetch message read status
 */
export function useMessageReads() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['staff-message-reads', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('staff_message_reads')
        .select('*')
        .eq('staff_id', user.id);

      if (error) throw error;
      return (data || []) as StaffMessageRead[];
    },
    enabled: !!user?.id,
  });
}

/**
 * Fetch active staff list for recipient selection
 */
export function useStaffList() {
  return useQuery({
    queryKey: ['profiles-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .eq('deactivated', false)
        .order('full_name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
}
