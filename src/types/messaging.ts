import { AppRole } from './roles';

// =============================================
// DATABASE ROW TYPES
// =============================================

export interface StaffMessage {
  id: string;
  sender_id: string | null;
  sender_name: string | null;
  recipient_ids: string[] | null;
  recipient_departments: string[] | null;
  subject: string | null;
  content: string;
  is_sent: boolean;
  is_urgent: boolean;
  group_id: string | null;
  group_name: string | null;
  thread_id: string | null;
  reply_to_id: string | null;
  scheduled_at: string | null;
  edited_at: string | null;
  created_at: string;
}

export interface StaffMessageRead {
  id: string;
  message_id: string;
  staff_id: string;
  is_archived: boolean;
  read_at: string;
}

export interface StaffMessageReaction {
  id: string;
  message_id: string;
  staff_id: string;
  staff_name: string;
  emoji: string;
  created_at: string;
}

export interface TargetGroup {
  id: string;
  name: string;
  member_ids: string[];
  created_by: string | null;
  description: string | null;
  usage_context: string[];
  created_at: string;
  updated_at: string;
}

/** @deprecated Use TargetGroup instead */
export type StaffMessageGroup = TargetGroup;

export interface StaffMessageDraft {
  id: string;
  staff_id: string;
  subject: string | null;
  content: string | null;
  recipient_staff_ids: string[] | null;
  recipient_departments: string[] | null;
  group_id: string | null;
  is_urgent: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================
// DERIVED TYPES
// =============================================

export interface ConversationParticipant {
  userId: string;
  name: string;
  isGroup: boolean;
}

export interface Conversation {
  key: string; // Unique conversation identifier
  participants: ConversationParticipant[];
  messages: StaffMessage[];
  lastMessage: StaffMessage;
  unreadCount: number;
  hasUnread: boolean;
  isArchived: boolean;
  isGroup: boolean;
  groupId: string | null;
  groupName: string | null;
  threadId: string | null;
}

export interface DisplayMessage extends StaffMessage {
  isRead: boolean;
  reactions: StaffMessageReaction[];
  showTimestamp: boolean; // For 15-min collapsing
  canEdit: boolean; // Within 12-hour window
  canDelete: boolean; // Within 12-hour window
  hasReplies: boolean; // Has thread replies
}

/** Temp message shown optimistically before real message arrives via Realtime */
export interface TempMessage extends StaffMessage {
  _isTemp: true;
}

export interface MessageDeliveryStatus {
  status: 'sending' | 'delivered' | 'read';
  readBy: Array<{ userId: string; name: string; readAt: string }>;
}

// =============================================
// VIEW STATE
// =============================================

export type MessagingView =
  | 'conversations' // Default inbox
  | 'conversation' // Single conversation view
  | 'thread' // Thread view
  | 'drafts' // Drafts list
  | 'scheduled' // Scheduled messages list
  | 'archived' // Archived conversations
  | 'groups'; // Group management

// =============================================
// COMPONENT PROPS
// =============================================

export interface StaffMessagesInboxProps {
  initialMessageId?: string; // For deep-linking
  onMarkRead?: (messageId: string) => void;
}

export interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationKey: string | null;
  /** When called from search result click, messageId is provided for scrolling/highlighting */
  onSelectConversation: (key: string, messageId?: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading?: boolean;
  /** When false (default), filter out archived conversations. When true, show only archived. */
  showArchived?: boolean;
  /** When set, show an Unarchive button for each conversation (e.g. in archived view) */
  onUnarchive?: (conversation: Conversation) => void;
  /** Current user ID for global search (deriving conversation key from message) */
  currentUserId?: string;
}

export interface ConversationViewProps {
  conversation: Conversation;
  currentUserId: string;
  onBack: () => void;
  onSendMessage?: (content: string, replyToId?: string) => void;
  onOpenThread?: (threadId: string) => void;
  /** When set, scroll to and highlight this message on mount */
  highlightMessageId?: string;
}

export interface MessageComposerProps {
  isOpen: boolean;
  onClose: () => void;
  initialRecipientId?: string;
  initialSubject?: string;
  draftId?: string;
}

// =============================================
// ROLE GROUPS
// =============================================

export interface RoleGroup {
  id: string;
  name: string;
  role: AppRole | 'back_of_house'; // Special combined role
  description: string;
}

export const ROLE_GROUPS: RoleGroup[] = [
  {
    id: 'concierge',
    name: 'All Concierge',
    role: 'concierge',
    description: 'All concierge staff members',
  },
  {
    id: 'back_of_house',
    name: 'All Back of House',
    role: 'back_of_house',
    description: 'Spa attendants and floaters',
  },
  {
    id: 'female_spa_attendant',
    name: 'All Female Spa Attendants',
    role: 'female_spa_attendant',
    description: 'All female spa attendants',
  },
  {
    id: 'male_spa_attendant',
    name: 'All Male Spa Attendants',
    role: 'male_spa_attendant',
    description: 'All male spa attendants',
  },
  {
    id: 'floater',
    name: 'All Floaters',
    role: 'floater',
    description: 'All floater staff',
  },
  {
    id: 'cafe',
    name: 'All Cafe',
    role: 'cafe',
    description: 'All cafe staff members',
  },
  {
    id: 'trainer',
    name: 'All Trainers',
    role: 'trainer',
    description: 'All training staff',
  },
  {
    id: 'manager',
    name: 'All Managers',
    role: 'manager',
    description: 'All managers',
  },
  {
    id: 'admin',
    name: 'All Admins',
    role: 'admin',
    description: 'All administrators',
  },
];

// =============================================
// CONSTANTS
// =============================================

export const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉'] as const;

export const EDIT_WINDOW_HOURS = 12;
export const TIMESTAMP_COLLAPSE_MINUTES = 15;

// =============================================
// UTILITY TYPES
// =============================================

export type ReactionEmoji = typeof REACTION_EMOJIS[number];

export interface GroupedReaction {
  emoji: ReactionEmoji;
  count: number;
  userIds: string[];
  userNames: string[];
  hasCurrentUser: boolean;
}
