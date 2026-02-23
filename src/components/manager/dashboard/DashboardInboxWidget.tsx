import { useState, useCallback } from "react";
import { Inbox as InboxIcon, Eye } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  useManagementInbox,
  useMarkInboxRead,
} from "@/hooks/useManagementInbox";
import { useResolveResourceFlag } from "@/hooks/useResourceFlags";
import { QAInboxItem } from "../inbox/QAInboxItem";
import { FlagInboxItem } from "../inbox/FlagInboxItem";
import { ShiftNoteInboxItem } from "../inbox/ShiftNoteInboxItem";
import { SickDayInboxItem } from "../inbox/SickDayInboxItem";
import { AnswerQuestionDialog } from "../inbox/AnswerQuestionDialog";
import { SickDayReviewDialog } from "../inbox/SickDayReviewDialog";
import { add_color } from "@/lib/constants";
import type { InboxItem, InboxItemType, QAInboxData } from "@/types/inbox";

const MAX_ITEMS = 8;

export function DashboardInboxWidget() {
  const [selectedQuestion, setSelectedQuestion] = useState<InboxItem | null>(null);
  const [answerDialogOpen, setAnswerDialogOpen] = useState(false);
  const [selectedSickDay, setSelectedSickDay] = useState<InboxItem | null>(null);
  const [sickDayAction, setSickDayAction] = useState<"approve" | "reject" | null>(null);
  const [sickDayDialogOpen, setSickDayDialogOpen] = useState(false);

  const { items, isLoading } = useManagementInbox();
  const markRead = useMarkInboxRead();
  const resolveFlag = useResolveResourceFlag();

  const displayItems = items.slice(0, MAX_ITEMS);
  const unreadCount = items.filter((i) => !i.isRead).length;

  const handleAnswer = useCallback((item: InboxItem) => {
    setSelectedQuestion(item);
    setAnswerDialogOpen(true);
  }, []);

  const handleResolve = useCallback(
    (flagId: string, status: "dismissed" | "resolved", note?: string) => {
      resolveFlag.mutate({ flagId, status, resolutionNote: note });
    },
    [resolveFlag]
  );

  const handleSickDayReview = useCallback(
    (item: InboxItem, action: "approve" | "reject") => {
      setSelectedSickDay(item);
      setSickDayAction(action);
      setSickDayDialogOpen(true);
    },
    []
  );

  const handleMarkRead = useCallback(
    (itemType: InboxItemType, itemId: string) => {
      markRead.mutate({ itemType, itemId });
    },
    [markRead]
  );

  const questionData = selectedQuestion
    ? (selectedQuestion.data as QAInboxData)
    : null;

  return (
    <div className="border border-border rounded-lg p-4 flex flex-col min-h-[320px]">
      <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-widest flex items-center gap-2">
          <InboxIcon className="h-4 w-4" />
          Notes for Management
          {unreadCount > 0 && (
            <span
              className="text-[10px] flex items-center justify-center font-medium"
              style={{ backgroundColor: add_color.red, color: "#fff", width: "38px", height: "38px" }}
            >
              {unreadCount}
            </span>
          )}
        </h3>
      </div>

      {isLoading ? (
        <div className="space-y-2 flex-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : displayItems.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          No items in inbox
        </div>
      ) : (
        <ScrollArea className="flex-1 max-h-[400px]">
          <div className="space-y-2">
            {displayItems.map((item) => {
              switch (item.data.type) {
                case "qa":
                  return <QAInboxItem key={item.id} item={item} onAnswer={handleAnswer} onMarkRead={handleMarkRead} />;
                case "flag":
                  return <FlagInboxItem key={item.id} item={item} onResolve={handleResolve} onMarkRead={handleMarkRead} />;
                case "shift_note":
                  return <ShiftNoteInboxItem key={item.id} item={item} onMarkRead={handleMarkRead} />;
                case "sick_day":
                  return <SickDayInboxItem key={item.id} item={item} onReview={handleSickDayReview} onMarkRead={handleMarkRead} />;
              }
            })}
          </div>
        </ScrollArea>
      )}

      {items.length > MAX_ITEMS && (
        <div className="pt-2 border-t border-border mt-2 text-center">
          <span className="text-xs text-muted-foreground">
            Showing {MAX_ITEMS} of {items.length} items
          </span>
        </div>
      )}

      <AnswerQuestionDialog
        open={answerDialogOpen}
        onOpenChange={setAnswerDialogOpen}
        question={
          selectedQuestion && questionData
            ? {
                id: selectedQuestion.id,
                question: questionData.question,
                context: questionData.context,
                askedByName: questionData.askedByName,
                askedById: questionData.askedById,
                createdAt: selectedQuestion.createdAt,
              }
            : null
        }
      />

      <SickDayReviewDialog
        open={sickDayDialogOpen}
        onOpenChange={setSickDayDialogOpen}
        request={selectedSickDay}
        action={sickDayAction}
      />
    </div>
  );
}
