import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';

/**
 * Returns whether the current user has any unread announcements.
 */
export function useUnreadAnnouncements() {
  const { user } = useAuth();
  const { data: userRoles } = useUserRoles(user?.id);
  const roles = userRoles?.map((r) => r.role) || [];

  return useQuery({
    queryKey: ['unread-announcements-check', user?.id, roles],
    queryFn: async () => {
      if (!user?.id) return false;

      const now = new Date().toISOString();

      // Get all active announcements
      const { data: announcements, error: aErr } = await supabase
        .from('staff_announcements')
        .select('id, target_departments, scheduled_at, expires_at')
        .eq('is_active', true);

      if (aErr) throw aErr;

      // Get read IDs
      const { data: reads, error: rErr } = await supabase
        .from('staff_announcement_reads')
        .select('announcement_id')
        .eq('staff_id', user.id);

      if (rErr) throw rErr;

      const readSet = new Set(reads?.map((r) => r.announcement_id) || []);

      // Filter and check
      const hasUnread = (announcements || []).some((a) => {
        if (a.scheduled_at && new Date(a.scheduled_at) > new Date(now)) return false;
        if (a.expires_at && new Date(a.expires_at) < new Date(now)) return false;
        if (a.target_departments && a.target_departments.length > 0) {
          if (!roles.some((role) => a.target_departments?.includes(role))) return false;
        }
        return !readSet.has(a.id);
      });

      return hasUnread;
    },
    enabled: !!user?.id,
    refetchInterval: 60000,
  });
}
