import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { ConciergeSidebar, type ConciergeView } from "@/components/concierge/ConciergeSidebar";
import { ConciergeBottomNav } from "@/components/concierge/ConciergeBottomNav";
import { ConciergeHeader } from "@/components/concierge/ConciergeHeader";
import { WhosWorkingView } from "@/components/concierge/WhosWorkingView";
import { ShiftEventsMiniCalendar } from "@/components/concierge/ShiftEventsMiniCalendar";
import { ConciergeChecklistView } from "@/components/checklists/concierge/ConciergeChecklistView";
import { ConciergeShiftReport } from "@/components/concierge/ConciergeShiftReport";
import { AnnouncementsBoard } from "@/components/concierge/AnnouncementsBoard";
import { StaffMessagesInbox } from "@/components/concierge/StaffMessagesInbox";
import { PoliciesAndQA } from "@/components/concierge/PoliciesAndQA";
import { ResponseTemplatesWithAI } from "@/components/concierge/ResponseTemplatesWithAI";
import { QuickLinks } from "@/components/concierge/QuickLinks";
import { LostAndFoundTab } from "@/components/concierge/LostAndFoundTab";
import { StaffSchedulePanel } from "@/components/concierge/StaffSchedulePanel";
import { ClassScheduleView } from "@/components/concierge/ClassScheduleView";
import { EmbeddedChecklist } from "@/components/concierge/EmbeddedChecklist";
import { UpcomingTodayCard } from "@/components/concierge/UpcomingTodayCard";

export default function ConciergeDashboard() {
  const [activeView, setActiveView] = useState<ConciergeView>("home");
  const isMobile = useIsMobile();

  // Placeholder for unread message count - will be replaced with real data
  const unreadCount = 3;

  const renderContent = () => {
    switch (activeView) {
      case "home":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
            <div className="lg:col-span-2 space-y-4">
              <UpcomingTodayCard />
              <EmbeddedChecklist />
              <ClassScheduleView />
            </div>
          </div>
        );
      case "whos-working":
        return (
          <div className="p-6 md:p-8">
            <h2 className="text-sm uppercase tracking-[0.15em] font-normal mb-6">
              Who's Working Today
            </h2>
            <div className="max-w-2xl">
              <WhosWorkingView />
            </div>
          </div>
        );
      case "report":
        return (
          <div className="p-6 md:p-8">
            <h2 className="text-sm uppercase tracking-[0.15em] font-normal mb-4">
              Shift Report
            </h2>
            <div className="max-w-3xl">
              <ConciergeShiftReport />
            </div>
          </div>
        );
      case "messages":
        return (
          <div className="p-6 md:p-8">
            <h2 className="text-sm uppercase tracking-[0.15em] font-normal mb-4">
              Messages
            </h2>
            <div className="max-w-3xl">
              <StaffMessagesInbox />
            </div>
          </div>
        );
      case "announcements":
        return (
          <div className="p-6 md:p-8">
            <h2 className="text-sm uppercase tracking-[0.15em] font-normal mb-4">
              Announcements
            </h2>
            <div className="max-w-3xl">
              <AnnouncementsBoard />
            </div>
          </div>
        );
      case "policies-qa":
        return (
          <div className="p-6 md:p-8">
            <h2 className="text-sm uppercase tracking-[0.15em] font-normal mb-4">
              Policies & Q&A
            </h2>
            <div className="max-w-3xl">
              <PoliciesAndQA />
            </div>
          </div>
        );
      case "templates":
        return (
          <div className="p-6 md:p-8 flex flex-col h-full">
            <ResponseTemplatesWithAI />
          </div>
        );
      case "quick-links":
        return (
          <div className="p-6 md:p-8">
            <h2 className="text-sm uppercase tracking-[0.15em] font-normal mb-4">
              Quick Links
            </h2>
            <div className="max-w-2xl">
              <QuickLinks />
            </div>
          </div>
        );
      case "lost-found":
        return (
          <div className="p-6 md:p-8">
            <h2 className="text-sm uppercase tracking-[0.15em] font-normal mb-4">
              Lost & Found
            </h2>
            <div className="max-w-3xl">
              <LostAndFoundTab />
            </div>
          </div>
        );
      default:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
            <div className="space-y-4">
              <ShiftEventsMiniCalendar />
              <ConciergeChecklistView />
            </div>
            <div>
              <WhosWorkingView />
            </div>
          </div>
        );
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full bg-background">
        <ConciergeHeader />
        
        <div className="flex flex-1 w-full">
          {/* Desktop Sidebar */}
          {!isMobile && (
            <ConciergeSidebar
              activeView={activeView}
              onViewChange={setActiveView}
              unreadCount={unreadCount}
            />
          )}

          {/* Main Content */}
          <main className={`flex-1 overflow-auto ${isMobile ? "pb-20" : ""}`}>
            {renderContent()}
          </main>
        </div>

        {/* Mobile Bottom Nav */}
        {isMobile && (
          <ConciergeBottomNav
            activeView={activeView}
            onViewChange={setActiveView}
          />
        )}
      </div>
    </SidebarProvider>
  );
}
