import { useState, useEffect } from 'react';
import { Send, AlertCircle, Clock, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useStaffList, useSendMessage } from '@/hooks/useMessaging';
import { useSaveDraft, useDrafts, useDeleteDraft } from '@/hooks/useMessageDrafts';
import { NewConversationDialog } from './NewConversationDialog';
import { SchedulePopover } from './SchedulePopover';
import type { MessageComposerProps } from '@/types/messaging';

export function MessageComposer({
  isOpen,
  onClose,
  initialRecipientId,
  initialSubject,
  draftId,
}: MessageComposerProps) {
  const [recipientIds, setRecipientIds] = useState<string[]>(
    initialRecipientId ? [initialRecipientId] : []
  );
  const [subject, setSubject] = useState(initialSubject || '');
  const [content, setContent] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [showRecipientPicker, setShowRecipientPicker] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | undefined>(draftId);

  const { data: staffList = [] } = useStaffList();
  const { data: drafts = [] } = useDrafts();
  const { mutate: sendMessage, isPending: isSending } = useSendMessage();
  const { mutate: saveDraft, isPending: isSavingDraft } = useSaveDraft();
  const { mutate: deleteDraft } = useDeleteDraft();

  // Load draft if draftId provided
  useEffect(() => {
    if (draftId && drafts.length > 0) {
      const draft = drafts.find((d) => d.id === draftId);
      if (draft) {
        setSubject(draft.subject || '');
        setContent(draft.content || '');
        setRecipientIds(draft.recipient_staff_ids || []);
        setIsUrgent(draft.is_urgent);
        setCurrentDraftId(draft.id);
      }
    }
  }, [draftId, drafts]);

  const handleSend = () => {
    if (recipientIds.length === 0 || !content.trim()) return;

    sendMessage(
      {
        recipientIds,
        subject: subject || undefined,
        content: content.trim(),
        isUrgent,
        scheduledAt: scheduledAt?.toISOString() || undefined,
      },
      {
        onSuccess: () => {
          // Delete draft if it exists
          if (currentDraftId) {
            deleteDraft(currentDraftId);
          }
          handleClose();
        },
      }
    );
  };

  const handleSaveDraft = () => {
    if (!content.trim() && !subject.trim()) return;

    saveDraft(
      {
        draftId: currentDraftId,
        subject: subject || undefined,
        content: content || undefined,
        recipientStaffIds: recipientIds.length > 0 ? recipientIds : undefined,
        isUrgent,
      },
      {
        onSuccess: (draft) => {
          setCurrentDraftId(draft.id);
          handleClose();
        },
      }
    );
  };

  const handleSchedule = (date: Date) => {
    setScheduledAt(date);
  };

  const handleClose = () => {
    if (!isSending && !isSavingDraft) {
      setRecipientIds([]);
      setSubject('');
      setContent('');
      setIsUrgent(false);
      setScheduledAt(null);
      setCurrentDraftId(undefined);
      onClose();
    }
  };

  const handleSelectRecipients = (ids: string[], groupId?: string) => {
    setRecipientIds(ids);
    setShowRecipientPicker(false);
  };

  // Get recipient names
  const recipientNames = recipientIds
    .map((id) => {
      const staff = staffList.find((s) => s.user_id === id);
      return staff?.full_name || staff?.email || 'Unknown';
    })
    .slice(0, 3); // Show max 3 names

  const remainingCount = recipientIds.length - 3;

  const isPending = isSending || isSavingDraft;
  const canSend = recipientIds.length > 0 && content.trim().length > 0;
  const canSaveDraft = (content.trim().length > 0 || subject.trim().length > 0);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="rounded-none max-w-4xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="text-sm uppercase tracking-wider">
              New Message
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Recipients */}
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-wider">To</Label>
              {recipientIds.length === 0 ? (
                <Button
                  variant="outline"
                  onClick={() => setShowRecipientPicker(true)}
                  className="rounded-none w-full justify-start text-muted-foreground"
                  disabled={isPending}
                >
                  Select recipients...
                </Button>
              ) : (
                <div className="flex flex-wrap gap-2 p-3 border rounded-none">
                  {recipientNames.map((name, index) => (
                    <Badge key={index} variant="secondary" className="rounded-none">
                      {name}
                    </Badge>
                  ))}
                  {remainingCount > 0 && (
                    <Badge variant="secondary" className="rounded-none">
                      +{remainingCount} more
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRecipientPicker(true)}
                    className="rounded-none h-6 text-xs"
                    disabled={isPending}
                  >
                    Edit
                  </Button>
                </div>
              )}
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-wider">
                Subject (Optional)
              </Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Message subject..."
                className="rounded-none"
                disabled={isPending}
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-wider">Message</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type your message..."
                rows={10}
                className="rounded-none"
                disabled={isPending}
              />
            </div>

            {/* Options Bar */}
            <div className="flex items-center gap-4 py-2 border-t">
              {/* Urgent Toggle */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="urgent"
                  checked={isUrgent}
                  onCheckedChange={setIsUrgent}
                  disabled={isPending}
                  className="data-[state=checked]:bg-destructive"
                />
                <Label
                  htmlFor="urgent"
                  className="text-xs cursor-pointer flex items-center gap-1"
                >
                  <AlertCircle className="h-3 w-3" />
                  Urgent
                </Label>
              </div>

              {/* Schedule Button */}
              <SchedulePopover onSchedule={handleSchedule}>
                <Button
                  variant={scheduledAt ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-none"
                  disabled={isPending}
                >
                  <Clock className="h-3 w-3 mr-2" />
                  {scheduledAt ? 'Scheduled' : 'Schedule'}
                </Button>
              </SchedulePopover>

              {scheduledAt && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setScheduledAt(null)}
                  className="rounded-none text-xs"
                  disabled={isPending}
                >
                  Clear Schedule
                </Button>
              )}
            </div>
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={!canSaveDraft || isPending}
                className="rounded-none"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="rounded-none"
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={!canSend || isPending}
                className="rounded-none"
              >
                <Send className="h-4 w-4 mr-2" />
                {scheduledAt ? 'Schedule' : 'Send'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recipient Picker Dialog */}
      <NewConversationDialog
        isOpen={showRecipientPicker}
        onClose={() => setShowRecipientPicker(false)}
        onStartConversation={handleSelectRecipients}
      />
    </>
  );
}
