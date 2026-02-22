import { differenceInMinutes, differenceInHours } from 'date-fns';
import type {
  StaffMessage,
  StaffMessageRead,
  Conversation,
  ConversationParticipant,
  TargetGroup,
  EDIT_WINDOW_HOURS,
  TIMESTAMP_COLLAPSE_MINUTES,
} from '@/types/messaging';

/** Staff list item shape for building participant names */
export interface StaffItemForConversation {
  user_id: string;
  full_name?: string | null;
  email?: string | null;
}

/**
 * Build a synthetic conversation for "new" chats (no messages yet).
 * Used when user selects a recipient or group from NewConversationDialog.
 */
export function buildNewConversation(
  key: string,
  recipientIds: string[],
  currentUserId: string,
  staffList: StaffItemForConversation[],
  options: { groupId?: string | null; groupName?: string | null } = {}
): Conversation {
  const participants: ConversationParticipant[] = recipientIds
    .filter((id) => id !== currentUserId)
    .map((userId) => {
      const staff = staffList.find((s) => s.user_id === userId);
      return {
        userId,
        name: staff?.full_name || staff?.email || 'Unknown',
        isGroup: false,
      };
    });

  const placeholderMessage: StaffMessage = {
    id: `new-${key}`,
    sender_id: null,
    sender_name: null,
    recipient_ids: recipientIds,
    recipient_departments: null,
    subject: null,
    content: '',
    is_sent: false,
    is_urgent: false,
    group_id: options.groupId || null,
    group_name: options.groupName || null,
    thread_id: null,
    reply_to_id: null,
    scheduled_at: null,
    edited_at: null,
    created_at: new Date(0).toISOString(),
  };

  return {
    key,
    participants,
    messages: [],
    lastMessage: placeholderMessage,
    unreadCount: 0,
    hasUnread: false,
    isArchived: false,
    isGroup: !!options.groupId,
    groupId: options.groupId || null,
    groupName: options.groupName || null,
    threadId: null,
  };
}

/**
 * Generate a unique conversation key for grouping messages
 */
export function buildConversationKey(
  message: StaffMessage,
  currentUserId: string
): string {
  // Group messages are identified by group_id
  if (message.group_id) {
    return `group:${message.group_id}`;
  }

  // Thread messages are grouped by thread_id
  if (message.thread_id) {
    return `thread:${message.thread_id}`;
  }

  // For direct messages, create a stable key by sorting participant IDs
  const participants = [
    message.sender_id,
    ...(message.recipient_ids || []),
  ].filter((id): id is string => id !== null);

  const uniqueParticipants = Array.from(new Set(participants));
  const sortedIds = uniqueParticipants.sort();

  return `direct:${sortedIds.join(',')}`;
}

/**
 * Transform flat message array into conversation objects
 */
export function groupMessagesIntoConversations(
  messages: StaffMessage[],
  reads: StaffMessageRead[],
  currentUserId: string
): Conversation[] {
  const conversationMap = new Map<string, Conversation>();
  const readSet = new Set(reads.map((r) => r.message_id));
  const archivedSet = new Set(
    reads.filter((r) => r.is_archived).map((r) => r.message_id)
  );

  // Group messages by conversation key
  messages.forEach((message) => {
    const key = buildConversationKey(message, currentUserId);

    if (!conversationMap.has(key)) {
      // Determine participants
      const participantIds = message.group_id
        ? [] // Group participants fetched separately
        : Array.from(
            new Set(
              [message.sender_id, ...(message.recipient_ids || [])].filter(
                (id): id is string => id !== null && id !== currentUserId
              )
            )
          );

      const participants: ConversationParticipant[] = participantIds.map(
        (id) => ({
          userId: id,
          name: '', // Will be populated by component
          isGroup: false,
        })
      );

      conversationMap.set(key, {
        key,
        participants,
        messages: [],
        lastMessage: message,
        unreadCount: 0,
        hasUnread: false,
        isArchived: archivedSet.has(message.id),
        isGroup: !!message.group_id,
        groupId: message.group_id,
        groupName: message.group_name,
        threadId: message.thread_id,
      });
    }

    const conversation = conversationMap.get(key)!;
    conversation.messages.push(message);

    // Conversation is archived only when ALL messages are archived for current user
    conversation.isArchived =
      conversation.isArchived && archivedSet.has(message.id);

    // Update last message if this is more recent
    if (
      new Date(message.created_at) > new Date(conversation.lastMessage.created_at)
    ) {
      conversation.lastMessage = message;
    }

    // Count unread messages for current user
    if (!readSet.has(message.id) && message.sender_id !== currentUserId) {
      conversation.unreadCount++;
      conversation.hasUnread = true;
    }
  });

  // For group conversations: populate participants from all messages
  conversationMap.forEach((conversation) => {
    if (conversation.isGroup && conversation.messages.length > 0) {
      const allIds = new Set<string>();
      conversation.messages.forEach((m) => {
        if (m.sender_id) allIds.add(m.sender_id);
        (m.recipient_ids || []).forEach((id) => id && allIds.add(id));
      });
      const participantIds = Array.from(allIds).filter(
        (id) => id !== currentUserId
      );
      conversation.participants = participantIds.map((id) => ({
        userId: id,
        name: '',
        isGroup: false,
      }));
    }
    conversation.messages.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  });

  // Convert to array and sort by last message time (most recent first)
  const conversations = Array.from(conversationMap.values());
  conversations.sort(
    (a, b) =>
      new Date(b.lastMessage.created_at).getTime() -
      new Date(a.lastMessage.created_at).getTime()
  );

  return conversations;
}

/**
 * Generate conversation title based on participants and context
 */
export function getConversationTitle(
  conversation: Conversation,
  currentUserName: string,
  targetGroups?: TargetGroup[]
): string {
  if (conversation.isGroup && conversation.groupName) {
    return conversation.groupName;
  }

  // Check if participants match a target group (participants excludes current user, group members may include them)
  if (conversation.participants.length >= 2 && targetGroups && targetGroups.length > 0) {
    const participantIds = new Set(conversation.participants.map((p) => p.userId));
    for (const group of targetGroups) {
      // Remove current user from group members for comparison since participants already excludes them
      const groupMemberIds = new Set(group.member_ids);
      // Check: every participant is in the group, and every group member (that isn't the current user) is a participant
      const groupWithoutCurrent = group.member_ids.filter((id) => !participantIds.has(id));
      const allParticipantsInGroup = [...participantIds].every((id) => groupMemberIds.has(id));
      const unmatchedGroupMembers = groupWithoutCurrent.length;
      // Allow at most 1 unmatched (the current user)
      if (allParticipantsInGroup && unmatchedGroupMembers <= 1) {
        return group.name;
      }
    }
  }

  if (conversation.isGroup && conversation.participants.length > 0) {
    return `Group (${conversation.participants.length} members)`;
  }
  if (conversation.isGroup) {
    return 'Group';
  }

  if (conversation.participants.length === 0) {
    return 'New Conversation';
  }

  if (conversation.participants.length === 1) {
    const name = conversation.participants[0].name || 'Unknown';
    return `You + ${name}`;
  }

  // Multiple participants: show "You + Name, Name, and N others"
  const names = conversation.participants.slice(0, 2).map((p) => p.name);
  const remaining = conversation.participants.length - 2;

  if (remaining > 0) {
    return `You + ${names.join(', ')}, and ${remaining} other${remaining > 1 ? 's' : ''}`;
  }

  return `You + ${names.join(', ')}`;
}

/**
 * Determine which messages should show timestamps (15-min collapsing)
 */
export function collapseTimestamps(messages: StaffMessage[]): Set<string> {
  const showTimestampIds = new Set<string>();

  if (messages.length === 0) return showTimestampIds;

  // Always show first message timestamp
  showTimestampIds.add(messages[0].id);

  for (let i = 1; i < messages.length; i++) {
    const prevMessage = messages[i - 1];
    const currentMessage = messages[i];

    const minutesDiff = differenceInMinutes(
      new Date(currentMessage.created_at),
      new Date(prevMessage.created_at)
    );

    // Show timestamp if more than 15 minutes apart or different sender
    if (
      minutesDiff >= 15 ||
      currentMessage.sender_id !== prevMessage.sender_id
    ) {
      showTimestampIds.add(currentMessage.id);
    }
  }

  return showTimestampIds;
}

/**
 * Check if a message is within the edit window (12 hours)
 */
export function isWithinEditWindow(
  messageTimestamp: string,
  editWindowHours: typeof EDIT_WINDOW_HOURS = 12
): boolean {
  const hoursDiff = differenceInHours(new Date(), new Date(messageTimestamp));
  return hoursDiff < editWindowHours;
}

/**
 * Get message preview text (truncated)
 */
export function getMessagePreview(content: string, maxLength: number = 60): string {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength - 3) + '...';
}

/**
 * Check if user is participant in conversation
 */
export function isParticipant(
  conversation: Conversation,
  userId: string
): boolean {
  return conversation.participants.some((p) => p.userId === userId);
}

/**
 * Filter conversations by search query
 */
export function filterConversationsByQuery(
  conversations: Conversation[],
  query: string
): Conversation[] {
  if (!query.trim()) return conversations;

  const lowerQuery = query.toLowerCase();

  return conversations.filter((conversation) => {
    // Search in title
    const title = getConversationTitle(conversation, '');
    if (title.toLowerCase().includes(lowerQuery)) return true;

    // Search in message content
    return conversation.messages.some((msg) =>
      msg.content.toLowerCase().includes(lowerQuery) ||
      msg.subject?.toLowerCase().includes(lowerQuery)
    );
  });
}
