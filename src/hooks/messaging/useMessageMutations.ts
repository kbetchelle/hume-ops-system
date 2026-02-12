import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useMarkMessageRead() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('staff_message_reads')
        .upsert(
          { message_id: messageId, staff_id: user!.id, read_at: new Date().toISOString() },
          { onConflict: 'message_id,staff_id' }
        );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff-message-reads'] }),
  });
}

export function useSendMessage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      recipientIds: string[];
      content: string;
      subject?: string;
      groupId?: string;
      groupName?: string;
      threadId?: string;
      replyToId?: string;
      isUrgent?: boolean;
      scheduledAt?: string;
    }) => {
      // Look up sender name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user!.id)
        .single();

      const { error } = await supabase.from('staff_messages').insert({
        sender_id: user!.id,
        sender_name: profile?.full_name ?? user!.email ?? 'Unknown',
        recipient_ids: input.recipientIds,
        content: input.content,
        subject: input.subject ?? null,
        group_id: input.groupId ?? null,
        group_name: input.groupName ?? null,
        thread_id: input.threadId ?? null,
        reply_to_id: input.replyToId ?? null,
        is_urgent: input.isUrgent ?? false,
        scheduled_at: input.scheduledAt ?? null,
        is_sent: !input.scheduledAt,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff-messages'] }),
  });
}

export function useEditMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ messageId, content }: { messageId: string; content: string }) => {
      const { error } = await supabase
        .from('staff_messages')
        .update({ content, edited_at: new Date().toISOString() })
        .eq('id', messageId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff-messages'] }),
  });
}

export function useDeleteMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('staff_messages')
        .delete()
        .eq('id', messageId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff-messages'] }),
  });
}

export function useArchiveConversation() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (messageIds: string[]) => {
      for (const messageId of messageIds) {
        const { error } = await supabase
          .from('staff_message_reads')
          .upsert(
            { message_id: messageId, staff_id: user!.id, is_archived: true, read_at: new Date().toISOString() },
            { onConflict: 'message_id,staff_id' }
          );
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff-message-reads'] }),
  });
}
