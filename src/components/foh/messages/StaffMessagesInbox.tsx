import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import {
  useStaffMessages,
  useMessageReads,
  useMessagingRealtime,
} from '@/hooks/useMessaging';
import { groupMessagesIntoConversations, buildConversationKey } from './utils/conversationBuilder';
import { ConversationList } from './ConversationList';
import { ConversationView } from './ConversationView';
import type { MessagingView, StaffMessagesInboxProps } from '@/types/messaging';

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

  // Data queries
  const { data: messages = [], isLoading: messagesLoading } = useStaffMessages();
  const { data: reads = [], isLoading: readsLoading } = useMessageReads();

  // Realtime subscriptions
  useMessagingRealtime();

  // Build conversations
  const conversations = groupMessagesIntoConversations(
    messages,
    reads,
    user?.id || ''
  );

  // Filter out archived conversations for main view
  const activeConversations = conversations.filter((c) => !c.isArchived);

  // Find selected conversation
  const selectedConversation = selectedConversationKey
    ? conversations.find((c) => c.key === selectedConversationKey)
    : null;

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
        setView('conversation');
        if (onMarkRead) {
          onMarkRead(initialMessageId);
        }
      }
    }
  }, [initialMessageId, messages, user?.id, onMarkRead]);

  const handleSelectConversation = (key: string) => {
    setSelectedConversationKey(key);
    setView('conversation');
  };

  const handleBack = () => {
    setSelectedConversationKey(null);
    setView('conversations');
  };

  const isLoading = messagesLoading || readsLoading;

  // Render based on view
  if (view === 'conversation' && selectedConversation) {
    return (
      <ConversationView
        conversation={selectedConversation}
        currentUserId={user?.id || ''}
        onBack={handleBack}
      />
    );
  }

  // Default: conversations list
  return (
    <Card className="rounded-none border h-full">
      <ConversationList
        conversations={activeConversations}
        selectedConversationKey={selectedConversationKey}
        onSelectConversation={handleSelectConversation}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isLoading={isLoading}
      />
    </Card>
  );
}
