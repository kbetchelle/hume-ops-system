import { useState, useCallback, lazy, Suspense } from "react";
import { BugReportDialog } from "@/components/feedback/BugReportDialog";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Users, AlertCircle, Package } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { ConciergeSidebar, type ConciergeView } from "@/components/concierge/ConciergeSidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { ConciergeBottomNav } from "@/components/concierge/ConciergeBottomNav";
import { ConciergeHeader } from "@/components/concierge/ConciergeHeader";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { GlobalOfflineBanner } from "@/components/mobile/GlobalOfflineBanner";
import { PWAInstallBanner } from "@/components/mobile/PWAInstallBanner";
import { PushPromptBanner } from "@/components/mobile/PushPromptBanner";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import { MoreMenuSheet } from "@/components/mobile/MoreMenuSheet";
import { MobilePageWrapper } from "@/components/mobile/MobilePageWrapper";
import { getConciergeMobileTabs, getConciergeMoreItems } from "@/components/mobile/mobile-nav-config";
import { WhosWorkingView } from "@/components/concierge/WhosWorkingView";
import { ShiftEventsMiniCalendar } from "@/components/concierge/ShiftEventsMiniCalendar";
import { ConciergeChecklistView } from "@/components/checklists/concierge/ConciergeChecklistView";
import { AnnouncementsBoard } from "@/components/concierge/AnnouncementsBoard";
import { StaffMessagesInbox } from "@/components/foh/messages";
import { PoliciesAndQA } from "@/components/concierge/PoliciesAndQA";
import { StaffResourcesView } from "@/components/staff-resources/StaffResourcesView";
import { SkeletonLoader } from "@/components/mobile/SkeletonLoader";

const ConciergeForm = lazy(() => import("@/components/concierge/ConciergeForm"));
const PastReportsView = lazy(() => import("@/components/concierge/PastReportsView"));
const ResponseTemplatesWithAI = lazy(() => import("@/components/concierge/ResponseTemplatesWithAI"));
const LostAndFoundTab = lazy(() => import("@/components/concierge/LostAndFoundTab"));
import { StaffSchedulePanel } from "@/components/concierge/StaffSchedulePanel";
import { ClassScheduleView } from "@/components/concierge/ClassScheduleView";
import { EmbeddedChecklist } from "@/components/concierge/EmbeddedChecklist";
import { UpcomingTodayCard } from "@/components/concierge/UpcomingTodayCard";
import { MastercardArrivalBanner } from "@/components/concierge/MastercardArrivalBanner";
import { ChecklistAlertBanners } from "@/components/concierge/ChecklistAlertBanners";
import { useUnreadAnnouncements } from "@/hooks/useUnreadAnnouncements";
import { useUnreadMessageCount } from "@/hooks/useUnreadMessageCount";
import { usePackageStats } from "@/hooks/usePackages";
import { supabase } from "@/integrations/supabase/client";
import { QuickLinksTab } from "@/components/staff-resources/QuickLinksTab";
import { ResourcePagesTab } from "@/components/staff-resources/ResourcePagesTab";
import { PoliciesTab } from "@/components/staff-resources/PoliciesTab";
import { useActiveRole } from "@/hooks/useActiveRole";
import { useOfflineBootstrap } from "@/hooks/useOfflineBootstrap";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { useQuickLinkGroupsByRole, useResourcePagesByRole } from "@/hooks/useStaffResources";
import { usePolicies } from "@/hooks/usePolicies";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

const CONCIERGE_TAB_IDS = ["home", "report", "messages", "lost-found", "more"] as const;
function conciergeViewToTabId(view: ConciergeView): string {
  if (CONCIERGE_TAB_IDS.includes(view as (typeof CONCIERGE_TAB_IDS)[number])) return view;
  return "more";
}

export default function ConciergeDashboard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<ConciergeView>("home");
  const [reportView, setReportView] = useState<"current" | "past">("current");
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const [showBugReport, setShowBugReport] = useState(false);
  const isMobile = useIsMobile();
  const { data: hasUnreadAnnouncements } = useUnreadAnnouncements();
  const { activeRole } = useActiveRole();
  const effectiveRole = activeRole ?? "concierge";
  const { user } = useAuthContext();

  useOfflineBootstrap(
    isMobile && user?.id && effectiveRole
      ? { userId: user.id, role: effectiveRole }
      : null
  );

  const pushNotifications = usePushNotifications({
    userId: user?.id,
    activeRole: effectiveRole,
  });

  // Data hooks for resource sub-views
  const { data: quickLinkGroups = [], isLoading: qlLoading } = useQuickLinkGroupsByRole(effectiveRole);
  const { data: resourcePages = [], isLoading: rpLoading } = useResourcePagesByRole(effectiveRole);
  const { data: policies = [], isLoading: polLoading } = usePolicies();

  const { count: unreadMessageCount } = useUnreadMessageCount();
  const queryClient = useQueryClient();
  const today = getPSTToday();
  const { data: packageStats } = usePackageStats();
  const { data: guestsCheckedInCount } = useQuery({
    queryKey: ["guests-checked-in-today", today],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("arketa_reservations")
        .select("id", { count: "exact", head: true })
        .eq("checked_in", true)
        .eq("class_date", today);
      if (error) return 0;
      return count ?? 0;
    },
  });

  const handleHomeRefresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["concierge-checklists"] }),
      queryClient.invalidateQueries({ queryKey: ["concierge-completions"] }),
      queryClient.invalidateQueries({ queryKey: ["shift-submission"] }),
      queryClient.invalidateQueries({ queryKey: ["scheduled-tours-upcoming"] }),
      queryClient.invalidateQueries({ queryKey: ["daily-schedule-upcoming"] }),
      queryClient.invalidateQueries({ queryKey: ["mastercard-visits-upcoming", today] }),
      queryClient.invalidateQueries({ queryKey: ["mastercard-arrivals", today] }),
      queryClient.invalidateQueries({ queryKey: ["package-stats"] }),
      queryClient.invalidateQueries({ queryKey: ["guests-checked-in-today", today] }),
    ]);
  }, [queryClient, today]);

  const viewTitles: Record<ConciergeView, string> = {
    home: t("view.home"),
    report: t("view.shiftReport"),
    messages: t("view.messages"),
    announcements: t("view.announcements"),
    "whos-working": t("view.whosWorking"),
    templates: t("view.responseTemplates"),
    resources: t("view.resources"),
    "resources-quick-links": t("view.quickLinks"),
    "resources-pages": t("view.resourcePages"),
    "lost-found": t("view.lostAndFound"),
    packages: t("view.packageTracker"),
    qa: t("view.qa"),
  };

  const renderContent = () => {
    switch (activeView) {
      case "home":
        if (isMobile) {
          return (
            <MobilePageWrapper
              scrollKey="concierge-home"
              onRefresh={handleHomeRefresh}
              className="flex flex-col min-h-0 p-4 space-y-4"
            >
              <MastercardArrivalBanner />
              <EmbeddedChecklist variant="compact" />
              <ChecklistAlertBanners />
              <UpcomingTodayCard maxItems={3} />
            </MobilePageWrapper>
          );
        }
        return (
          <div className="flex flex-col gap-4" style={{ padding: '36px' }}>
            <MastercardArrivalBanner />
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 basis-[450px] min-w-[450px]">
                <EmbeddedChecklist />
              </div>
              <div className="flex-1 basis-[450px] min-w-[450px]">
                <ChecklistAlertBanners />
                <UpcomingTodayCard />
              </div>
            </div>
          </div>);

      case "whos-working":
        return (
          <div className="p-6 md:p-8">
            <WhosWorkingView />
          </div>);


      case "report":
        if (isMobile) {
          return (
            <div className="px-0 py-4">
              <Suspense fallback={<SkeletonLoader variant="form" />}>
                <ConciergeForm />
              </Suspense>
            </div>
          );
        }
        return (
          <div className="p-6 md:p-8 md:px-[30px]">
            <div className="max-w-3xl mx-auto">
              <Tabs value={reportView} onValueChange={(v) => setReportView(v as "current" | "past")}>
                <TabsList className="mb-4 rounded-none w-full sm:w-auto">
                  <TabsTrigger value="current" className="rounded-none">{t("report.currentShift")}</TabsTrigger>
                  <TabsTrigger value="past" className="rounded-none">{t("report.pastReports")}</TabsTrigger>
                </TabsList>
                <TabsContent value="current">
                  <Suspense fallback={<SkeletonLoader variant="form" />}>
                    <ConciergeForm />
                  </Suspense>
                </TabsContent>
                <TabsContent value="past">
                  <Suspense fallback={<SkeletonLoader variant="card-list" count={6} />}>
                    <PastReportsView />
                  </Suspense>
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
            <Suspense fallback={<SkeletonLoader variant="card-list" count={6} />}>
              <ResponseTemplatesWithAI />
            </Suspense>
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
              <Suspense fallback={<SkeletonLoader variant="card-list" count={6} />}>
                <LostAndFoundTab />
              </Suspense>
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
        <div className="concierge-mobile min-h-screen flex flex-col w-full bg-background">
          <MobileHeader title={viewTitles[activeView]} />
          <PWAInstallBanner />
          {pushNotifications.showPrompt && (
            <PushPromptBanner
              onEnable={async () => {
                await pushNotifications.enablePush();
              }}
              onLater={pushNotifications.dismissPrompt}
            />
          )}
          <GlobalOfflineBanner />
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
            onItemSelect={async (item) => {
              if (item.id === "sign-out") {
                const { error } = await supabase.auth.signOut();
                if (error) toast.error("Failed to sign out");
                else { toast.success("Signed out"); navigate("/"); }
                return;
              }
              if (item.id === "report-bug") { setShowBugReport(true); return; }
              if (item.path) navigate(item.path);
              if (item.view) setActiveView(item.view);
            }}
          />
          <BugReportDialog open={showBugReport} onOpenChange={setShowBugReport} />
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