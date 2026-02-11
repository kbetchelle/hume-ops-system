import { MessageSquare, Plus, Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useStaffList } from '@/hooks/useMessaging';
import {
  getConversationTitle,
  getMessagePreview,
  filterConversationsByQuery,
} from './utils/conversationBuilder';
import type { ConversationListProps } from '@/types/messaging';
import { useState } from 'react';
import { MessageComposer } from './MessageComposer';

export function ConversationList({
  conversations,
  selectedConversationKey,
  onSelectConversation,
  searchQuery,
  onSearchChange,
  isLoading,
}: ConversationListProps) {
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const { data: staffList = [] } = useStaffList();

  // Filter conversations by search
  const filteredConversations = filterConversationsByQuery(
    conversations,
    searchQuery
  );

  // Get staff name by ID
  const getStaffName = (userId: string) => {
    const staff = staffList.find((s) => s.user_id === userId);
    return staff?.full_name || staff?.email || 'Unknown';
  };

  // Populate participant names in conversations
  const conversationsWithNames = filteredConversations.map((conv) => ({
    ...conv,
    participants: conv.participants.map((p) => ({
      ...p,
      name: getStaffName(p.userId),
    })),
  }));

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider">
            <MessageSquare className="h-4 w-4" />
            Messages
          </CardTitle>
          <Button
            size="sm"
            onClick={() => setIsComposeOpen(true)}
            className="rounded-none"
          >
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 rounded-none text-xs"
          />
        </div>

        {/* Conversation List */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-none" />
            ))}
          </div>
        ) : conversationsWithNames.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            {searchQuery ? 'No messages found' : 'No messages yet'}
          </p>
        ) : (
          <div className="space-y-1">
            {conversationsWithNames.map((conversation) => {
              const title = getConversationTitle(conversation, '');
              const preview = getMessagePreview(
                conversation.lastMessage.content
              );
              const isSelected = selectedConversationKey === conversation.key;

              return (
                <button
                  key={conversation.key}
                  onClick={() => onSelectConversation(conversation.key)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 text-left transition-colors',
                    'hover:bg-muted/50',
                    isSelected && 'bg-muted',
                    conversation.hasUnread && 'bg-primary/5 font-medium',
                    conversation.lastMessage.is_urgent &&
                      'border-l-2 border-l-destructive'
                  )}
                >
                  <Avatar className="h-8 w-8 rounded-none flex-shrink-0">
                    <AvatarFallback className="text-xs rounded-none">
                      {conversation.isGroup
                        ? '👥'
                        : getInitials(title)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {conversation.hasUnread && (
                        <span className="h-2 w-2 bg-primary rounded-full animate-pulse flex-shrink-0" />
                      )}
                      <span className="text-xs truncate font-medium">
                        {title}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {conversation.lastMessage.subject && (
                        <span className="font-medium">
                          {conversation.lastMessage.subject}:{' '}
                        </span>
                      )}
                      {preview}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[10px] text-muted-foreground">
                      {format(
                        parseISO(conversation.lastMessage.created_at),
                        'MMM d'
                      )}
                    </span>
                    {conversation.unreadCount > 0 && (
                      <Badge
                        variant="default"
                        className="rounded-none text-[10px] px-1.5 py-0 h-4 min-w-[16px] flex items-center justify-center animate-pulse"
                      >
                        {conversation.unreadCount > 99
                          ? '99+'
                          : conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>

      <MessageComposer
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
      />
    </>
  );
}
