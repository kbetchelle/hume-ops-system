import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { updateTable, eq } from '@/lib/dataApi';

export interface NotificationHistoryRecord {
  id: string;
  staff_id: string | null;
  title: string;
  body: string | null;
  type: string | null;
  success: boolean;
  error_message: string | null;
  trigger_source: string | null;
  user_marked_failed: boolean;
  sent_at: string;
}

export interface NotificationHistoryWithStaff extends NotificationHistoryRecord {
  staff_name: string | null;
}

async function fetchNotificationHistory(): Promise<NotificationHistoryWithStaff[]> {
  const { data: rows, error } = await (supabase as any)
    .from('notification_history')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  const records = (rows ?? []) as NotificationHistoryRecord[];

  const staffIds = [...new Set(records.map((r) => r.staff_id).filter(Boolean))] as string[];
  let staffNames: Record<string, string> = {};
  if (staffIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', staffIds);
    staffNames = (profiles ?? []).reduce(
      (acc: Record<string, string>, p: { user_id: string; full_name: string | null }) => {
        acc[p.user_id] = p.full_name ?? 'Unknown';
        return acc;
      },
      {}
    );
  }

  return records.map((r) => ({
    ...r,
    staff_name: r.staff_id ? staffNames[r.staff_id] ?? 'Unknown' : null,
  }));
}

export function useNotificationHistory(enabled = true) {
  return useQuery({
    queryKey: ['notification-history'],
    queryFn: fetchNotificationHistory,
    enabled,
    refetchInterval: 30000,
  });
}

export function useResendNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      staffId: string;
      title: string;
      body?: string | null;
      type?: string | null;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/push-notifications`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: 'send-notification',
            staffIds: [input.staffId],
            title: input.title,
            body: input.body ?? undefined,
            type: input.type ?? undefined,
          }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Resend failed');
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-history'] });
    },
  });
}

export function useMarkNotificationFailed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('notification_history')
        .update({ user_marked_failed: true })
        .eq('id', id);
      if (error) throw error;
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-history'] });
    },
  });
}
