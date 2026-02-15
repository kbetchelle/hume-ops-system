/**
 * Maps a notification type to the appropriate dashboard route for deep-linking.
 */
export function getNotificationRoute(
  type: string,
  data: Record<string, unknown> | null
): string {
  const routes: Record<string, string> = {
    qa_answered: '/dashboard/inbox',
    qa_new_question: '/dashboard/inbox',
    resource_outdated: '/dashboard/inbox',
    announcement: '/dashboard/communications',
    message: data?.messageId 
      ? `/dashboard/messages?messageId=${data.messageId}` 
      : '/dashboard/messages',
    bug_report_update: '/dashboard/bug-reports',
    member_alert: '/dashboard/members/all-clients',
    class_turnover: '/dashboard/class-schedule',
    mat_cleaning: '/dashboard/my-checklists',
    package_arrived: data?.packageId
      ? `/dashboard/my-packages?packageId=${data.packageId}`
      : '/dashboard/my-packages',
  };

  return routes[type] || '/dashboard/notifications';
}
