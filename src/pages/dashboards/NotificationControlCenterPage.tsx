import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EventTriggersTab } from "@/components/notifications/EventTriggersTab";
import { NotificationHistoryTab } from "@/components/notifications/NotificationHistoryTab";
import { StaffPushStatusTab } from "@/components/notifications/StaffPushStatusTab";
import { ScheduleSyncTab } from "@/components/notifications/ScheduleSyncTab";
import { AppEventsTab } from "@/components/notifications/AppEventsTab";

export default function NotificationControlCenterPage() {
  return (
    <DashboardLayout title="Notification Control Center">
      <div>
        <Tabs defaultValue="triggers" className="w-full">
          <TabsList className="rounded-none mb-0 w-full">
            <TabsTrigger value="triggers" className="rounded-none">
              Event Triggers
            </TabsTrigger>
            <TabsTrigger value="app-events" className="rounded-none">
              App Events
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
          <TabsContent value="app-events" className="mt-4">
            <AppEventsTab />
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
