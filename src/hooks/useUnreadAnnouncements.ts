import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';

/**
 * Returns the count of unread announcements for the current user.
 */
export function useUnreadAnnouncements() {
  const { user } = useAuth();
  const { data: userRoles } = useUserRoles(user?.id);
  const roles = userRoles?.map((r) => r.role) || [];

  return useQuery({
    queryKey: ['unread-announcements-check', user?.id, roles],
    queryFn: async () => {
      if (!user?.id) return 0;

      const now = new Date().toISOString();

      // Fetch user profile created_at to suppress pre-signup announcements
      const { data: profile } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('user_id', user.id)
        .single();

      const userCreatedAt = profile?.created_at ? new Date(profile.created_at) : null;

      const { data: announcements, error: aErr } = await supabase
        .from('staff_announcements')
        .select('id, target_departments, scheduled_at, expires_at, created_at')
        .eq('is_active', true);

      if (aErr) throw aErr;

      const { data: reads, error: rErr } = await supabase
        .from('staff_announcement_reads')
        .select('announcement_id')
        .eq('staff_id', user.id);

      if (rErr) throw rErr;

      const readSet = new Set(reads?.map((r) => r.announcement_id) || []);

      const unreadCount = (announcements || []).filter((a) => {
        if (a.scheduled_at && new Date(a.scheduled_at) > new Date(now)) return false;
        if (a.expires_at && new Date(a.expires_at) < new Date(now)) return false;
        // Announcements created before user's first login are not unread
        if (userCreatedAt && new Date(a.created_at) < userCreatedAt) return false;
        if (a.target_departments && a.target_departments.length > 0) {
          if (!roles.some((role) => a.target_departments?.includes(role))) return false;
        }
        return !readSet.has(a.id);
      }).length;

      return unreadCount;
    },
    enabled: !!user?.id,
    refetchInterval: 60000,
  });
}
