import { MessageSquare, Plus, Search, ArchiveRestore, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useStaffList } from '@/hooks/useMessaging';
import { useSearchMessages } from '@/hooks/useMessageSearch';
import { useDebounce } from 'use-debounce';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  getConversationTitle,
  getMessagePreview,
  filterConversationsByQuery,
  buildConversationKey,
} from './utils/conversationBuilder';
import { SwipeableConversation } from './SwipeableConversation';
import type { ConversationListProps, StaffMessage } from '@/types/messaging';
import { useState } from 'react';
import { MessageComposer } from './MessageComposer';

export function ConversationList({
  conversations,
  selectedConversationKey,
  onSelectConversation,
  searchQuery,
  onSearchChange,
  isLoading,
  showArchived = false,
  onUnarchive,
  currentUserId = '',
}: ConversationListProps) {
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const { data: staffList = [] } = useStaffList();
  const isMobile = useIsMobile();
  const [debouncedSearch] = useDebounce(searchQuery, 300);
  const { data: searchResults = [], isLoading: isSearching } = useSearchMessages(debouncedSearch);
  const showSearchResults = searchQuery.trim().length > 0;

  // Filter by archive status
  const archiveFiltered = showArchived
    ? conversations.filter((c) => c.isArchived)
    : conversations.filter((c) => !c.isArchived);

  // Filter conversations by search
  const filteredConversations = filterConversationsByQuery(
    archiveFiltered,
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

  const handleArchive = (conversationKey: string) => {
    // Archive logic will be handled by marking all messages as archived
    // This is a placeholder - actual implementation would use useArchiveConversation hook
    console.log('Archive conversation:', conversationKey);
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

        {/* Global Search Results (when searching) */}
        {showSearchResults ? (
          isSearching ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-none" />
              ))}
            </div>
          ) : searchResults.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              No results found
            </p>
          ) : (
            <div className="space-y-1">
              {searchResults.map((msg: StaffMessage) => {
                const convKey = buildConversationKey(msg, currentUserId);
                const senderName = msg.sender_name || getStaffName(msg.sender_id || '');
                const preview = getMessagePreview(msg.content);

                return (
                  <button
                    key={msg.id}
                    onClick={() => onSelectConversation(convKey, msg.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 text-left transition-colors',
                      'hover:bg-muted/50',
                      selectedConversationKey === convKey && 'bg-muted'
                    )}
                  >
                    <Avatar className="h-8 w-8 rounded-none flex-shrink-0">
                      <AvatarFallback className="text-xs rounded-none">
                        {getInitials(senderName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{senderName}</div>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {msg.subject && (
                          <span className="font-medium">{msg.subject}: </span>
                        )}
                        {preview}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">
                      {format(parseISO(msg.created_at), 'MMM d')}
                    </span>
                  </button>
                );
              })}
            </div>
          )
        ) : isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-none" />
            ))}
          </div>
        ) : conversationsWithNames.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            No messages yet
          </p>
        ) : (
          <div className="space-y-1">
            {conversationsWithNames.map((conversation) => {
              const title = getConversationTitle(conversation, '');
              const preview = getMessagePreview(
                conversation.lastMessage.content
              );
              const isSelected = selectedConversationKey === conversation.key;

              const isUrgent = conversation.lastMessage.is_urgent;
              const memberCount = conversation.isGroup
                ? conversation.participants.length
                : 0;
              const groupSubtitle =
                conversation.isGroup && conversation.groupName
                  ? `${memberCount} member${memberCount !== 1 ? 's' : ''}`
                  : null;

              const conversationContent = (
                <button
                  onClick={() => onSelectConversation(conversation.key)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 text-left transition-colors relative',
                    'hover:bg-muted/50',
                    isSelected && 'bg-muted',
                    conversation.hasUnread && 'bg-primary/5 font-medium',
                    isUrgent && 'ring-2 ring-amber-500 ring-inset'
                  )}
                >
                  {conversation.isGroup ? (
                    <div className="h-8 w-8 rounded-none flex-shrink-0 flex items-center justify-center bg-muted">
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ) : (
                    <Avatar className="h-8 w-8 rounded-none flex-shrink-0">
                      <AvatarFallback className="text-xs rounded-none">
                        {getInitials(title)}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {isUrgent && (
                        <span className="text-amber-500 flex-shrink-0" title="Urgent">
                          ⚠️
                        </span>
                      )}
                      {conversation.hasUnread && (
                        <span className="h-2 w-2 bg-primary rounded-full animate-pulse flex-shrink-0" />
                      )}
                      <span className="text-xs truncate font-medium">
                        {title}
                      </span>
                    </div>
                    {groupSubtitle && (
                      <p className="text-[10px] text-muted-foreground mb-0.5">
                        {groupSubtitle}
                      </p>
                    )}
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
                    {onUnarchive ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-none text-xs h-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUnarchive(conversation);
                        }}
                      >
                        <ArchiveRestore className="h-3 w-3 mr-1" />
                        Unarchive
                      </Button>
                    ) : (
                      <>
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
                      </>
                    )}
                  </div>
                </button>
              );

              // Wrap with SwipeableConversation on mobile
              if (isMobile) {
                return (
                  <SwipeableConversation
                    key={conversation.key}
                    conversation={conversation}
                    onArchive={handleArchive}
                    isSelected={isSelected}
                  >
                    {conversationContent}
                  </SwipeableConversation>
                );
              }

              return <div key={conversation.key}>{conversationContent}</div>;
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
