import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EventTriggersTab } from "@/components/notifications/EventTriggersTab";
import { NotificationHistoryTab } from "@/components/notifications/NotificationHistoryTab";
import { StaffPushStatusTab } from "@/components/notifications/StaffPushStatusTab";
import { ScheduleSyncTab } from "@/components/notifications/ScheduleSyncTab";

export default function NotificationControlCenterPage() {
  return (
    <DashboardLayout title="Notification Control Center">
      <div className="p-6 md:p-8">
        <Tabs defaultValue="triggers" className="w-full">
          <TabsList className="rounded-none mb-4">
            <TabsTrigger value="triggers" className="rounded-none">
              Event Triggers
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-none">
              Notification History
            </TabsTrigger>
            <TabsTrigger value="push-status" className="rounded-none">
              Staff Push Status
            </TabsTrigger>
            <TabsTrigger value="schedule-sync" className="rounded-none">
              Schedule Sync
            </TabsTrigger>
          </TabsList>
          <TabsContent value="triggers" className="mt-4">
            <EventTriggersTab />
          </TabsContent>
          <TabsContent value="history" className="mt-4">
            <NotificationHistoryTab />
          </TabsContent>
          <TabsContent value="push-status" className="mt-4">
            <StaffPushStatusTab />
          </TabsContent>
          <TabsContent value="schedule-sync" className="mt-4">
            <ScheduleSyncTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
