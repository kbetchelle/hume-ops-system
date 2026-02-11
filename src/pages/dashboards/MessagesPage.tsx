import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StaffMessagesInbox } from '@/components/foh/messages';

export default function MessagesPage() {
  const [searchParams] = useSearchParams();
  const messageId = searchParams.get('messageId');

  return (
    <DashboardLayout title="Messages">
      <div className="h-[calc(100vh-4rem)] p-4 md:p-8">
        <StaffMessagesInbox
          initialMessageId={messageId || undefined}
        />
      </div>
    </DashboardLayout>
  );
}
