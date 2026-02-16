import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { ConciergeSidebar, type ConciergeView } from "@/components/concierge/ConciergeSidebar";
import { ConciergeBottomNav } from "@/components/concierge/ConciergeBottomNav";
import { ConciergeHeader } from "@/components/concierge/ConciergeHeader";
import { WhosWorkingView } from "@/components/concierge/WhosWorkingView";
import { ShiftEventsMiniCalendar } from "@/components/concierge/ShiftEventsMiniCalendar";
import { ConciergeChecklistView } from "@/components/checklists/concierge/ConciergeChecklistView";
import { ConciergeForm } from "@/components/concierge/ConciergeForm";
import { AnnouncementsBoard } from "@/components/concierge/AnnouncementsBoard";
import { StaffMessagesInbox } from "@/components/concierge/StaffMessagesInbox";
import { PoliciesAndQA } from "@/components/concierge/PoliciesAndQA";
import { ResponseTemplatesWithAI } from "@/components/concierge/ResponseTemplatesWithAI";
import { StaffResourcesView } from "@/components/staff-resources/StaffResourcesView";
import { LostAndFoundTab } from "@/components/concierge/LostAndFoundTab";
import { StaffSchedulePanel } from "@/components/concierge/StaffSchedulePanel";
import { ClassScheduleView } from "@/components/concierge/ClassScheduleView";
import { EmbeddedChecklist } from "@/components/concierge/EmbeddedChecklist";
import { UpcomingTodayCard } from "@/components/concierge/UpcomingTodayCard";
import { useUnreadAnnouncements } from "@/hooks/useUnreadAnnouncements";
import { QuickLinksTab } from "@/components/staff-resources/QuickLinksTab";
import { ResourcePagesTab } from "@/components/staff-resources/ResourcePagesTab";
import { PoliciesTab } from "@/components/staff-resources/PoliciesTab";
import { useActiveRole } from "@/hooks/useActiveRole";
import { useQuickLinkGroupsByRole, useResourcePagesByRole } from "@/hooks/useStaffResources";
import { usePolicies } from "@/hooks/usePolicies";

export default function ConciergeDashboard() {
  const [activeView, setActiveView] = useState<ConciergeView>("home");
  const isMobile = useIsMobile();
  const { data: hasUnreadAnnouncements } = useUnreadAnnouncements();
  const { activeRole } = useActiveRole();
  const effectiveRole = activeRole ?? "concierge";

  // Data hooks for resource sub-views
  const { data: quickLinkGroups = [], isLoading: qlLoading } = useQuickLinkGroupsByRole(effectiveRole);
  const { data: resourcePages = [], isLoading: rpLoading } = useResourcePagesByRole(effectiveRole);
  const { data: policies = [], isLoading: polLoading } = usePolicies();

  // Placeholder for unread message count - will be replaced with real data
  const unreadCount = 3;

  const viewTitles: Record<ConciergeView, string> = {
    home: "Home",
    report: "Shift Report",
    messages: "Messages",
    announcements: "Announcements",
    "whos-working": "Who's Working",
    templates: "Response Templates",
    resources: "Resources",
    "resources-quick-links": "Quick Links",
    "resources-pages": "Resource Pages",
    "lost-found": "Lost & Found",
    qa: "Q&A",
  };

  const renderContent = () => {
    switch (activeView) {
      case "home":
        return (
          <div className="space-y-4 p-4">
            <UpcomingTodayCard />
            <EmbeddedChecklist />
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
            <div className="max-w-3xl mx-auto">
              <ConciergeForm />
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
              <AnnouncementsBoard contextRole="concierge" />
            </div>
          </div>
        );
      case "qa":
        return (
          <div className="p-6 md:p-8 flex flex-col h-full">
            <div className="flex-1 flex flex-col min-h-0 w-full">
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
      case "resources":
        return (
          <div className="p-6 md:p-8 flex flex-col h-full">
            <div className="flex-1">
              <StaffResourcesView />
            </div>
          </div>
        );
      case "resources-quick-links":
        return (
          <div className="p-4 md:p-8">
            <QuickLinksTab groups={quickLinkGroups} isLoading={qlLoading} searchTerm="" />
          </div>
        );
      case "resources-pages":
        return (
          <div className="p-4 md:p-8">
            <ResourcePagesTab 
              pages={resourcePages} 
              isLoading={rpLoading} 
              searchTerm="" 
              returnPath="/dashboard/concierge"
            />
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

  if (isMobile) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex flex-col w-full bg-background">
          <ConciergeHeader title={viewTitles[activeView]} />
          <main className="flex-1 overflow-auto pb-20">
            {renderContent()}
          </main>
          <ConciergeBottomNav
            activeView={activeView}
            onViewChange={setActiveView}
            hasUnreadAnnouncements={!!hasUnreadAnnouncements}
          />
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <ConciergeSidebar
          activeView={activeView}
          onViewChange={setActiveView}
          unreadCount={unreadCount}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <ConciergeHeader title={viewTitles[activeView]} />
          <main className="flex-1 overflow-auto">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
