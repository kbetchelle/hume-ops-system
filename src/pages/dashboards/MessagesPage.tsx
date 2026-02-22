import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StaffMessagesInbox } from '@/components/foh/messages';
import { useIsMobile } from '@/hooks/use-mobile';

export default function MessagesPage() {
  const [searchParams] = useSearchParams();
  const messageId = searchParams.get('messageId');
  const isMobile = useIsMobile();

  return (
    <DashboardLayout title="Messages">
      <div className={isMobile ? 'h-full flex flex-col min-h-0' : 'h-[calc(100vh-4rem)]'}>
        <StaffMessagesInbox
          initialMessageId={messageId || undefined}
        />
      </div>
    </DashboardLayout>
  );
}
