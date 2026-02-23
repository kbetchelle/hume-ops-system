import { useState, useCallback } from "react";
import { Search, Inbox as InboxIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

import {
  useManagementInbox,
  useMarkInboxRead,
} from "@/hooks/useManagementInbox";
import { useResolveResourceFlag } from "@/hooks/useResourceFlags";

import { QAInboxItem } from "./inbox/QAInboxItem";
import { FlagInboxItem } from "./inbox/FlagInboxItem";
import { ShiftNoteInboxItem } from "./inbox/ShiftNoteInboxItem";
import { SickDayInboxItem } from "./inbox/SickDayInboxItem";
import { AnswerQuestionDialog } from "./inbox/AnswerQuestionDialog";
import { SickDayReviewDialog } from "./inbox/SickDayReviewDialog";

import { add_color } from "@/lib/constants";
import type { InboxItem, InboxItemType, QAInboxData } from "@/types/inbox";

export function ManagementInbox() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState<InboxItem | null>(null);
  const [answerDialogOpen, setAnswerDialogOpen] = useState(false);
  const [selectedSickDay, setSelectedSickDay] = useState<InboxItem | null>(null);
  const [sickDayAction, setSickDayAction] = useState<"approve" | "reject" | null>(null);
  const [sickDayDialogOpen, setSickDayDialogOpen] = useState(false);

  const { items, isLoading } = useManagementInbox(searchTerm);
  const markRead = useMarkInboxRead();
  const resolveFlag = useResolveResourceFlag();

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
    <>
      <div className="pb-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Management Inbox
            {unreadCount > 0 && (
              <span
                className="text-[10px] px-1.5 py-0.5 font-medium"
                style={{ backgroundColor: add_color.red, color: '#fff' }}
              >
                {unreadCount}
              </span>
            )}
          </h2>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search questions, flags, notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center">
          <InboxIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {searchTerm ? "No items match your search." : "Your inbox is empty."}
          </p>
        </div>
      ) : (
        <ScrollArea className="max-h-[calc(100vh-250px)]">
          <div className="space-y-2">
            {items.map((item) => {
              switch (item.data.type) {
                case "qa":
                  return (
                    <QAInboxItem key={item.id} item={item} onAnswer={handleAnswer} onMarkRead={handleMarkRead} />
                  );
                case "flag":
                  return (
                    <FlagInboxItem key={item.id} item={item} onResolve={handleResolve} onMarkRead={handleMarkRead} />
                  );
                case "shift_note":
                  return (
                    <ShiftNoteInboxItem key={item.id} item={item} onMarkRead={handleMarkRead} />
                  );
                case "sick_day":
                  return (
                    <SickDayInboxItem key={item.id} item={item} onReview={handleSickDayReview} onMarkRead={handleMarkRead} />
                  );
              }
            })}
          </div>
        </ScrollArea>
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
    </>
  );
}
