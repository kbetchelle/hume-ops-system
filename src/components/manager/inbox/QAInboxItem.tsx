import { useEffect, useRef } from "react";
import { HelpCircle, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { solidStyle, tintBorderStyle } from "@/lib/notificationConfig";
import { add_color } from "@/lib/constants";
import type { InboxItem, InboxItemType, QAInboxData } from "@/types/inbox";

const HEX = add_color.purple; // Q&A → purple

interface QAInboxItemProps {
  item: InboxItem;
  onAnswer: (item: InboxItem) => void;
  onMarkRead: (itemType: InboxItemType, itemId: string) => void;
}

export function QAInboxItem({ item, onAnswer, onMarkRead }: QAInboxItemProps) {
  const data = item.data as QAInboxData;
  const markedRef = useRef(false);

  useEffect(() => {
    if (!item.isRead && !markedRef.current) {
      markedRef.current = true;
      onMarkRead("qa", item.id);
    }
  }, [item.isRead, item.id, onMarkRead]);

  return (
    <div
      role="article"
      className={cn("flex gap-3 p-4 border transition-colors hover:bg-muted/50")}
      style={!item.isRead ? tintBorderStyle(HEX) : undefined}
    >
      {/* Icon badge – solid */}
      <div className="shrink-0 h-7 w-7 flex items-center justify-center" style={solidStyle(HEX)}>
        <HelpCircle className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-[9px] px-1.5 py-0.5 uppercase tracking-widest shrink-0"
            style={solidStyle(HEX)}
          >
            Question
          </span>
          <span className="text-[10px] text-muted-foreground">{data.askedByName}</span>
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(parseISO(item.createdAt), { addSuffix: true })}
          </span>
        </div>

        <p className="text-sm font-medium line-clamp-2">{data.question}</p>

        {data.context && (
          <p className="text-xs text-muted-foreground mt-1 italic line-clamp-1">
            Context: {data.context}
          </p>
        )}

        {data.isResolved && (
          <div className="flex items-center gap-1.5 mt-2 text-xs" style={{ color: add_color.green }}>
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Answered by {data.answeredByName}</span>
            {data.answer && (
              <span className="text-muted-foreground ml-1 truncate">
                &mdash; {data.answer.substring(0, 60)}
                {data.answer.length > 60 ? "..." : ""}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="shrink-0 flex items-start">
        {data.isResolved ? (
          <Button variant="ghost" size="sm" className="rounded-none text-xs" onClick={() => onAnswer(item)}>
            View Answer
          </Button>
        ) : (
          <Button size="sm" className="rounded-none text-xs" onClick={() => onAnswer(item)}>
            Answer
          </Button>
        )}
      </div>
    </div>
  );
}
