import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
      toast({
        title: 'Status Updated',
        description: 'Bug report status has been updated.',
      });
    },
  });
}
