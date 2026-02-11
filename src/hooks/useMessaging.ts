import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useSendNotification, truncateForNotification } from '@/hooks/useNotifications';
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

      let query = supabase
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
          is_sent: true,
          is_urgent: isUrgent,
          group_id: groupId || null,
          group_name: groupName || null,
          thread_id: threadId || null,
          reply_to_id: replyToId || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Send notifications to recipients
      if (recipientIds && recipientIds.length > 0) {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-messages'] });
      toast({ title: 'Message sent' });
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
        .eq('sender_id', user.id) // Only sender can edit
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
        .eq('sender_id', user.id); // Only sender can delete

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

      // Update all message reads for the conversation
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

/**
 * Subscribe to realtime message updates
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
