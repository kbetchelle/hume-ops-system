import { useState, useEffect } from 'react';
import { Send, AlertCircle, Clock, Save, Bell, X, Search } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStaffList, useSendMessage } from '@/hooks/useMessaging';
import { useSaveDraft, useDrafts, useDeleteDraft } from '@/hooks/useMessageDrafts';
import { useCreateGroup } from '@/hooks/useTargetGroups';
import { useTargetGroups } from '@/hooks/useTargetGroups';
import { SchedulePopover } from './SchedulePopover';
import { toast } from 'sonner';
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
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [currentDraftId, setCurrentDraftId] = useState<string | undefined>(draftId);
  const [notify, setNotify] = useState(false);
  const [showSaveAsGroupPrompt, setShowSaveAsGroupPrompt] = useState(false);
  const [saveAsGroupName, setSaveAsGroupName] = useState('');
  const [selectedFromGroup, setSelectedFromGroup] = useState(false);

  const { data: staffList = [] } = useStaffList();
  const { data: drafts = [] } = useDrafts();
  const { data: customGroups = [] } = useTargetGroups();
  const { mutate: sendMessage, isPending: isSending } = useSendMessage();
  const { mutate: saveDraft, isPending: isSavingDraft } = useSaveDraft();
  const { mutate: deleteDraft } = useDeleteDraft();
  const { mutate: createGroup } = useCreateGroup();

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

  const doSend = (ids: string[], groupId?: string, groupName?: string) => {
    sendMessage(
      {
        recipientIds: ids,
        subject: subject || undefined,
        content: content.trim(),
        isUrgent,
        notify,
        groupId,
        groupName,
        scheduledAt: scheduledAt || undefined,
      },
      {
        onSuccess: () => {
          if (currentDraftId) deleteDraft(currentDraftId);
          setShowSaveAsGroupPrompt(false);
          setSaveAsGroupName('');
          handleClose();
        },
      }
    );
  };

  const handleSend = () => {
    if (recipientIds.length === 0 || !content.trim()) return;

    if (recipientIds.length >= 2 && !showSaveAsGroupPrompt && !selectedFromGroup) {
      setShowSaveAsGroupPrompt(true);
      toast.info('Save recipients as a group?', { description: 'Optionally name the group below, or send without saving.' });
      return;
    }

    if (showSaveAsGroupPrompt) {
      if (saveAsGroupName.trim()) {
        createGroup(
          { name: saveAsGroupName.trim(), memberIds: recipientIds },
          {
            onSuccess: (group) => {
              doSend(recipientIds, group.id, group.name);
            },
          }
        );
      } else {
        doSend(recipientIds);
      }
      setShowSaveAsGroupPrompt(false);
      setSaveAsGroupName('');
      return;
    }

    doSend(recipientIds);
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

  const handleSchedule = (scheduledAtIso: string) => {
    setScheduledAt(scheduledAtIso);
  };

  const handleClose = () => {
    if (!isSending && !isSavingDraft) {
      setRecipientIds([]);
      setSubject('');
      setContent('');
      setIsUrgent(false);
      setNotify(false);
      setScheduledAt(null);
      setShowSaveAsGroupPrompt(false);
      setSaveAsGroupName('');
      setCurrentDraftId(undefined);
      onClose();
    }
  };

  const handleToggleRecipient = (staffId: string) => {
    setRecipientIds((prev) =>
      prev.includes(staffId) ? prev.filter((id) => id !== staffId) : [...prev, staffId]
    );
    setSelectedFromGroup(false);
  };

  const handleSelectGroup = (memberIds: string[]) => {
    setRecipientIds(memberIds);
    setSelectedFromGroup(true);
  };

  const filteredStaff = staffList.filter((staff) =>
    (staff.full_name || staff.email)
      ?.toLowerCase()
      .includes(recipientSearch.toLowerCase())
  );

  const filteredGroups = customGroups.filter((group) =>
    group.name.toLowerCase().includes(recipientSearch.toLowerCase())
  );

  const isPending = isSending || isSavingDraft;
  const canSend = recipientIds.length > 0 && content.trim().length > 0;
  const canSaveDraft = (content.trim().length > 0 || subject.trim().length > 0);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="rounded-none w-[75vw] max-w-4xl h-[75vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-2 border-b">
            <DialogTitle className="text-sm uppercase tracking-wider">
              New Message
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-0 min-h-0">
            {/* Left: Recipient selection */}
            <div className="border-r flex flex-col p-4 min-h-0">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                To
              </Label>
              {recipientIds.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {recipientIds.map((id) => {
                    const name = staffList.find((s) => s.user_id === id)?.full_name || staffList.find((s) => s.user_id === id)?.email || 'Unknown';
                    return (
                      <Badge key={id} variant="secondary" className="rounded-none pr-1 gap-1 text-[10px]">
                        <span className="max-w-[100px] truncate">{name}</span>
                        <button
                          type="button"
                          onClick={() => setRecipientIds((prev) => prev.filter((r) => r !== id))}
                          className="hover:bg-muted rounded p-0.5"
                          disabled={isPending}
                          aria-label="Remove"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
              <div className="relative mb-2">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  value={recipientSearch}
                  onChange={(e) => setRecipientSearch(e.target.value)}
                  placeholder="Search..."
                  className="rounded-none text-xs pl-7 h-7"
                  disabled={isPending}
                />
              </div>
              <ScrollArea className="flex-1 min-h-0">
                <div className="space-y-0.5">
                  {/* Target Groups */}
                  {filteredGroups.length > 0 && (
                    <>
                      <div className="text-[9px] uppercase tracking-widest text-muted-foreground px-1 pt-1 pb-0.5">Groups</div>
                      {filteredGroups.map((group) => (
                        <div
                          key={group.id}
                          className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded-none cursor-pointer text-xs"
                          onClick={() => handleSelectGroup(group.member_ids)}
                        >
                          <span className="font-medium flex-1 truncate">{group.name}</span>
                          <span className="text-[10px] text-muted-foreground">{group.member_ids.length}</span>
                        </div>
                      ))}
                      <div className="border-b my-1" />
                    </>
                  )}
                  {/* Individual Staff */}
                  {filteredStaff.map((staff) => {
                    const isSelected = recipientIds.includes(staff.user_id);
                    return (
                      <div
                        key={staff.user_id}
                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded-none cursor-pointer text-xs"
                        onClick={() => handleToggleRecipient(staff.user_id)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleRecipient(staff.user_id)}
                          className="rounded-none h-3.5 w-3.5"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="truncate">{staff.full_name || staff.email || 'Unknown'}</span>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Right: Subject + message */}
            <div className="flex flex-col p-4 min-h-0 overflow-auto">
          <div className="space-y-4">

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
                maxLength={5000}
                className="rounded-none"
                disabled={isPending}
              />
              <p className={`text-[10px] text-right ${content.length > 4500 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                {content.length.toLocaleString()} / 5,000
              </p>
            </div>

            {/* Save as group prompt (when sending to 2+ recipients) */}
            {showSaveAsGroupPrompt && (
              <div className="space-y-2 p-3 border rounded-none bg-muted/50">
                <Label className="text-[10px] uppercase tracking-wider">Save recipients as a group?</Label>
                <div className="flex gap-2">
                  <Input
                    value={saveAsGroupName}
                    onChange={(e) => setSaveAsGroupName(e.target.value)}
                    placeholder="Group name (optional)"
                    className="rounded-none text-xs flex-1"
                    disabled={isPending}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowSaveAsGroupPrompt(false);
                      setSaveAsGroupName('');
                    }}
                    className="rounded-none text-xs"
                  >
                    Skip
                  </Button>
                </div>
              </div>
            )}

            {/* Options Bar */}
            <div className="flex items-center gap-4 py-2 border-t flex-wrap">
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

              {/* Notify (push) checkbox */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="notify"
                  checked={notify}
                  onCheckedChange={setNotify}
                  disabled={isPending}
                />
                <Label
                  htmlFor="notify"
                  className="text-xs cursor-pointer flex items-center gap-1"
                >
                  <Bell className="h-3 w-3" />
                  Notify (push)
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
                  {scheduledAt ? `Scheduled ${new Date(scheduledAt).toLocaleString()}` : 'Schedule'}
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
            </div>
          </div>

          <DialogFooter className="flex justify-between sm:justify-between border-t px-6 py-3">
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
  );
}
