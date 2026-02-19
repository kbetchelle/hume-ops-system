import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StaffPushStatusItem {
  staffId: string;
  fullName: string;
  email: string | null;
  roles: string[];
  department: 'foh' | 'boh' | 'cafe' | 'other';
  subscriptionCount: number;
  deviceInfo: string | null;
  isSubscribed: boolean;
}

export type DepartmentFilter = 'all' | 'foh' | 'boh' | 'cafe';

function roleToDepartment(role: string): StaffPushStatusItem['department'] {
  if (role === 'concierge') return 'foh';
  if (['floater', 'female_spa_attendant', 'male_spa_attendant'].includes(role)) return 'boh';
  if (role === 'cafe') return 'cafe';
  return 'other';
}

async function fetchStaffPushStatus(): Promise<StaffPushStatusItem[]> {
  const { data: profiles, error: profError } = await supabase
    .from('profiles')
    .select('user_id, full_name, email')
    .eq('deactivated', false)
    .order('full_name', { ascending: true });

  if (profError) throw profError;
  if (!profiles?.length) return [];

  const userIds = profiles.map((p) => p.user_id);

  const { data: rolesData, error: rolesError } = await supabase
    .from('user_roles')
    .select('user_id, role')
    .in('user_id', userIds);

  if (rolesError) throw rolesError;

  const { data: subs, error: subsError } = await supabase
    .from('staff_push_subscriptions')
    .select('staff_id, device_info')
    .in('staff_id', userIds);

  if (subsError) throw subsError;

  const rolesByUser: Record<string, string[]> = {};
  (rolesData ?? []).forEach((r: { user_id: string; role: string }) => {
    if (!rolesByUser[r.user_id]) rolesByUser[r.user_id] = [];
    rolesByUser[r.user_id].push(r.role);
  });

  const subsByUser: Record<string, { count: number; deviceInfo: string | null }> = {};
  (subs ?? []).forEach((s: { staff_id: string; device_info: string | null }) => {
    if (!subsByUser[s.staff_id]) {
      subsByUser[s.staff_id] = { count: 0, deviceInfo: s.device_info };
    }
    subsByUser[s.staff_id].count += 1;
  });

  return profiles.map((p) => {
    const roles = rolesByUser[p.user_id] ?? [];
    const subInfo = subsByUser[p.user_id];
    const count = subInfo?.count ?? 0;

    let department: StaffPushStatusItem['department'] = 'other';
    for (const r of roles) {
      const d = roleToDepartment(r);
      if (d !== 'other') {
        department = d;
        break;
      }
    }

    return {
      staffId: p.user_id,
      fullName: p.full_name ?? 'Unknown',
      email: p.email ?? null,
      roles,
      department,
      subscriptionCount: count,
      deviceInfo: subInfo?.deviceInfo ?? null,
      isSubscribed: count > 0,
    };
  });
}

export function useStaffPushStatus() {
  return useQuery({
    queryKey: ['staff-push-status'],
    queryFn: fetchStaffPushStatus,
  });
}

export function useSendTestPush() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (staffId: string) => {
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
            staffIds: [staffId],
            title: 'Test Notification',
            body: 'This is a test push from the Notification Center.',
            type: 'test',
          }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Send failed');
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-push-status'] });
      queryClient.invalidateQueries({ queryKey: ['notification-history'] });
    },
  });
}

export function useSendInAppTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (staffId: string) => {
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
            action: 'test-in-app-only',
            staffIds: [staffId],
            title: 'Test In-App Notification',
            body: 'This is an in-app test from the Notification Center.',
          }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Send failed');
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-push-status'] });
    },
  });
}
