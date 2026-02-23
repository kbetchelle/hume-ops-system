import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Bell, CheckCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { getNotificationRoute } from '@/lib/notificationRoutes';
import { getNotificationFormat } from '@/lib/notificationConfig';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

export function NotificationBell() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { data: notifications } = useQuery({
    queryKey: ['staff-notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('staff_notifications')
        .select('*')
        .eq('user_id', user.id)
        .is('dismissed_at', null)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data || []) as Notification[];
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('staff_notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-center'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notification-count'] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      const { error } = await supabase
        .from('staff_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-center'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notification-count'] });
    },
  });

  const unreadCount = (notifications || []).filter(n => !n.is_read).length;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-none">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-add-red rounded-full animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 rounded-none">
        <DropdownMenuLabel className="flex items-center justify-between text-xs uppercase tracking-wider">
          Notifications
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-[10px] rounded-none"
              onClick={() => markAllAsRead.mutate()}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {(notifications || []).length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            No notifications
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto">
            {(notifications || []).slice(0, 10).map((notification) => {
              const fmt = getNotificationFormat(notification.type);
              const Icon = fmt.icon;
              return (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    'flex items-start gap-3 p-3 cursor-pointer',
                    !notification.is_read && fmt.tintBg
                  )}
                  onClick={() => {
                    if (!notification.is_read) {
                      markAsRead.mutate(notification.id);
                    }
                    setOpen(false);
                    navigate(getNotificationRoute(notification.type, notification.data));
                  }}
                >
                  <div className={cn(
                    'p-1.5',
                    notification.is_read ? 'bg-muted' : fmt.solidBg
                  )}>
                    <Icon className={cn('h-4 w-4', notification.is_read ? 'text-muted-foreground' : fmt.solidText)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-xs truncate',
                      !notification.is_read && 'font-medium'
                    )}>
                      {notification.title}
                    </p>
                    {notification.body && (
                      <p className="text-[10px] text-muted-foreground truncate">
                        {notification.body}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {format(parseISO(notification.created_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <div className="h-2 w-2 bg-add-red shrink-0 mt-1" />
                  )}
                </DropdownMenuItem>
              );
            })}
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            setOpen(false);
            navigate('/dashboard/notifications');
          }}
          className="text-center text-[10px] uppercase tracking-widest cursor-pointer justify-center"
        >
          View All Notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
