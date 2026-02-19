import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { StaffMessage } from '@/types/messaging';

/**
 * Global message search
 */
export function useSearchMessages(query: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['search-messages', user?.id, query],
    queryFn: async () => {
      if (!user?.id || !query.trim()) return [];

      const q = query.trim();
      const pattern = `%${q}%`;
      const { data, error } = await supabase
        .from('staff_messages')
        .select('*')
        .eq('is_sent', true)
        .or(`content.ilike.${pattern},subject.ilike.${pattern},sender_name.ilike.${pattern}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Filter to user's messages
      const filtered = (data || []).filter(
        (msg) =>
          msg.sender_id === user.id || msg.recipient_ids?.includes(user.id)
      );

      return filtered as StaffMessage[];
    },
    enabled: !!user?.id && query.trim().length > 0,
  });
}

/**
 * Search within a specific thread/conversation
 */
export function useSearchInThread(messages: StaffMessage[], query: string) {
  if (!query.trim()) return messages;

  const lowerQuery = query.toLowerCase();
  return messages.filter(
    (msg) =>
      msg.content.toLowerCase().includes(lowerQuery) ||
      msg.subject?.toLowerCase().includes(lowerQuery)
  );
}
