import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, Trash2, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuthContext } from '@/features/auth/AuthProvider';
import { useUserRoles } from '@/hooks/useUserRoles';
import {
  useNotificationCenter,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDismissNotification,
  useClearAllNotifications,
  ReadFilter,
} from '@/hooks/useNotificationCenter';
import { getNotificationRoute } from '@/lib/notificationRoutes';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { AdminNotificationPanel } from '@/components/notifications/AdminNotificationPanel';

export default function NotificationsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { data: roles } = useUserRoles(user?.id);
  const [filter, setFilter] = useState<ReadFilter>('all');

  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useNotificationCenter(filter);

  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const dismissNotification = useDismissNotification();
  const clearAll = useClearAllNotifications();

  const isAdminOrManager = (roles || []).some(
    (r) => r.role === 'admin' || r.role === 'manager'
  );

  const notifications = data?.pages.flat() || [];

  return (
    <DashboardLayout title={t('Notifications', 'Notificaciones')}>
      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-4">
        {/* Header Card */}
        <Card className="rounded-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs uppercase tracking-widest font-normal flex items-center gap-2">
              <Bell className="h-4 w-4" />
              {t('Notification Center', 'Centro de Notificaciones')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Actions row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-none text-[10px] uppercase tracking-widest h-7"
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  {t('Mark all read', 'Marcar todo leído')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-none text-[10px] uppercase tracking-widest h-7"
                  onClick={() => clearAll.mutate()}
                  disabled={clearAll.isPending}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  {t('Clear all', 'Limpiar todo')}
                </Button>
              </div>

              {/* Filter toggle */}
              <div className="flex gap-1">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-none text-[10px] uppercase tracking-widest h-7"
                  onClick={() => setFilter('all')}
                >
                  {t('All', 'Todos')}
                </Button>
                <Button
                  variant={filter === 'unread' ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-none text-[10px] uppercase tracking-widest h-7"
                  onClick={() => setFilter('unread')}
                >
                  {t('Unread', 'No leídos')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification List */}
        <Card className="rounded-none overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              {t('No notifications', 'Sin notificaciones')}
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={(n) => {
                    if (!n.is_read) {
                      markRead.mutate(n.id);
                    }
                    navigate(getNotificationRoute(n.type, n.data));
                  }}
                  onMarkRead={(id) => markRead.mutate(id)}
                  onDismiss={(id) => dismissNotification.mutate(id)}
                />
              ))}

              {/* Load More */}
              {hasNextPage && (
                <div className="p-3">
                  <Button
                    variant="outline"
                    className="w-full rounded-none text-[10px] uppercase tracking-widest"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-2" />
                    ) : null}
                    {t('Load More', 'Cargar Más')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Admin Panel */}
        {isAdminOrManager && <AdminNotificationPanel />}
      </div>
    </DashboardLayout>
  );
}
