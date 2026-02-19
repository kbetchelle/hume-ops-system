import { Clock, Check, CheckCheck } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { StaffMessage, StaffMessageRead } from '@/types/messaging';

interface ReadReceiptProps {
  message: StaffMessage & { _isTemp?: boolean };
  reads: StaffMessageRead[];
  staffNames: Record<string, string>;
  currentUserId: string;
}

export function ReadReceipt({
  message,
  reads,
  staffNames,
  currentUserId,
}: ReadReceiptProps) {
  // Only show for sent messages
  if (message.sender_id !== currentUserId) return null;

  const isTemp = !!(message as { _isTemp?: boolean })._isTemp;
  const recipientIds = message.recipient_ids || [];
  const messageReads = reads.filter((r) => r.message_id === message.id);

  // Status: sending (temp or pending), sent, delivered, read
  const allRead = recipientIds.length > 0 && recipientIds.every((id) =>
    messageReads.some((r) => r.staff_id === id)
  );
  const someRead = messageReads.length > 0;

  let status: 'sending' | 'sent' | 'delivered' | 'read';
  if (isTemp) {
    status = 'sending';
  } else if (allRead) {
    status = 'read';
  } else if (someRead || recipientIds.length > 0) {
    status = 'delivered';
  } else {
    status = 'sent';
  }

  const StatusIcon = () => {
    switch (status) {
      case 'sending':
        return <Clock className="h-3 w-3 text-muted-foreground animate-pulse" />;
      case 'sent':
        return <Check className="h-3 w-3 text-muted-foreground" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-primary" />;
    }
  };

  // Get read details
  const readDetails = messageReads.map((read) => ({
    userId: read.staff_id,
    name: staffNames[read.staff_id] || 'Unknown',
    readAt: read.read_at,
  }));

  if (readDetails.length === 0) {
    return (
      <div className="flex items-center justify-end gap-1">
        <StatusIcon />
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center justify-end gap-1 hover:opacity-70 transition-opacity">
          <StatusIcon />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3 rounded-none" align="end">
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            Read by {readDetails.length} of {recipientIds.length}
          </p>
          <div className="space-y-1.5">
            {readDetails.map((detail, i) => (
              <div key={i} className="text-xs">
                <div className="font-medium">{detail.name}</div>
                <div className="text-[10px] text-muted-foreground">
                  {format(parseISO(detail.readAt), 'MMM d, h:mm a')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
