import { format, parseISO } from 'date-fns';
import {
  Bell,
  HelpCircle,
  Megaphone,
  MessageSquare,
  Bug,
  Users,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import type { StaffNotification } from '@/hooks/useNotificationCenter';

const notificationIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  qa_answered: HelpCircle,
  qa_new_question: HelpCircle,
  announcement: Megaphone,
  message: MessageSquare,
  bug_report_update: Bug,
  member_alert: Users,
  class_turnover: RefreshCw,
  mat_cleaning: Sparkles,
};

interface NotificationItemProps {
  notification: StaffNotification;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onClick: (notification: StaffNotification) => void;
}

export function NotificationItem({
  notification,
  onMarkRead,
  onDismiss,
  onClick,
}: NotificationItemProps) {
  const { t } = useLanguage();
  const Icon = notificationIcons[notification.type] || Bell;

  const handleClick = () => {
    onClick(notification);
  };

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
      className={cn(
        'group flex items-start gap-3 p-3 cursor-pointer border-b border-border transition-colors hover:bg-muted/50',
        !notification.is_read && 'bg-primary/5'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'p-1.5 shrink-0',
          notification.is_read ? 'bg-muted' : 'bg-primary/10'
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-xs truncate',
            !notification.is_read && 'font-medium'
          )}
        >
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

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {!notification.is_read && (
          <div className="h-2 w-2 bg-primary shrink-0 mt-1" />
        )}
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
