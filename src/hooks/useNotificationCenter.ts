import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { NotificationType } from '@/hooks/useNotifications';

export type { NotificationType };

export interface StaffNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  is_read: boolean;
  dismissed_at: string | null;
  created_at: string;
}

export type ReadFilter = 'all' | 'unread';

const PAGE_SIZE = 20;

const INVALIDATION_KEYS = [
  ['notification-center'],
  ['staff-notifications'],
  ['unread-notification-count'],
];

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  for (const key of INVALIDATION_KEYS) {
    queryClient.invalidateQueries({ queryKey: key });
  }
}

/**
 * Paginated notification list with infinite scrolling support.
 * Fetches non-dismissed notifications for the current user.
 */
export function useNotificationCenter(filter: ReadFilter) {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ['notification-center', user?.id, filter],
    queryFn: async ({ pageParam = 0 }) => {
      if (!user?.id) return [];

      let query = supabase
        .from('staff_notifications')
        .select('*')
        .eq('user_id', user.id)
        .is('dismissed_at', null)
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + PAGE_SIZE - 1);

      if (filter === 'unread') {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as StaffNotification[];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      if (lastPage.length === PAGE_SIZE) {
        return lastPageParam + PAGE_SIZE;
      }
      return undefined;
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });
}

/**
 * Mark a single notification as read.
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('staff_notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => invalidateAll(queryClient),
  });
}

/**
 * Mark all unread notifications as read for the current user.
 */
export function useMarkAllNotificationsRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) return;

      const { error } = await supabase
        .from('staff_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => invalidateAll(queryClient),
  });
}

/**
 * Dismiss a single notification (soft-delete via dismissed_at).
 */
export function useDismissNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('staff_notifications')
        .update({ dismissed_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => invalidateAll(queryClient),
  });
}

/**
 * Clear all non-dismissed notifications for the current user
 * (marks them as read and dismissed).
 */
export function useClearAllNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) return;

      const { error } = await supabase
        .from('staff_notifications')
        .update({
          is_read: true,
          dismissed_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .is('dismissed_at', null);

      if (error) throw error;
    },
    onSuccess: () => invalidateAll(queryClient),
  });
}
