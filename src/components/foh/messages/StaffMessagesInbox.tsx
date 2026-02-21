import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import {
  useStaffMessages,
  useMessageReads,
  useMessagingRealtime,
  useStaffList,
  useSendMessage,
  useDeleteMessage,
  useScheduledMessages,
  useArchiveConversation,
} from '@/hooks/useMessaging';
import { useDrafts, useDeleteDraft } from '@/hooks/useMessageDrafts';
import { useTargetGroups } from '@/hooks/useTargetGroups';
import {
  groupMessagesIntoConversations,
  buildConversationKey,
  buildNewConversation,
} from './utils/conversationBuilder';
import { ConversationList } from './ConversationList';
import { ConversationView } from './ConversationView';
import { MessageComposer } from './MessageComposer';
import { MessagesOptionsMenu } from './MessagesOptionsMenu';
import { GroupDialogs } from './GroupDialogs';
import { NewConversationDialog, type NewConversationSelection } from './NewConversationDialog';
import { format } from 'date-fns';
import type { MessagingView, StaffMessagesInboxProps, TargetGroup, Conversation, StaffMessageDraft } from '@/types/messaging';

export function StaffMessagesInbox({
  initialMessageId,
  onMarkRead,
}: StaffMessagesInboxProps = {}) {
  const { user } = useAuth();
  const [view, setView] = useState<MessagingView>('conversations');
  const [selectedConversationKey, setSelectedConversationKey] = useState<
    string | null
  >(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showComposer, setShowComposer] = useState(false);
  const [draftToEdit, setDraftToEdit] = useState<string | undefined>(undefined);
  const [groupDialogMode, setGroupDialogMode] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<TargetGroup | undefined>(undefined);
  const [newConversationDialogOpen, setNewConversationDialogOpen] = useState(false);
  const [newConversation, setNewConversation] = useState<Conversation | null>(null);
  const [highlightMessageId, setHighlightMessageId] = useState<string | undefined>(undefined);

  // Data queries
  const { data: messages = [], isLoading: messagesLoading } = useStaffMessages();
  const { data: reads = [], isLoading: readsLoading } = useMessageReads();
  const { data: scheduledMessages = [] } = useScheduledMessages();
  const { data: drafts = [] } = useDrafts();
  const { data: customGroups = [] } = useTargetGroups();
  const { data: staffList = [] } = useStaffList();
  const { mutate: deleteDraft } = useDeleteDraft();
  const { mutate: sendMessage } = useSendMessage();
  const { mutate: deleteMessage } = useDeleteMessage();
  const { mutate: archiveConversation } = useArchiveConversation();

  // Realtime subscriptions
  useMessagingRealtime();

  // Build conversations
  const conversations = groupMessagesIntoConversations(
    messages,
    reads,
    user?.id || ''
  );

  // Filter based on view (ConversationList also filters by showArchived)
  const archivedConversations = conversations.filter((c) => c.isArchived);

  // Find selected conversation (real from messages or synthetic new conversation)
  const selectedConversation =
    selectedConversationKey
      ? conversations.find((c) => c.key === selectedConversationKey) ??
        newConversation
      : null;

  const handleNewConversationSelect = (selection: NewConversationSelection) => {
    const currentUserId = user?.id || '';
    const key =
      selection.type === 'group' && selection.groupId
        ? `group:${selection.groupId}`
        : `direct:${[currentUserId, ...selection.recipientIds].filter(Boolean).sort().join(',')}`;
    const conv = buildNewConversation(
      key,
      selection.recipientIds,
      currentUserId,
      staffList,
      { groupId: selection.groupId ?? null, groupName: selection.groupName ?? null }
    );
    setNewConversation(conv);
    setSelectedConversationKey(key);
    setView('conversation');
  };

  const handleBack = () => {
    setSelectedConversationKey(null);
    setNewConversation(null);
    setHighlightMessageId(undefined);
    setView('conversations');
  };

  // Handle deep-linking to a specific message
  useEffect(() => {
    if (initialMessageId && messages.length > 0) {
      const message = messages.find((m) => m.id === initialMessageId);
      if (message) {
        const conversationKey = buildConversationKey(
          message,
          user?.id || ''
        );
        setSelectedConversationKey(conversationKey);
        setHighlightMessageId(initialMessageId);
        setView('conversation');
        if (onMarkRead) {
          onMarkRead(initialMessageId);
        }
      }
    }
  }, [initialMessageId, messages, user?.id, onMarkRead]);

  const handleSelectConversation = (key: string, messageId?: string) => {
    setSelectedConversationKey(key);
    setNewConversation(null); // clear synthetic when selecting real conversation
    setHighlightMessageId(messageId);
    setView('conversation');
  };

  const handleViewChange = (newView: 'drafts' | 'scheduled' | 'archived' | 'groups') => {
    setView(newView);
    setSelectedConversationKey(null);
  };

  const handleNewMessage = () => {
    setDraftToEdit(undefined);
    setShowComposer(true);
  };

  const handleEditDraft = (draftId: string) => {
    setDraftToEdit(draftId);
    setShowComposer(true);
  };

  const handleDeleteDraft = (draftId: string) => {
    deleteDraft(draftId);
  };

  const handleSendDraftNow = (draft: StaffMessageDraft) => {
    if (!draft.recipient_staff_ids?.length || !draft.content?.trim()) return;
    const group = draft.group_id
      ? customGroups.find((g) => g.id === draft.group_id)
      : undefined;
    sendMessage(
      {
        recipientIds: draft.recipient_staff_ids,
        subject: draft.subject || undefined,
        content: draft.content.trim(),
        isUrgent: draft.is_urgent,
        groupId: draft.group_id || undefined,
        groupName: group?.name,
      },
      {
        onSuccess: () => {
          deleteDraft(draft.id);
        },
      }
    );
  };

  const handleCreateGroup = () => {
    setGroupDialogMode('create');
    setSelectedGroup(undefined);
  };

  const handleEditGroup = (group: TargetGroup) => {
    setGroupDialogMode('edit');
    setSelectedGroup(group);
  };

  const handleDeleteGroup = (group: TargetGroup) => {
    setGroupDialogMode('delete');
    setSelectedGroup(group);
  };

  const handleUnarchive = (conversation: Conversation) => {
    const messageIds = conversation.messages.map((m) => m.id);
    if (messageIds.length > 0) {
      archiveConversation({ messageIds, isArchived: false });
    }
  };

  const isLoading = messagesLoading || readsLoading;

  // Render based on view
  if (view === 'conversation' && selectedConversation) {
    return (
      <ConversationView
        conversation={selectedConversation}
        currentUserId={user?.id || ''}
        onBack={handleBack}
        highlightMessageId={highlightMessageId}
      />
    );
  }

  // Drafts view
  if (view === 'drafts') {
    return (
      <>
        <Card className="rounded-none border h-full">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  className="rounded-none h-8 w-8"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-sm uppercase tracking-wider">
                  Drafts
                </CardTitle>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={handleNewMessage}
                className="rounded-none"
              >
                <Plus className="h-4 w-4 mr-2" />
                New
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-200px)]">
              {drafts.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <div className="text-center">
                    <div className="text-sm">No drafts</div>
                    <div className="text-xs mt-1">Your saved drafts will appear here</div>
                  </div>
                </div>
              ) : (
                <div className="divide-y">
                  {drafts.map((draft) => (
                    <div
                      key={draft.id}
                      className="p-4 hover:bg-accent"
                    >
                      <div
                        className="flex items-start justify-between gap-2 cursor-pointer"
                        onClick={() => handleEditDraft(draft.id)}
                      >
                        <div className="flex-1 min-w-0">
                          {draft.subject && (
                            <div className="text-sm font-medium truncate">
                              {draft.subject}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {draft.content || 'No content'}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] text-muted-foreground">
                              {format(new Date(draft.updated_at), 'MMM d, h:mm a')}
                            </span>
                            {draft.recipient_staff_ids && draft.recipient_staff_ids.length > 0 && (
                              <span className="text-[10px] text-muted-foreground">
                                To: {draft.recipient_staff_ids.length} recipient{draft.recipient_staff_ids.length !== 1 ? 's' : ''}
                              </span>
                            )}
                            {draft.is_urgent && (
                              <Badge variant="destructive" className="rounded-none text-[10px]">
                                Urgent
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendDraftNow(draft)}
                            disabled={!draft.recipient_staff_ids?.length || !draft.content?.trim()}
                            className="rounded-none text-xs"
                          >
                            Send Now
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteDraft(draft.id)}
                            className="rounded-none h-8 w-8"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
        <MessageComposer
          isOpen={showComposer}
          onClose={() => {
            setShowComposer(false);
            setDraftToEdit(undefined);
          }}
          draftId={draftToEdit}
        />
      </>
    );
  }

  // Scheduled view
  if (view === 'scheduled') {
    return (
      <Card className="rounded-none border h-full">
        <CardHeader className="border-b">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="rounded-none h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-sm uppercase tracking-wider">
              Scheduled Messages
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-200px)]">
            {scheduledMessages.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <div className="text-sm">No scheduled messages</div>
                  <div className="text-xs mt-1">Messages scheduled for later will appear here</div>
                </div>
              </div>
            ) : (
              <div className="divide-y">
                {scheduledMessages.map((msg) => (
                  <div key={msg.id} className="p-4 flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">
                        {msg.subject || 'No subject'}
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {msg.content}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="rounded-none text-[10px]">
                          Sends {format(new Date(msg.scheduled_at!), 'MMM d, h:mm a')}
                        </Badge>
                        {msg.is_urgent && (
                          <Badge variant="destructive" className="rounded-none text-[10px]">
                            Urgent
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMessage(msg.id)}
                      className="rounded-none text-xs text-destructive"
                    >
                      Cancel
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  // Archived view
  if (view === 'archived') {
    return (
      <Card className="rounded-none border h-full">
        <CardHeader className="border-b">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="rounded-none h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-sm uppercase tracking-wider">
              Archived Conversations
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ConversationList
            conversations={conversations}
            selectedConversationKey={selectedConversationKey}
            onSelectConversation={handleSelectConversation}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            isLoading={isLoading}
            showArchived={true}
            onUnarchive={handleUnarchive}
            currentUserId={user?.id || ''}
          />
        </CardContent>
      </Card>
    );
  }

  // Groups management view
  if (view === 'groups') {
    return (
      <>
        <Card className="rounded-none border h-full">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  className="rounded-none h-8 w-8"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-sm uppercase tracking-wider">
                  Manage Groups
                </CardTitle>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={handleCreateGroup}
                className="rounded-none"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-200px)]">
              {customGroups.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <div className="text-center">
                    <div className="text-sm">No custom groups</div>
                    <div className="text-xs mt-1">Create groups to message multiple people</div>
                  </div>
                </div>
              ) : (
                <div className="divide-y">
                  {customGroups.map((group) => (
                    <div key={group.id} className="p-4 hover:bg-accent">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="text-sm font-medium">{group.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {group.member_ids.length} members
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditGroup(group)}
                            className="rounded-none h-8 w-8"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteGroup(group)}
                            className="rounded-none h-8 w-8"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
        <GroupDialogs
          mode={groupDialogMode}
          group={selectedGroup}
          onClose={() => {
            setGroupDialogMode(null);
            setSelectedGroup(undefined);
          }}
        />
      </>
    );
  }

  // Default: conversations list
  return (
    <>
      <Card className="rounded-none border h-full">
        <CardHeader className="border-b-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm uppercase tracking-wider">
              Messages
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleNewMessage}
                className="rounded-none"
              >
                <Plus className="h-4 w-4 mr-2" />
                New
              </Button>
              <MessagesOptionsMenu
                onViewChange={handleViewChange}
                archivedCount={archivedConversations.length}
                scheduledCount={scheduledMessages.length}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ConversationList
            conversations={conversations}
            selectedConversationKey={selectedConversationKey}
            onSelectConversation={handleSelectConversation}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            isLoading={isLoading}
            showArchived={false}
            currentUserId={user?.id || ''}
          />
        </CardContent>
      </Card>
      <MessageComposer
        isOpen={showComposer}
        onClose={() => {
          setShowComposer(false);
          setDraftToEdit(undefined);
        }}
        draftId={draftToEdit}
      />
      <NewConversationDialog
        isOpen={newConversationDialogOpen}
        onClose={() => setNewConversationDialogOpen(false)}
        onSelect={handleNewConversationSelect}
      />
    </>
  );
}
