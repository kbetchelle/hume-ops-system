import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EventDrinksView } from "@/components/cafe/EventDrinksView";

export default function EventDrinksPage() {
  return (
    <DashboardLayout title="Event Drinks">
      <EventDrinksView />
    </DashboardLayout>
  );
}
