import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserPreferences } from '@/hooks/useUserPreferences';

/**
 * Returns the count of unread bug reports for the current user.
 * A bug report is "unread" if no matching row exists in bug_report_reads.
 * Returns 0 if the user has disabled the bug report badge preference.
 */
export function useUnreadBugReportCount() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: preferences, isLoading: prefsLoading } = useUserPreferences();

  // Derive the badge-enabled flag so it can be part of the query key.
  // Default to true while preferences are still loading.
  const badgeEnabled = prefsLoading ? true : (preferences?.bug_report_badge_enabled ?? true);

  const query = useQuery({
    queryKey: ['unread-bug-report-count', user?.id, badgeEnabled],
    queryFn: async () => {
      if (!user?.id) return 0;

      // If the user has explicitly disabled the badge, return 0
      if (!badgeEnabled) {
        return 0;
      }

      // Count total bug reports
      const { count: totalCount, error: totalError } = await supabase
        .from('bug_reports')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      // Count read bug reports for this user
      const { count: readCount, error: readError } = await supabase
        .from('bug_report_reads' as any)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (readError) throw readError;

      return Math.max(0, (totalCount || 0) - (readCount || 0));
    },
    enabled: !!user?.id && !prefsLoading,
    refetchInterval: 30000,
    // Match staleTime to refetch interval so data isn't considered stale
    // between polls; realtime subscription also triggers immediate invalidation.
    staleTime: 30_000,
  });

  // Subscribe to realtime changes on bug_reports for auto-refresh
  useEffect(() => {
    const channel = supabase
      .channel('bug-reports-unread-count')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bug_reports',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['unread-bug-report-count'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    count: query.data ?? 0,
    isLoading: query.isLoading,
  };
}
