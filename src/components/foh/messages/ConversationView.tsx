import { useState, useRef, useEffect } from 'react';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { ArrowLeft, Send, Reply, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useStaffList, useSendMessage, useMarkMessageRead, useEditMessage, useDeleteMessage, useMessageReads } from '@/hooks/useMessaging';
import { useReactions, useToggleReaction, useReactionsRealtime, groupReactions } from '@/hooks/useMessageReactions';
import { getConversationTitle, collapseTimestamps, isWithinEditWindow } from './utils/conversationBuilder';
import { ReactionPills } from './ReactionPills';
import { ReactionPicker } from './ReactionPicker';
import { ReadReceipt } from './ReadReceipt';
import type { ConversationViewProps } from '@/types/messaging';

export function ConversationView({
  conversation,
  currentUserId,
  onBack,
}: ConversationViewProps) {
  const [messageInput, setMessageInput] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: staffList = [] } = useStaffList();
  const { mutate: sendMessage, isPending: isSending } = useSendMessage();
  const { mutate: markRead } = useMarkMessageRead();
  const { mutate: editMessage } = useEditMessage();
  const { mutate: deleteMessage } = useDeleteMessage();
  const { mutate: toggleReaction } = useToggleReaction();
  const { data: allReads = [] } = useMessageReads();

  const title = getConversationTitle(conversation, '');
  const timestampVisibility = collapseTimestamps(conversation.messages);

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

  // Format date divider
  const formatDateDivider = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages]);

  // Mark unread messages as read
  useEffect(() => {
    // Create a set of already-read message IDs for efficient lookup
    const readMessageIds = new Set(allReads.map((r) => r.message_id));

    // Find messages that are from others and not yet marked as read
    const unreadMessages = conversation.messages.filter(
      (msg) => msg.sender_id !== currentUserId && !readMessageIds.has(msg.id)
    );

    unreadMessages.forEach((msg) => {
      markRead(msg.id);
    });
  }, [conversation.messages, currentUserId, markRead, allReads]);

  const handleSend = () => {
    if (!messageInput.trim() || isSending) return;

    const recipientIds = conversation.participants.map((p) => p.userId);

    sendMessage(
      {
        recipientIds,
        content: messageInput.trim(),
        subject: conversation.lastMessage.subject || undefined,
        groupId: conversation.groupId || undefined,
        groupName: conversation.groupName || undefined,
        threadId: conversation.threadId || undefined,
      },
      {
        onSuccess: () => {
          setMessageInput('');
          scrollToBottom();
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  const messagesByDate: { date: string; messages: typeof conversation.messages }[] =
    [];
  let currentDate = '';

  conversation.messages.forEach((msg) => {
    const msgDate = format(parseISO(msg.created_at), 'yyyy-MM-dd');
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      messagesByDate.push({ date: msgDate, messages: [msg] });
    } else {
      messagesByDate[messagesByDate.length - 1].messages.push(msg);
    }
  });

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

          <Avatar className="h-8 w-8 rounded-none">
            <AvatarFallback className="text-xs rounded-none">
              {conversation.isGroup ? '👥' : getInitials(title)}
            </AvatarFallback>
          </Avatar>

          <CardTitle className="text-xs font-medium uppercase tracking-wider flex-1">
            {title}
          </CardTitle>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messagesByDate.map((dateGroup) => (
          <div key={dateGroup.date} className="space-y-4">
            {/* Date Divider */}
            <div className="flex items-center justify-center">
              <div className="bg-muted px-3 py-1 rounded-full">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {formatDateDivider(dateGroup.messages[0].created_at)}
                </span>
              </div>
            </div>

            {/* Messages for this date */}
            {dateGroup.messages.map((message) => {
              const isSelf = message.sender_id === currentUserId;
              const senderName = getStaffName(message.sender_id || '');
              const showTimestamp = timestampVisibility.has(message.id);
              const canEdit = isSelf && isWithinEditWindow(message.created_at);
              const canDelete = isSelf && isWithinEditWindow(message.created_at);
              const isEditing = editingMessageId === message.id;

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isSelf={isSelf}
                  senderName={senderName}
                  getInitials={getInitials}
                  showTimestamp={showTimestamp}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  isEditing={isEditing}
                  editingContent={editingContent}
                  currentUserId={currentUserId}
                  allReads={allReads}
                  staffList={staffList}
                  onStartEdit={(content) => {
                    setEditingMessageId(message.id);
                    setEditingContent(content);
                  }}
                  onSaveEdit={() => {
                    editMessage(
                      { messageId: message.id, content: editingContent },
                      {
                        onSuccess: () => {
                          setEditingMessageId(null);
                          setEditingContent('');
                        },
                      }
                    );
                  }}
                  onCancelEdit={() => {
                    setEditingMessageId(null);
                    setEditingContent('');
                  }}
                  onDelete={() => deleteMessage(message.id)}
                  onToggleReaction={toggleReaction}
                  setEditingContent={setEditingContent}
                />
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            placeholder="Type a message..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            className="rounded-none text-xs resize-none"
            disabled={isSending}
          />
          <Button
            onClick={handleSend}
            disabled={!messageInput.trim() || isSending}
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

// Separate component for message bubble with reactions and actions
function MessageBubble({
  message,
  isSelf,
  senderName,
  getInitials,
  showTimestamp,
  canEdit,
  canDelete,
  isEditing,
  editingContent,
  currentUserId,
  allReads,
  staffList,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onToggleReaction,
  setEditingContent,
}: any) {
  const { data: reactions = [] } = useReactions(message.id);
  useReactionsRealtime(message.id);

  const groupedReactions = groupReactions(reactions, currentUserId);

  const staffNames = staffList.reduce((acc: Record<string, string>, staff: any) => {
    acc[staff.user_id] = staff.full_name || staff.email || 'Unknown';
    return acc;
  }, {});

  return (
    <div
      className={cn('flex gap-2 group', isSelf ? 'justify-end' : 'justify-start')}
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
          <div className="relative">
            <div
              className={cn(
                'px-3 py-2 rounded-lg',
                isSelf ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}
            >
              {message.subject && (
                <p className="text-xs font-medium mb-1">{message.subject}</p>
              )}
              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    className="rounded-none text-xs"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={onSaveEdit}
                      className="rounded-none text-[10px]"
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onCancelEdit}
                      className="rounded-none text-[10px]"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-xs whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                  {message.edited_at && (
                    <span className="text-[9px] opacity-70 italic mt-1 block">
                      Edited
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Actions menu */}
            {!isEditing && (canEdit || canDelete) && (
              <div className="absolute -right-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-none h-6 w-6 p-0"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-none">
                    {canEdit && (
                      <DropdownMenuItem
                        onClick={() => onStartEdit(message.content)}
                        className="text-xs"
                      >
                        <Pencil className="h-3 w-3 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {canDelete && (
                      <DropdownMenuItem
                        onClick={onDelete}
                        className="text-xs text-destructive"
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Reactions */}
          {!isEditing && (
            <div className="flex items-center gap-2">
              <ReactionPills
                reactions={groupedReactions}
                onToggle={(emoji) =>
                  onToggleReaction({ messageId: message.id, emoji })
                }
                currentUserId={currentUserId}
              />
              <ReactionPicker
                onSelect={(emoji) =>
                  onToggleReaction({ messageId: message.id, emoji })
                }
              />
            </div>
          )}
        </div>

        {showTimestamp && (
          <div className="flex items-center gap-2 px-1">
            <span className="text-[10px] text-muted-foreground">
              {format(parseISO(message.created_at), 'h:mm a')}
            </span>
            {isSelf && (
              <ReadReceipt
                message={message}
                reads={allReads}
                staffNames={staffNames}
                currentUserId={currentUserId}
              />
            )}
          </div>
        )}
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
