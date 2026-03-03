/**
 * Centralized query key factory.
 *
 * Using a shared factory ensures that hooks fetching the same data always
 * produce the same key, so React Query can share the cached result instead
 * of issuing duplicate network requests.
 *
 * Usage:
 *   import { queryKeys } from '@/lib/queryKeys';
 *   queryKey: queryKeys.unread.messages(user.id)
 *
 * Migration: replace inline string arrays with the corresponding factory
 * entry. Existing working hooks can migrate gradually — no behaviour change
 * until the key string itself changes.
 */

export const queryKeys = {
  // -------------------------------------------------------------------------
  // Unread badge counts
  // -------------------------------------------------------------------------
  unread: {
    messages:      (userId: string) => ['unread-message-count', userId] as const,
    notifications: (userId: string) => ['unread-notification-count', userId] as const,
    bugReports:    (userId: string, badgeEnabled: boolean) =>
                     ['unread-bug-report-count', userId, badgeEnabled] as const,
    inbox:         (userId: string) => ['inbox-unread-count', userId] as const,
  },

  // -------------------------------------------------------------------------
  // Staff / profiles
  // -------------------------------------------------------------------------
  staff: {
    all:     () => ['profiles-list'] as const,
    byId:    (userId: string) => ['profile', userId] as const,
    shifts:  (date: string)   => ['staffShifts', date] as const,
    onShift: (userId: string) => ['is-on-shift', userId] as const,
  },

  // -------------------------------------------------------------------------
  // Messaging
  // -------------------------------------------------------------------------
  messages: {
    all:       () => ['staff-messages'] as const,
    reads:     () => ['staff-message-reads'] as const,
    scheduled: () => ['staff-messages-scheduled'] as const,
  },

  // -------------------------------------------------------------------------
  // Announcements
  // -------------------------------------------------------------------------
  announcements: {
    all:     () => ['staff-announcements'] as const,
    manager: () => ['staff-announcements-manager'] as const,
    active:  () => ['staff-announcements-active'] as const,
  },

  // -------------------------------------------------------------------------
  // Notifications
  // -------------------------------------------------------------------------
  notifications: {
    all:     () => ['staff-notifications'] as const,
    history: () => ['notification-history'] as const,
    triggers: () => ['notification-triggers'] as const,
  },

  // -------------------------------------------------------------------------
  // Admin
  // -------------------------------------------------------------------------
  admin: {
    users:       () => ['admin', 'users'] as const,
    userRoles:   (userId: string) => ['userRoles', userId] as const,
  },

  // -------------------------------------------------------------------------
  // Packages
  // -------------------------------------------------------------------------
  packages: {
    all:   () => ['packages'] as const,
    stats: () => ['package-stats'] as const,
  },

  // -------------------------------------------------------------------------
  // Shift reports
  // -------------------------------------------------------------------------
  shiftReports: {
    byDate:    (date: string, shiftType: string) => ['shiftReport', date, shiftType] as const,
    history:   (limit: number)                   => ['shiftReportHistory', limit] as const,
    submitted: (limit: number)                   => ['submittedShiftReports', limit] as const,
  },
} as const;
