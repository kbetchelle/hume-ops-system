import { format, parseISO } from 'date-fns';
import { Eye, EyeOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { getNotificationFormat, solidStyle, tintStyle } from '@/lib/notificationConfig';
import { add_color } from '@/lib/constants';
import type { StaffNotification } from '@/hooks/useNotificationCenter';

interface NotificationItemProps {
  notification: StaffNotification;
  onMarkRead: (id: string) => void;
  onMarkUnread: (id: string) => void;
  onDismiss: (id: string) => void;
  onClick: (notification: StaffNotification) => void;
}

export function NotificationItem({
  notification,
  onMarkRead,
  onMarkUnread,
  onDismiss,
  onClick,
}: NotificationItemProps) {
  const { t } = useLanguage();
  const fmt = getNotificationFormat(notification.type);
  const Icon = fmt.icon;

  const handleClick = () => onClick(notification);
  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss(notification.id);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleClick();
      }}
      className="group flex items-start gap-3 p-3 cursor-pointer border-b border-border transition-colors hover:bg-muted/50"
      style={!notification.is_read ? tintStyle(fmt.hex) : undefined}
    >
      {/* Icon badge – solid color */}
      <div className="h-7 w-7 shrink-0 flex items-center justify-center" style={solidStyle(fmt.hex)}>
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-xs truncate', !notification.is_read && 'font-medium')}>
          {notification.title}
        </p>
        {notification.body && (
          <p className="text-[10px] text-muted-foreground truncate">{notification.body}</p>
        )}
        <p className="text-[10px] text-muted-foreground mt-1">
          {format(parseISO(notification.created_at), 'MMM d, h:mm a')}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {!notification.is_read && (
          <div className="h-2 w-2 shrink-0 mt-1" style={{ backgroundColor: add_color.red }} />
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            notification.is_read ? onMarkUnread(notification.id) : onMarkRead(notification.id);
          }}
          title={notification.is_read ? t('Mark as unread', 'Marcar como no leído') : t('Mark as read', 'Marcar como leído')}
        >
          {notification.is_read ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
          onClick={handleDismiss}
          title={t('Dismiss', 'Descartar')}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
