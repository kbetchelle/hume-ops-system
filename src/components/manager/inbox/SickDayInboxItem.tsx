import { useEffect, useRef } from "react";
import { CalendarClock, CheckCircle2, XCircle } from "lucide-react";
import { formatDistanceToNow, parseISO, format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { solidStyle, tintStyle } from "@/lib/notificationConfig";
import { add_color } from "@/lib/constants";
import type { InboxItem, InboxItemType, SickDayInboxData } from "@/types/inbox";

const HEX = add_color.orange; // Sick day → orange

interface SickDayInboxItemProps {
  item: InboxItem;
  onReview: (item: InboxItem, action: "approve" | "reject") => void;
  onMarkRead: (itemType: InboxItemType, itemId: string) => void;
}

export function SickDayInboxItem({ item, onReview, onMarkRead }: SickDayInboxItemProps) {
  const data = item.data as SickDayInboxData;
  const markedRef = useRef(false);

  useEffect(() => {
    if (!item.isRead && !markedRef.current) {
      markedRef.current = true;
      onMarkRead("sick_day", item.id);
    }
  }, [item.isRead, item.id, onMarkRead]);

  const getStatusTag = () => {
    switch (data.status) {
      case "pending":
        return (
          <span className="text-[9px] px-1.5 py-0.5 uppercase tracking-widest shrink-0" style={solidStyle(HEX)}>
            Sick Day
          </span>
        );
      case "approved":
        return (
          <span className="text-[9px] px-1.5 py-0.5 uppercase tracking-widest shrink-0" style={solidStyle(add_color.green)}>
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="text-[9px] px-1.5 py-0.5 uppercase tracking-widest shrink-0" style={solidStyle(add_color.red)}>
            Rejected
          </span>
        );
    }
  };

  return (
    <div
      role="article"
      className={cn("flex gap-3 p-4 border transition-colors hover:bg-muted/50")}
      style={!item.isRead && data.status === "pending" ? tintStyle(HEX) : undefined}
    >
      {/* Icon badge – solid */}
      <div className="shrink-0 h-7 w-7 flex items-center justify-center" style={solidStyle(HEX)}>
        <CalendarClock className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {getStatusTag()}
          <span className="text-[10px] text-muted-foreground">{data.userName}</span>
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(parseISO(item.createdAt), { addSuffix: true })}
          </span>
        </div>

        <p className="text-sm font-medium mb-1">Sick Day Pay Request</p>

        <div className="flex flex-wrap gap-1 mb-2">
          {data.requestedDates.slice(0, 3).map((date) => (
            <Badge key={date} variant="secondary" className="text-[9px] rounded-none">
              {format(parseISO(date), "MMM d, yyyy")}
            </Badge>
          ))}
          {data.requestedDates.length > 3 && (
            <Badge variant="secondary" className="text-[9px] rounded-none">
              +{data.requestedDates.length - 3} more
            </Badge>
          )}
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2">{data.notes}</p>

        {data.status !== "pending" && data.reviewedByName && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
            {data.status === "approved" ? (
              <CheckCircle2 className="h-3.5 w-3.5" style={{ color: add_color.green }} />
            ) : (
              <XCircle className="h-3.5 w-3.5" style={{ color: add_color.red }} />
            )}
            <span>
              {data.status === "approved" ? "Approved" : "Rejected"} by {data.reviewedByName}
            </span>
            {data.reviewNotes && (
              <span className="truncate ml-1">
                &mdash; {data.reviewNotes.substring(0, 60)}
                {data.reviewNotes.length > 60 ? "..." : ""}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="shrink-0 flex items-start gap-2">
        {data.status === "pending" ? (
          <>
            <Button
              size="sm"
              className="rounded-none text-xs"
              style={{ backgroundColor: add_color.green, color: '#fff' }}
              onClick={() => onReview(item, "approve")}
            >
              Approve
            </Button>
            <Button size="sm" variant="outline" className="rounded-none text-xs" onClick={() => onReview(item, "reject")}>
              Reject
            </Button>
          </>
        ) : (
          <span
            className="text-[9px] px-1.5 py-0.5 uppercase tracking-widest"
            style={data.status === "approved" ? solidStyle(add_color.green) : solidStyle(add_color.red)}
          >
            {data.status === "approved" ? "Approved" : "Rejected"}
          </span>
        )}
      </div>
    </div>
  );
}
