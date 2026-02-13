import { useEffect, useRef } from "react";
import { FileText } from "lucide-react";
import { formatDistanceToNow, parseISO, format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  InboxItem,
  InboxItemType,
  ShiftNoteInboxData,
} from "@/types/inbox";

interface ShiftNoteInboxItemProps {
  item: InboxItem;
  onMarkRead: (itemType: InboxItemType, itemId: string) => void;
}

export function ShiftNoteInboxItem({
  item,
  onMarkRead,
}: ShiftNoteInboxItemProps) {
  const data = item.data as ShiftNoteInboxData;
  const navigate = useNavigate();
  const markedRef = useRef(false);

  useEffect(() => {
    if (!item.isRead && !markedRef.current) {
      markedRef.current = true;
      onMarkRead("shift_note", item.id);
    }
  }, [item.isRead, item.id, onMarkRead]);

  return (
    <div
      role="article"
      className={cn(
        "flex gap-3 p-4 border transition-colors hover:bg-muted/50",
        !item.isRead && "border-l-2 border-l-amber-500 bg-amber-50/50"
      )}
    >
      {/* Icon */}
      <div className="shrink-0 mt-0.5">
        <FileText className="h-5 w-5 text-blue-500" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <Badge
            variant="outline"
            className="text-[9px] px-1.5 py-0 text-blue-600 border-blue-300 bg-blue-50 shrink-0"
          >
            Shift Note
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            {data.staffName}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {format(parseISO(data.reportDate), "MMM d, yyyy")}
          </span>
          <Badge
            variant="secondary"
            className="text-[9px] px-1.5 py-0 shrink-0"
          >
            {data.shiftType}
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(parseISO(item.createdAt), { addSuffix: true })}
          </span>
        </div>

        <p className="text-xs text-muted-foreground mt-1 line-clamp-3 whitespace-pre-wrap">
          {data.managementNotes}
        </p>
      </div>

      {/* Actions */}
      <div className="shrink-0 flex items-start">
        <Button
          variant="outline"
          size="sm"
          className="rounded-none text-xs"
          onClick={() => navigate("/dashboard/shift-report")}
        >
          View Full Report
        </Button>
      </div>
    </div>
  );
}
