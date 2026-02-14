import { useEffect, useRef } from "react";
import { CalendarClock, CheckCircle2, XCircle } from "lucide-react";
import { formatDistanceToNow, parseISO, format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { InboxItem, InboxItemType, SickDayInboxData } from "@/types/inbox";

interface SickDayInboxItemProps {
  item: InboxItem;
  onReview: (item: InboxItem, action: "approve" | "reject") => void;
  onMarkRead: (itemType: InboxItemType, itemId: string) => void;
}

export function SickDayInboxItem({
  item,
  onReview,
  onMarkRead,
}: SickDayInboxItemProps) {
  const data = item.data as SickDayInboxData;
  const markedRef = useRef(false);

  useEffect(() => {
    if (!item.isRead && !markedRef.current) {
      markedRef.current = true;
      onMarkRead("sick_day", item.id);
    }
  }, [item.isRead, item.id, onMarkRead]);

  const getStatusBadge = () => {
    switch (data.status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="text-[9px] px-1.5 py-0 text-purple-600 border-purple-300 bg-purple-50 shrink-0"
          >
            Sick Day
          </Badge>
        );
      case "approved":
        return (
          <Badge
            variant="outline"
            className="text-[9px] px-1.5 py-0 text-emerald-600 border-emerald-300 bg-emerald-50 shrink-0"
          >
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            variant="outline"
            className="text-[9px] px-1.5 py-0 text-red-600 border-red-300 bg-red-50 shrink-0"
          >
            Rejected
          </Badge>
        );
    }
  };

  return (
    <div
      role="article"
      className={cn(
        "flex gap-3 p-4 border transition-colors hover:bg-muted/50",
        !item.isRead &&
          data.status === "pending" &&
          "border-l-2 border-l-purple-500 bg-purple-50/50"
      )}
    >
      {/* Icon */}
      <div className="shrink-0 mt-0.5">
        <CalendarClock className="h-5 w-5 text-purple-500" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {getStatusBadge()}
          <span className="text-[10px] text-muted-foreground">
            {data.userName}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(parseISO(item.createdAt), { addSuffix: true })}
          </span>
        </div>

        <p className="text-sm font-medium mb-1">Sick Day Pay Request</p>

        {/* Requested Dates */}
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

        {/* Notes (truncated) */}
        <p className="text-xs text-muted-foreground line-clamp-2">{data.notes}</p>

        {/* Review Info (if reviewed) */}
        {data.status !== "pending" && data.reviewedByName && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
            {data.status === "approved" ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <XCircle className="h-3.5 w-3.5 text-red-600" />
            )}
            <span>
              {data.status === "approved" ? "Approved" : "Rejected"} by{" "}
              {data.reviewedByName}
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
              className="rounded-none text-xs bg-emerald-600 hover:bg-emerald-700"
              onClick={() => onReview(item, "approve")}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-none text-xs"
              onClick={() => onReview(item, "reject")}
            >
              Reject
            </Button>
          </>
        ) : (
          <Badge
            variant="outline"
            className={cn(
              "text-[9px] px-1.5 py-0",
              data.status === "approved" &&
                "text-emerald-600 border-emerald-300 bg-emerald-50",
              data.status === "rejected" &&
                "text-red-600 border-red-300 bg-red-50"
            )}
          >
            {data.status === "approved" ? "Approved" : "Rejected"}
          </Badge>
        )}
      </div>
    </div>
  );
}
