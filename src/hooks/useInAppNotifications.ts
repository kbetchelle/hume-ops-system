import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const IN_APP_CHANNEL = 'in-app-notifications';
const TOAST_DURATION_MS = 8000;

interface InAppNotificationPayload {
  title?: string;
  body?: string;
  data?: { isUrgent?: boolean; [key: string]: unknown };
  type?: string;
  targetStaffIds?: string[] | null;
}

/**
 * Subscribes to Supabase Realtime broadcast channel "in-app-notifications"
 * and shows toast notifications when messages arrive for the current user.
 * Mount in a high-level layout (e.g. DashboardLayout) so it's active on all authenticated pages.
 * Uses sonner for toasts so duration is respected and notifications auto-dismiss.
 */
export function useInAppNotifications() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleNotification = useCallback(
    (payload: InAppNotificationPayload) => {
      if (!user?.id) return;

      const targetStaffIds = payload.targetStaffIds;
      const isTarget =
        !targetStaffIds ||
        targetStaffIds.length === 0 ||
        targetStaffIds.includes(user.id);
      if (!isTarget) return;

      const isUrgent =
        payload.type === 'message' && payload.data?.isUrgent === true;
      const title = isUrgent ? 'Urgent Message' : (payload.title ?? 'Notification');
      const description = payload.body ?? undefined;
      const options = { description, duration: TOAST_DURATION_MS };

      if (isUrgent) {
        toast.warning(title, options);
      } else {
        toast(title, options);
      }
    },
    [user?.id]
  );

  useEffect(() => {
    if (!user?.id) {
      setIsSubscribed(false);
      return;
    }

    const channel = supabase
      .channel(IN_APP_CHANNEL)
      .on(
        'broadcast',
        { event: 'notification' },
        ({ payload }: { payload: InAppNotificationPayload }) => {
          handleNotification(payload);
        }
      )
      .subscribe((status) => {
        setIsSubscribed(status === 'SUBSCRIBED');
      });

    return () => {
      setIsSubscribed(false);
      supabase.removeChannel(channel);
    };
  }, [user?.id, handleNotification]);

  return {
    isSubscribed,
  };
}
