import { useState } from 'react';
import { Send } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStaffList, useSendMessage } from '@/hooks/useMessaging';
import type { MessageComposerProps } from '@/types/messaging';

export function MessageComposer({
  isOpen,
  onClose,
  initialRecipientId,
  initialSubject,
}: MessageComposerProps) {
  const [recipientId, setRecipientId] = useState(initialRecipientId || '');
  const [subject, setSubject] = useState(initialSubject || '');
  const [content, setContent] = useState('');

  const { data: staffList = [] } = useStaffList();
  const { mutate: sendMessage, isPending } = useSendMessage();

  const handleSend = () => {
    if (!recipientId || !content.trim()) return;

    sendMessage(
      {
        recipientIds: [recipientId],
        subject: subject || undefined,
        content: content.trim(),
      },
      {
        onSuccess: () => {
          setRecipientId('');
          setSubject('');
          setContent('');
          onClose();
        },
      }
    );
  };

  const handleClose = () => {
    if (!isPending) {
      setRecipientId('');
      setSubject('');
      setContent('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="rounded-none max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-sm uppercase tracking-wider">
            New Message
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipient */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-wider">To</Label>
            <Select value={recipientId} onValueChange={setRecipientId}>
              <SelectTrigger className="rounded-none">
                <SelectValue placeholder="Select recipient..." />
              </SelectTrigger>
              <SelectContent>
                {staffList.map((staff) => (
                  <SelectItem key={staff.user_id} value={staff.user_id}>
                    {staff.full_name || staff.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-wider">
              Message
            </Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your message..."
              rows={8}
              className="rounded-none"
            />
          </div>
        </div>

        <DialogFooter>
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
            disabled={!recipientId || !content.trim() || isPending}
            className="rounded-none"
          >
            <Send className="h-4 w-4 mr-2" />
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
