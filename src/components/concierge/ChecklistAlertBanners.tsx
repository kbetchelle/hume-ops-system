import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Sparkles, Music } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { add_color } from "@/lib/constants";

const ALERT_CONFIG: Record<string, { icon: typeof Sparkles; color: string; label: string }> = {
  mat_cleaning: { icon: Sparkles, color: add_color.red, label: 'MAT CLEANING' },
  roof_music_reset: { icon: Music, color: add_color.yellow, label: 'MUSIC RESET' },
};

export function ChecklistAlertBanners() {
  const queryClient = useQueryClient();

  const { data: userId } = useQuery({
    queryKey: ['current-user-id'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user?.id || null;
    },
    staleTime: Infinity,
  });

  const { data: alerts } = useQuery({
    queryKey: ['checklist-alerts', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('staff_notifications')
        .select('*')
        .eq('user_id', userId)
        .in('type', ['mat_cleaning', 'roof_music_reset'])
        .is('dismissed_at', null)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    refetchInterval: 30000,
  });

  const dismissAlert = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('staff_notifications')
        .update({ is_read: true, dismissed_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['staff-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notification-count'] });
    },
  });

  if (!alerts?.length) return null;

  return (
    <>
      {alerts.map((alert) => {
        const config = ALERT_CONFIG[alert.type] || ALERT_CONFIG.mat_cleaning;
        const Icon = config.icon;
        return (
          <div
            key={alert.id}
            className="flex items-center gap-3 px-4 py-3 border-l-4"
            style={{
              borderLeftColor: config.color,
              backgroundColor: `${config.color}1A`,
            }}
          >
            <div
              className="h-7 w-7 flex items-center justify-center shrink-0"
              style={{ backgroundColor: config.color }}
            >
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] px-1.5 py-0.5 uppercase tracking-widest shrink-0 text-white font-medium"
                  style={{ backgroundColor: config.color }}
                >
                  {config.label}
                </span>
                <span className="text-xs font-medium truncate">{alert.title}</span>
              </div>
              {alert.body && (
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{alert.body}</p>
              )}
            </div>
            <button
              onClick={() => dismissAlert.mutate(alert.id)}
              className="shrink-0 p-1 hover:bg-muted rounded-sm transition-colors"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        );
      })}
    </>
  );
}
