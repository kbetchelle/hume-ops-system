import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface BugReport {
  id: string;
  user_id: string | null;
  title: string;
  description: string;
  category: 'bug' | 'feature' | 'ui' | 'performance' | 'general';
  severity: 'low' | 'medium' | 'high' | 'critical';
  page_url: string | null;
  user_agent: string | null;
  screenshot_url: string | null;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface BugReportWithReporter extends BugReport {
  reporter_name: string | null;
  reporter_email: string | null;
}

export interface CreateBugReportData {
  title: string;
  description: string;
  category?: 'bug' | 'feature' | 'ui' | 'performance' | 'general';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  page_url?: string;
  user_agent?: string;
  screenshot_url?: string;
}

export function useBugReports() {
  return useQuery({
    queryKey: ['bug-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bug_reports')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as BugReport[];
    },
  });
}

/**
 * Fetches bug reports with reporter profile info (name & email).
 * Subscribes to Supabase Realtime for live updates.
 */
export function useBugReportsWithReporter() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['bug-reports-with-reporter'],
    queryFn: async () => {
      // Fetch bug reports
      const { data: bugs, error: bugsError } = await supabase
        .from('bug_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (bugsError) throw bugsError;

      // Fetch profiles for all unique user_ids
      const userIds = [...new Set((bugs || []).map(b => b.user_id).filter(Boolean))] as string[];
      let profileMap: Record<string, { full_name: string | null; email: string }> = {};

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', userIds);

        if (profiles) {
          profileMap = Object.fromEntries(
            profiles.map(p => [p.user_id, { full_name: p.full_name, email: p.email }])
          );
        }
      }

      return (bugs || []).map(bug => ({
        ...bug,
        reporter_name: bug.user_id ? profileMap[bug.user_id]?.full_name ?? null : null,
        reporter_email: bug.user_id ? profileMap[bug.user_id]?.email ?? null : null,
      })) as BugReportWithReporter[];
    },
  });

  // Subscribe to realtime changes on bug_reports
  useEffect(() => {
    const channel = supabase
      .channel('bug-reports-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bug_reports',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['bug-reports-with-reporter'] });
          queryClient.invalidateQueries({ queryKey: ['bug-reports'] });
          queryClient.invalidateQueries({ queryKey: ['unread-bug-report-count'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

export function useCreateBugReport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (bugData: CreateBugReportData) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Must be authenticated to submit bug reports');
      }

      // Auto-capture additional context
      const enrichedData = {
        ...bugData,
        user_id: user.id,
        page_url: bugData.page_url || window.location.href,
        user_agent: bugData.user_agent || navigator.userAgent,
      };

      const { data, error } = await supabase
        .from('bug_reports')
        .insert(enrichedData)
        .select()
        .single();

      if (error) throw error;
      return data as BugReport;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bug-reports'] });
      queryClient.invalidateQueries({ queryKey: ['bug-reports-with-reporter'] });
      queryClient.invalidateQueries({ queryKey: ['unread-bug-report-count'] });
      toast({
        title: 'Report Submitted',
        description: 'Thank you for your feedback. We\'ll review it soon.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Submission Failed',
        description: error.message || 'Failed to submit bug report',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateBugReportStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BugReport['status'] }) => {
      const { data, error } = await supabase
        .from('bug_reports')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as BugReport;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bug-reports'] });
      queryClient.invalidateQueries({ queryKey: ['bug-reports-with-reporter'] });
      toast({
        title: 'Status Updated',
        description: 'Bug report status has been updated.',
      });
    },
  });
}

/**
 * Marks a bug report as read for the current user.
 */
export function useMarkBugReportRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (bugReportId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('bug_report_reads' as any)
        .upsert(
          { bug_report_id: bugReportId, user_id: user.id },
          { onConflict: 'bug_report_id,user_id' }
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unread-bug-report-count'] });
    },
  });
}
