import { useEffect, useRef } from "react";
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

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-bold text-foreground">From Concierge Shift Report</p>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="text-[10px] font-bold leading-none"
              style={{ ...solidStyle(HEX), paddingLeft: '6.75px', paddingRight: '6.75px', paddingTop: '2.25px', paddingBottom: '2.25px' }}
            >
              {data.shiftType}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {differenceInDays(new Date(), parseISO(item.createdAt)) > 5
                ? format(parseISO(item.createdAt), "MMM. dd")
                : formatDistanceToNow(parseISO(item.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-1 line-clamp-3 whitespace-pre-wrap">
          {data.managementNotes}
        </p>
      </div>

    </div>
  );
}
