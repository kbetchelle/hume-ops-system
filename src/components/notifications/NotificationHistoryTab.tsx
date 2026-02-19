import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useNotificationHistory, useResendNotification, useMarkNotificationFailed } from '@/hooks/useNotificationHistory';

export function NotificationHistoryTab() {
  const { data: history = [], isLoading } = useNotificationHistory();
  const resend = useResendNotification();
  const markFailed = useMarkNotificationFailed();

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading history...</p>;
  }

  if (history.length === 0) {
    return <p className="text-sm text-muted-foreground">No notification history yet.</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Notification History</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="rounded-none">Staff Name</TableHead>
            <TableHead className="rounded-none">Type</TableHead>
            <TableHead className="rounded-none">Title</TableHead>
            <TableHead className="rounded-none">Body</TableHead>
            <TableHead className="rounded-none">Success</TableHead>
            <TableHead className="rounded-none">Sent At</TableHead>
            <TableHead className="rounded-none w-[180px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">
                <span className="flex items-center gap-1">
                  {row.user_marked_failed && (
                    <span title="Marked as not received" className="text-amber-500">⚠️</span>
                  )}
                  {row.staff_name ?? '-'}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {row.type ?? '-'}
              </TableCell>
              <TableCell>{row.title}</TableCell>
              <TableCell className="max-w-[200px] truncate" title={row.body ?? undefined}>
                {row.body ? (row.body.length > 60 ? `${row.body.slice(0, 60)}...` : row.body) : '-'}
              </TableCell>
              <TableCell>
                {row.success ? '✅' : '❌'}
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {format(parseISO(row.sent_at), 'MMM d, h:mm a')}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-none text-xs h-7"
                    onClick={() =>
                      resend.mutate(
                        {
                          staffId: row.staff_id!,
                          title: row.title,
                          body: row.body,
                          type: row.type,
                        },
                        {
                          onSuccess: () => {},
                          onError: () => {},
                        }
                      )
                    }
                    disabled={!row.staff_id || resend.isPending}
                  >
                    Resend
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-none text-xs h-7"
                    onClick={() =>
                      markFailed.mutate(row.id, {
                        onSuccess: () => {},
                        onError: () => {},
                      })
                    }
                    disabled={row.user_marked_failed || markFailed.isPending}
                  >
                    Mark as not received
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
