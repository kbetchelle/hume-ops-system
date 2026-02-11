import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { StaffMessageReaction, GroupedReaction, ReactionEmoji } from '@/types/messaging';

/**
 * Fetch reactions for a specific message
 */
export function useReactions(messageId: string) {
  return useQuery({
    queryKey: ['message-reactions', messageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_message_reactions')
        .select('*')
        .eq('message_id', messageId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as StaffMessageReaction[];
    },
    enabled: !!messageId,
  });
}

/**
 * Toggle reaction on a message (add if doesn't exist, remove if exists)
 */
export function useToggleReaction() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      emoji,
    }: {
      messageId: string;
      emoji: ReactionEmoji;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const userName =
        user.user_metadata?.full_name || user.email || 'Unknown';

      // Check if reaction already exists
      const { data: existing, error: fetchError } = await supabase
        .from('staff_message_reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('staff_id', user.id)
        .eq('emoji', emoji)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        // Remove reaction
        const { error: deleteError } = await supabase
          .from('staff_message_reactions')
          .delete()
          .eq('id', existing.id);

        if (deleteError) throw deleteError;
        return { action: 'removed' as const, emoji };
      } else {
        // Add reaction
        const { error: insertError } = await supabase
          .from('staff_message_reactions')
          .insert({
            message_id: messageId,
            staff_id: user.id,
            staff_name: userName,
            emoji,
          });

        if (insertError) throw insertError;
        return { action: 'added' as const, emoji };
      }
    },
    onMutate: async ({ messageId, emoji }) => {
      // Optimistic update
      await queryClient.cancelQueries({
        queryKey: ['message-reactions', messageId],
      });

      const previousReactions = queryClient.getQueryData<
        StaffMessageReaction[]
      >(['message-reactions', messageId]);

      if (previousReactions) {
        const existingIndex = previousReactions.findIndex(
          (r) => r.staff_id === user?.id && r.emoji === emoji
        );

        if (existingIndex >= 0) {
          // Remove optimistically
          const newReactions = previousReactions.filter(
            (_, i) => i !== existingIndex
          );
          queryClient.setQueryData(
            ['message-reactions', messageId],
            newReactions
          );
        } else {
          // Add optimistically
          const newReaction: StaffMessageReaction = {
            id: 'temp-' + Date.now(),
            message_id: messageId,
            staff_id: user?.id || '',
            staff_name:
              user?.user_metadata?.full_name || user?.email || 'Unknown',
            emoji,
            created_at: new Date().toISOString(),
          };
          queryClient.setQueryData(['message-reactions', messageId], [
            ...previousReactions,
            newReaction,
          ]);
        }
      }

      return { previousReactions };
    },
    onError: (error, { messageId }, context) => {
      // Rollback on error
      if (context?.previousReactions) {
        queryClient.setQueryData(
          ['message-reactions', messageId],
          context.previousReactions
        );
      }
      toast({
        title: 'Failed to update reaction',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSuccess: (_, { messageId }) => {
      queryClient.invalidateQueries({
        queryKey: ['message-reactions', messageId],
      });
    },
  });
}

/**
 * Subscribe to realtime reaction updates
 */
export function useReactionsRealtime(messageId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!messageId) return;

    const channel = supabase
      .channel(`reactions-${messageId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'staff_message_reactions',
          filter: `message_id=eq.${messageId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ['message-reactions', messageId],
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [messageId, queryClient]);
}

/**
 * Group reactions by emoji and count them
 */
export function groupReactions(
  reactions: StaffMessageReaction[],
  currentUserId: string
): GroupedReaction[] {
  const grouped = new Map<string, GroupedReaction>();

  reactions.forEach((reaction) => {
    const existing = grouped.get(reaction.emoji);

    if (existing) {
      existing.count++;
      existing.userIds.push(reaction.staff_id);
      existing.userNames.push(reaction.staff_name);
      if (reaction.staff_id === currentUserId) {
        existing.hasCurrentUser = true;
      }
    } else {
      grouped.set(reaction.emoji, {
        emoji: reaction.emoji as ReactionEmoji,
        count: 1,
        userIds: [reaction.staff_id],
        userNames: [reaction.staff_name],
        hasCurrentUser: reaction.staff_id === currentUserId,
      });
    }
  });

  // Sort by count descending
  return Array.from(grouped.values()).sort((a, b) => b.count - a.count);
}
