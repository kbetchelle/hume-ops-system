import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { ConciergeSidebar, type ConciergeView } from "@/components/concierge/ConciergeSidebar";
import { ConciergeBottomNav } from "@/components/concierge/ConciergeBottomNav";
import { ConciergeHeader } from "@/components/concierge/ConciergeHeader";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import { MoreMenuSheet } from "@/components/mobile/MoreMenuSheet";
import { getConciergeMobileTabs, getConciergeMoreItems } from "@/components/mobile/mobile-nav-config";
import { WhosWorkingView } from "@/components/concierge/WhosWorkingView";
import { ShiftEventsMiniCalendar } from "@/components/concierge/ShiftEventsMiniCalendar";
import { ConciergeChecklistView } from "@/components/checklists/concierge/ConciergeChecklistView";
import { ConciergeForm } from "@/components/concierge/ConciergeForm";
import { PastReportsView } from "@/components/concierge/PastReportsView";
import { AnnouncementsBoard } from "@/components/concierge/AnnouncementsBoard";
import { StaffMessagesInbox } from "@/components/foh/messages";
import { PoliciesAndQA } from "@/components/concierge/PoliciesAndQA";
import { ResponseTemplatesWithAI } from "@/components/concierge/ResponseTemplatesWithAI";
import { StaffResourcesView } from "@/components/staff-resources/StaffResourcesView";
import { LostAndFoundTab } from "@/components/concierge/LostAndFoundTab";
import { StaffSchedulePanel } from "@/components/concierge/StaffSchedulePanel";
import { ClassScheduleView } from "@/components/concierge/ClassScheduleView";
import { EmbeddedChecklist } from "@/components/concierge/EmbeddedChecklist";
import { UpcomingTodayCard } from "@/components/concierge/UpcomingTodayCard";
import { useUnreadAnnouncements } from "@/hooks/useUnreadAnnouncements";
import { useUnreadMessageCount } from "@/hooks/useUnreadMessageCount";
import { QuickLinksTab } from "@/components/staff-resources/QuickLinksTab";
import { ResourcePagesTab } from "@/components/staff-resources/ResourcePagesTab";
import { PoliciesTab } from "@/components/staff-resources/PoliciesTab";
import { useActiveRole } from "@/hooks/useActiveRole";
import { useQuickLinkGroupsByRole, useResourcePagesByRole } from "@/hooks/useStaffResources";
import { usePolicies } from "@/hooks/usePolicies";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const CONCIERGE_TAB_IDS = ["home", "report", "messages", "lost-found", "more"] as const;
function conciergeViewToTabId(view: ConciergeView): string {
  if (CONCIERGE_TAB_IDS.includes(view as (typeof CONCIERGE_TAB_IDS)[number])) return view;
  return "more";
}

export default function ConciergeDashboard() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<ConciergeView>("home");
  const [reportView, setReportView] = useState<"current" | "past">("current");
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const isMobile = useIsMobile();
  const { data: hasUnreadAnnouncements } = useUnreadAnnouncements();
  const { activeRole } = useActiveRole();
  const effectiveRole = activeRole ?? "concierge";

  // Data hooks for resource sub-views
  const { data: quickLinkGroups = [], isLoading: qlLoading } = useQuickLinkGroupsByRole(effectiveRole);
  const { data: resourcePages = [], isLoading: rpLoading } = useResourcePagesByRole(effectiveRole);
  const { data: policies = [], isLoading: polLoading } = usePolicies();

  const { count: unreadMessageCount } = useUnreadMessageCount();

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
    packages: "Package Tracker",
    qa: "Q&A"
  };

  const renderContent = () => {
    switch (activeView) {
      case "home":
        return (
          <div className="flex flex-wrap gap-4 p-4">
            <div className="flex-1 basis-[450px] min-w-[450px]" style={{ paddingTop: '25px' }}>
              <EmbeddedChecklist />
            </div>
            <div className="flex-1 basis-[450px] min-w-[450px]">
              <UpcomingTodayCard />
            </div>
          </div>);

      case "whos-working":
        return (
          <div className="p-6 md:p-8">
            <WhosWorkingView />
          </div>);


      case "report":
        return (
          <div className="p-6 md:p-8 md:px-[30px]">
            <div className="max-w-3xl mx-auto">
              <Tabs value={reportView} onValueChange={(v) => setReportView(v as "current" | "past")}>
                <TabsList className="mb-4 rounded-none w-full sm:w-auto">
                  <TabsTrigger value="current" className="rounded-none">Current shift</TabsTrigger>
                  <TabsTrigger value="past" className="rounded-none">Past reports</TabsTrigger>
                </TabsList>
                <TabsContent value="current">
                  <ConciergeForm />
                </TabsContent>
                <TabsContent value="past">
                  <PastReportsView />
                </TabsContent>
              </Tabs>
            </div>
          </div>);

      case "messages":
        return (
          <div className="h-[calc(100vh-4rem)] p-4 md:p-8">
            <StaffMessagesInbox />
          </div>);

      case "announcements":
        return (
          <div className="p-6 md:p-8">
            <h2 className="text-sm uppercase tracking-[0.15em] font-normal mb-4">
              Announcements
            </h2>
            <div className="max-w-3xl">
              <AnnouncementsBoard contextRole="concierge" />
            </div>
          </div>);

      case "qa":
        return (
          <div className="p-6 md:p-8 flex flex-col h-full">
            <div className="flex-1 flex flex-col min-h-0 w-full">
              <PoliciesAndQA />
            </div>
          </div>);

      case "templates":
        return (
          <div className="p-6 md:p-8 flex flex-col h-full">
            <ResponseTemplatesWithAI />
          </div>);

      case "resources":
        return (
          <div className="p-6 md:p-8 flex flex-col h-full">
            <div className="flex-1">
              <StaffResourcesView />
            </div>
          </div>);

      case "resources-quick-links":
        return (
          <div className="p-4 md:p-8">
            <QuickLinksTab groups={quickLinkGroups} isLoading={qlLoading} searchTerm="" />
          </div>);

      case "resources-pages":
        return (
          <div className="p-4 md:p-8">
            <ResourcePagesTab
              pages={resourcePages}
              isLoading={rpLoading}
              searchTerm=""
              returnPath="/dashboard/concierge" />

          </div>);

      case "lost-found":
        return (
          <div className="flex-1 flex flex-col p-6 md:p-8 min-h-0">
            <div className="flex-1 min-h-0">
              <LostAndFoundTab />
            </div>
          </div>);

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
          </div>);

    }
  };

  if (isMobile) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex flex-col w-full bg-background">
          <MobileHeader title={viewTitles[activeView]} />
          <main className="flex-1 min-h-0 overflow-auto pt-12 pb-[calc(64px+env(safe-area-inset-bottom))]">
            {renderContent()}
          </main>
          <MobileBottomNav
            tabs={getConciergeMobileTabs(unreadMessageCount, setActiveView)}
            activeId={conciergeViewToTabId(activeView)}
            onMoreClick={() => setMoreSheetOpen(true)}
          />
          <MoreMenuSheet
            open={moreSheetOpen}
            onOpenChange={setMoreSheetOpen}
            items={getConciergeMoreItems()}
            onItemSelect={(item) => {
              if (item.path) navigate(item.path);
              if (item.view) setActiveView(item.view);
            }}
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
          unreadCount={unreadMessageCount} />

        <div className="flex-1 flex flex-col min-w-0">
          <ConciergeHeader title={viewTitles[activeView]} />
          <main className="flex-1 overflow-auto">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>);

}