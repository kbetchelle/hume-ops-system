/**
 * Barrel re-export for backward compatibility.
 *
 * The actual hooks live in:
 *   - ./messaging/useStaffMessages.ts    (queries)
 *   - ./messaging/useMessageMutations.ts (mutations)
 *   - ./messaging/useMessagingRealtime.ts (realtime subscriptions)
 */

export { useStaffMessages, useMessageReads, useStaffList } from './messaging/useStaffMessages';
export { useMarkMessageRead, useSendMessage, useEditMessage, useDeleteMessage, useArchiveConversation } from './messaging/useMessageMutations';
export { useMessagingRealtime } from './messaging/useMessagingRealtime';
