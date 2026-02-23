import { useEffect, useRef } from "react";
import { FileText } from "lucide-react";
import { formatDistanceToNow, parseISO, format, differenceInDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { solidStyle, tintBorderStyle } from "@/lib/notificationConfig";
import { add_color } from "@/lib/constants";
import type { InboxItem, InboxItemType, ShiftNoteInboxData } from "@/types/inbox";

const HEX = add_color.yellow; // Shift notes → yellow

interface ShiftNoteInboxItemProps {
  item: InboxItem;
  onMarkRead: (itemType: InboxItemType, itemId: string) => void;
}

export function ShiftNoteInboxItem({ item, onMarkRead }: ShiftNoteInboxItemProps) {
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
      className={cn("flex gap-3 p-4 border transition-colors hover:bg-muted/50 cursor-pointer")}
      style={{
        backgroundColor: `${HEX}1A`,
        ...(!item.isRead ? tintBorderStyle(HEX) : undefined),
      }}
      onClick={() => navigate("/dashboard/concierge")}
    >
      {/* Icon badge – solid */}
      <div className="shrink-0 h-7 w-7 flex items-center justify-center" style={solidStyle(HEX)}>
        <FileText className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <p className="text-sm font-bold text-foreground">
            From Concierge Shift Report
          </p>
          <span
            className="text-[9px] px-1.5 py-0.5 uppercase tracking-widest shrink-0"
            style={solidStyle(HEX)}
          >
            {data.shiftType}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {differenceInDays(new Date(), parseISO(item.createdAt)) > 5
              ? format(parseISO(item.createdAt), "MMM. dd")
              : formatDistanceToNow(parseISO(item.createdAt), { addSuffix: true })}
          </span>
        </div>

        <p className="text-xs text-muted-foreground mt-1 line-clamp-3 whitespace-pre-wrap">
          {data.managementNotes}
        </p>
      </div>

    </div>
  );
}
