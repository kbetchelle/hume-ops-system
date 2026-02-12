import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useSendNotification, truncateForNotification } from '@/hooks/useNotifications';
import type { StaffMessage } from '@/types/messaging';

/**
 * Mark message as read
 */
export function useMarkMessageRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('staff_message_reads')
        .upsert(
          {
            message_id: messageId,
            staff_id: user.id,
            is_archived: false,
          },
          { onConflict: 'message_id,staff_id' }
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-message-reads'] });
    },
  });
}

/**
 * Send a new message
 */
export function useSendMessage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mutateAsync: sendNotification } = useSendNotification();

  return useMutation({
    mutationFn: async ({
      recipientIds,
      recipientDepartments,
      subject,
      content,
      isUrgent = false,
      groupId,
      groupName,
      threadId,
      replyToId,
      scheduledAt,
    }: {
      recipientIds?: string[];
      recipientDepartments?: string[];
      subject?: string;
      content: string;
      isUrgent?: boolean;
      groupId?: string;
      groupName?: string;
      threadId?: string;
      replyToId?: string;
      scheduledAt?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const senderName =
        user.user_metadata?.full_name || user.email || 'Unknown';

      const { data, error } = await supabase
        .from('staff_messages')
        .insert({
          sender_id: user.id,
          sender_name: senderName,
          recipient_ids: recipientIds || null,
          recipient_departments: recipientDepartments || null,
          subject: subject || null,
          content,
          is_sent: scheduledAt ? false : true,
          is_urgent: isUrgent,
          group_id: groupId || null,
          group_name: groupName || null,
          thread_id: threadId || null,
          reply_to_id: replyToId || null,
          scheduled_at: scheduledAt || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Only send notifications immediately if not scheduled
      if (!scheduledAt && recipientIds && recipientIds.length > 0) {
        await Promise.all(
          recipientIds.map((recipientId) =>
            sendNotification({
              userId: recipientId,
              type: 'message',
              title: `New message from ${senderName}`,
              body: truncateForNotification(content),
              data: { messageId: data.id },
            }).catch((err) => {
              console.error('Failed to send notification:', err);
            })
          )
        );
      }

      return data as StaffMessage;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['staff-messages'] });
      if (variables.scheduledAt) {
        toast({ title: 'Message scheduled' });
      } else {
        toast({ title: 'Message sent' });
      }
    },
    onError: (error) => {
      toast({
        title: 'Failed to send message',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Edit a message (within 12-hour window)
 */
export function useEditMessage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      content,
    }: {
      messageId: string;
      content: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('staff_messages')
        .update({
          content,
          edited_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .eq('sender_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as StaffMessage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-messages'] });
      toast({ title: 'Message updated' });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update message',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Delete a message (within 12-hour window)
 */
export function useDeleteMessage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('staff_messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-messages'] });
      toast({ title: 'Message deleted' });
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete message',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Archive/unarchive a conversation
 */
export function useArchiveConversation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageIds,
      isArchived,
    }: {
      messageIds: string[];
      isArchived: boolean;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const updates = messageIds.map((messageId) => ({
        message_id: messageId,
        staff_id: user.id,
        is_archived: isArchived,
      }));

      const { error } = await supabase
        .from('staff_message_reads')
        .upsert(updates, { onConflict: 'message_id,staff_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-message-reads'] });
    },
  });
}
