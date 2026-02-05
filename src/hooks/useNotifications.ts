import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { insertInto } from '@/lib/dataApi';

export type NotificationType = 'qa_answered' | 'qa_new_question' | 'announcement' | 'message';

interface SendNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
}

interface NotifyManagersParams {
  type: NotificationType;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
}

/**
 * Send a notification to a specific user
 */
export function useSendNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, type, title, body, data }: SendNotificationParams) => {
      const { error } = await insertInto('staff_notifications', {
        user_id: userId,
        type,
        title,
        body: body || null,
        data: data || null,
        is_read: false,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-notifications'] });
    },
  });
}

/**
 * Send notifications to all managers and admins
 */
export function useNotifyManagers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ type, title, body, data }: NotifyManagersParams) => {
      // Get all users with manager or admin roles
      const { data: managerRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['admin', 'manager']);

      if (rolesError) throw rolesError;

      if (!managerRoles || managerRoles.length === 0) {
        console.warn('No managers found to notify');
        return;
      }

      // Get unique user IDs
      const uniqueUserIds = [...new Set(managerRoles.map(r => r.user_id))];

      // Create notification for each manager
      const notifications = uniqueUserIds.map(userId => ({
        user_id: userId,
        type,
        title,
        body: body || null,
        data: data || null,
        is_read: false,
      }));

      const { error } = await insertInto('staff_notifications', notifications);

      if (error) throw error;

      return { notified: uniqueUserIds.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-notifications'] });
    },
  });
}

/**
 * Helper to truncate text for notification body
 */
export function truncateForNotification(text: string, maxLength = 100): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
