import { useState, useRef, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, Send } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useStaffList, useSendMessage } from '@/hooks/useMessaging';
import { useReactions, useToggleReaction, useReactionsRealtime, groupReactions } from '@/hooks/useMessageReactions';
import { ReactionPills } from './ReactionPills';
import { ReactionPicker } from './ReactionPicker';
import type { StaffMessage } from '@/types/messaging';

interface MessageThreadProps {
  parentMessage: StaffMessage;
  threadMessages: StaffMessage[];
  currentUserId: string;
  onBack: () => void;
}

export function MessageThread({
  parentMessage,
  threadMessages,
  currentUserId,
  onBack,
}: MessageThreadProps) {
  const [replyInput, setReplyInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: staffList = [] } = useStaffList();
  const { mutate: sendMessage, isPending: isSending } = useSendMessage();
  const { mutate: toggleReaction } = useToggleReaction();

  // Get staff name by ID
  const getStaffName = (userId: string) => {
    const staff = staffList.find((s) => s.user_id === userId);
    return staff?.full_name || staff?.email || 'Unknown';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [threadMessages]);

  const handleSendReply = () => {
    if (!replyInput.trim() || isSending) return;

    sendMessage(
      {
        recipientIds: parentMessage.recipient_ids || [],
        content: replyInput.trim(),
        threadId: parentMessage.thread_id || parentMessage.id,
        replyToId: parentMessage.id,
      },
      {
        onSuccess: () => {
          setReplyInput('');
          scrollToBottom();
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  const allMessages = [parentMessage, ...threadMessages];

  return (
    <Card className="rounded-none border h-full flex flex-col">
      {/* Header */}
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="rounded-none"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <CardTitle className="text-xs font-medium uppercase tracking-wider flex-1">
            Thread
            <Badge variant="secondary" className="ml-2 rounded-none text-[10px]">
              {allMessages.length} {allMessages.length === 1 ? 'message' : 'messages'}
            </Badge>
          </CardTitle>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {allMessages.map((message) => {
          const isSelf = message.sender_id === currentUserId;
          const senderName = getStaffName(message.sender_id || '');

          return (
            <MessageWithReactions
              key={message.id}
              message={message}
              isSelf={isSelf}
              senderName={senderName}
              getInitials={getInitials}
              currentUserId={currentUserId}
              toggleReaction={toggleReaction}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Reply Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            placeholder="Reply to thread..."
            value={replyInput}
            onChange={(e) => setReplyInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            className="rounded-none text-xs resize-none"
            disabled={isSending}
          />
          <Button
            onClick={handleSendReply}
            disabled={!replyInput.trim() || isSending}
            className="rounded-none self-end"
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Separate component to handle reactions per message
function MessageWithReactions({
  message,
  isSelf,
  senderName,
  getInitials,
  currentUserId,
  toggleReaction,
}: {
  message: StaffMessage;
  isSelf: boolean;
  senderName: string;
  getInitials: (name: string) => string;
  currentUserId: string;
  toggleReaction: any;
}) {
  const { data: reactions = [] } = useReactions(message.id);
  useReactionsRealtime(message.id);

  const groupedReactions = groupReactions(reactions, currentUserId);

  return (
    <div
      className={cn('flex gap-2', isSelf ? 'justify-end' : 'justify-start')}
    >
      {!isSelf && (
        <Avatar className="h-6 w-6 rounded-none flex-shrink-0">
          <AvatarFallback className="text-[10px] rounded-none">
            {getInitials(senderName)}
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn('flex flex-col gap-1 max-w-[70%]', isSelf && 'items-end')}
      >
        {!isSelf && (
          <span className="text-[10px] text-muted-foreground px-1">
            {senderName}
          </span>
        )}

        <div className="space-y-1">
          <div
            className={cn(
              'px-3 py-2 rounded-lg',
              isSelf ? 'bg-primary text-primary-foreground' : 'bg-muted'
            )}
          >
            <p className="text-xs whitespace-pre-wrap break-words">
              {message.content}
            </p>
            {message.edited_at && (
              <span className="text-[9px] opacity-70 italic mt-1 block">
                Edited
              </span>
            )}
          </div>

          {/* Reactions */}
          <div className="flex items-center gap-2">
            <ReactionPills
              reactions={groupedReactions}
              onToggle={(emoji) => toggleReaction({ messageId: message.id, emoji })}
              currentUserId={currentUserId}
            />
            <ReactionPicker
              onSelect={(emoji) => toggleReaction({ messageId: message.id, emoji })}
            />
          </div>
        </div>

        <span className="text-[10px] text-muted-foreground px-1">
          {format(parseISO(message.created_at), 'h:mm a')}
        </span>
      </div>

      {isSelf && (
        <Avatar className="h-6 w-6 rounded-none flex-shrink-0">
          <AvatarFallback className="text-[10px] rounded-none">
            {getInitials(senderName)}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
