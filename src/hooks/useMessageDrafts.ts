import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { StaffMessageDraft } from '@/types/messaging';

/**
 * Fetch drafts for the current user
 */
export function useDrafts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['message-drafts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error} = await supabase
        .from('staff_message_drafts')
        .select('*')
        .eq('staff_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (data || []) as StaffMessageDraft[];
    },
    enabled: !!user?.id,
  });
}

/**
 * Get draft count for badge
 */
export function useDraftCount() {
  const { data: drafts = [] } = useDrafts();
  return drafts.length;
}

/**
 * Save or update a draft
 */
export function useSaveDraft() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      draftId,
      subject,
      content,
      recipientStaffIds,
      recipientDepartments,
      groupId,
      isUrgent = false,
    }: {
      draftId?: string;
      subject?: string;
      content?: string;
      recipientStaffIds?: string[];
      recipientDepartments?: string[];
      groupId?: string;
      isUrgent?: boolean;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      if (draftId) {
        // Update existing draft
        const { data, error } = await supabase
          .from('staff_message_drafts')
          .update({
            subject: subject || null,
            content: content || null,
            recipient_staff_ids: recipientStaffIds || null,
            recipient_departments: recipientDepartments || null,
            group_id: groupId || null,
            is_urgent: isUrgent,
          })
          .eq('id', draftId)
          .eq('staff_id', user.id)
          .select()
          .single();

        if (error) throw error;
        return data as StaffMessageDraft;
      } else {
        // Create new draft
        const { data, error } = await supabase
          .from('staff_message_drafts')
          .insert({
            staff_id: user.id,
            subject: subject || null,
            content: content || null,
            recipient_staff_ids: recipientStaffIds || null,
            recipient_departments: recipientDepartments || null,
            group_id: groupId || null,
            is_urgent: isUrgent,
          })
          .select()
          .single();

        if (error) throw error;
        return data as StaffMessageDraft;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-drafts'] });
    },
  });
}

/**
 * Delete a draft
 */
export function useDeleteDraft() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (draftId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('staff_message_drafts')
        .delete()
        .eq('id', draftId)
        .eq('staff_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-drafts'] });
      toast({ title: 'Draft deleted' });
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete draft',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
