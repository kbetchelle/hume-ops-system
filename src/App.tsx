import { applyMobileQueryDefaults } from "@/lib/queryClientMobile";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { ActiveRoleProvider } from "@/hooks/useActiveRole";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

// Public pages (static - needed immediately)
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import Install from "./pages/Install";

// Auth pages (static - needed for login flow)
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Onboarding from "./pages/auth/Onboarding";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import PendingApprovalPage from "./pages/auth/PendingApprovalPage";
import AccountDisabledPage from "./pages/auth/AccountDisabledPage";

// Dashboard redirect (static - lightweight)
import Dashboard from "./pages/Dashboard";

// Public plan page (static - public route)
import PublicPlanPage from "./pages/PublicPlanPage";

// ============================================================================
// LAZY-LOADED PAGES - Code splitting for optimal bundle size
// ============================================================================

// Dashboard pages
const AdminDashboard = lazy(() => import("./pages/dashboards/AdminDashboard"));
const ManagerDashboard = lazy(() => import("./pages/dashboards/ManagerDashboard"));
const ConciergeDashboard = lazy(() => import("./pages/dashboards/ConciergeDashboard"));
const TrainerDashboard = lazy(() => import("./pages/dashboards/TrainerDashboard"));
const MaleSpaDashboard = lazy(() => import("./pages/dashboards/MaleSpaDashboard"));
const FemaleSpaDashboard = lazy(() => import("./pages/dashboards/FemaleSpaDashboard"));
const FloaterDashboard = lazy(() => import("./pages/dashboards/FloaterDashboard"));
const CafeDashboard = lazy(() => import("./pages/dashboards/CafeDashboard"));
const EventDrinksPage = lazy(() => import("./pages/dashboards/EventDrinksPage"));
const MembersPage = lazy(() => import("./pages/dashboards/MembersPage"));

// Member sub-pages
const AllClientsPage = lazy(() => import("./pages/members/AllClientsPage"));
const GuestsPage = lazy(() => import("./pages/members/GuestsPage"));
const ApplicationSubmittedPage = lazy(() => import("./pages/members/ApplicationSubmittedPage"));
const WaitlistPage = lazy(() => import("./pages/members/WaitlistPage"));
const OnboardingMembersPage = lazy(() => import("./pages/members/OnboardingPage"));
const SubscriptionActivePage = lazy(() => import("./pages/members/SubscriptionActivePage"));
const SubscriptionPastDuePage = lazy(() => import("./pages/members/SubscriptionPastDuePage"));
const TemporaryMembershipsPage = lazy(() => import("./pages/members/TemporaryMembershipsPage"));
const PausesPage = lazy(() => import("./pages/members/PausesPage"));
const CancellationsPage = lazy(() => import("./pages/members/CancellationsPage"));
const MastercardPage = lazy(() => import("./pages/members/MastercardPage"));

// Dashboard feature pages
const ChecklistsManagementPage = lazy(() => import("./pages/dashboards/ChecklistsManagementPage"));
const MyChecklistsPage = lazy(() => import("./pages/dashboards/MyChecklistsPage"));
const CommunicationsPage = lazy(() => import("./pages/dashboards/CommunicationsPage"));
const MessagesPage = lazy(() => import("./pages/dashboards/MessagesPage"));
const MemberCommunicationsHub = lazy(() => import("./components/communications/MemberCommunicationsHub"));
const ReportsPage = lazy(() => import("./pages/dashboards/ReportsPage"));
const TrainingPlansPage = lazy(() => import("./pages/dashboards/TrainingPlansPage"));
const AnalyticsDashboard = lazy(() => import("./pages/dashboards/AnalyticsDashboard"));

// Admin pages
const SlingUserManagement = lazy(() => import("./pages/admin/SlingUserManagement"));
const BackfillManagerPage = lazy(() => import("./pages/admin/BackfillManagerPage"));
const StaffAnnouncementsPage = lazy(() => import("./pages/admin/StaffAnnouncementsPage"));
const UserManagementPage = lazy(() => import("./pages/admin/UserManagementPage"));
const ApiSyncingPage = lazy(() => import("./pages/admin/ApiSyncingPage"));
const ApiDataMappingPage = lazy(() => import("./pages/admin/ApiDataMappingPage"));
const DataPatternsPage = lazy(() => import("./pages/admin/DataPatternsPage"));
const SyncSkippedRecordsPage = lazy(() => import("./pages/admin/SyncSkippedRecordsPage"));
const BugReportsPage = lazy(() => import("./pages/admin/BugReportsPage"));
const DevTestingPage = lazy(() => import("./pages/admin/DevTestingPage"));
const DevUpdatesPage = lazy(() => import("./pages/admin/DevUpdatesPage"));
const NotificationExamplesPage = lazy(() => import("./pages/admin/NotificationExamplesPage"));
const AIFeedbackPage = lazy(() => import("./pages/admin/AIFeedbackPage"));

// User pages
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const AccountSettingsPage = lazy(() => import("./pages/AccountSettingsPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));

// Manager pages
const MasterCalendarPage = lazy(() => import("./pages/manager/MasterCalendarPage"));
const StaffQAPage = lazy(() => import("./pages/manager/StaffQAPage"));
const StaffResourcesPage = lazy(() => import("./pages/manager/StaffResourcesPage"));

// Resource pages
const ResourcePageReadingPage = lazy(() =>
  import("./pages/ResourcePageReadingPage").then(module => ({
    default: module.ResourcePageReadingPage
  }))
);
const StaffResourcesViewPage = lazy(() => import("./pages/dashboards/StaffResourcesViewPage"));
const ResourcePageEditorPage = lazy(() =>
  import("./pages/ResourcePageEditorPage").then(module => ({
    default: module.ResourcePageEditorPage
  }))
);
const NotificationControlCenterPage = lazy(() =>
  import("./pages/dashboards/NotificationControlCenterPage").then(module => ({
    default: module.default
  }))
);
const ResourcesQuickLinksPage = lazy(() => import("./pages/dashboards/ResourcesQuickLinksPage"));
const ResourcesPagesPage = lazy(() => import("./pages/dashboards/ResourcesPagesPage"));
const ResourcesPoliciesPage = lazy(() => import("./pages/dashboards/ResourcesPoliciesPage"));

// Other feature pages
const LostAndFoundPage = lazy(() => import("./pages/dashboards/LostAndFoundPage"));
const ClassSchedulePage = lazy(() => import("./pages/dashboards/ClassSchedulePage"));
const AnnouncementsPage = lazy(() => import("./pages/dashboards/AnnouncementsPage"));
const DocumentsPage = lazy(() => import("./pages/dashboards/DocumentsPage"));
const WhosWorkingPage = lazy(() => import("./pages/dashboards/WhosWorkingPage"));
const PackageTrackingPage = lazy(() => import("./pages/dashboards/PackageTrackingPage"));
const MyPackagesPage = lazy(() => import("./pages/dashboards/MyPackagesPage"));
const BoHNotesPage = lazy(() => import("./pages/dashboards/BoHNotesPage"));

// Reusable loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

// Wrapper for lazy-loaded pages with Suspense and ErrorBoundary
const LazyPage = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary>
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

if (
  typeof window !== "undefined" &&
  window.matchMedia("(max-width: 768px)").matches
) {
  applyMobileQueryDefaults(queryClient);
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ActiveRoleProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/install" element={<Install />} />

            {/* Auth flow routes */}
            <Route
              path="/pending-approval"
              element={
                <ProtectedRoute>
                  <PendingApprovalPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account-disabled"
              element={
                <ProtectedRoute>
                  <AccountDisabledPage />
                </ProtectedRoute>
              }
            />

            {/* Protected routes */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />

            {/* Dashboard router - redirects to role-appropriate dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Role-specific dashboards */}
            <Route
              path="/dashboard/admin"
              element={
                <ProtectedRoute requiredRoles={["admin"]}>
                  <LazyPage><AdminDashboard /></LazyPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/manager"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager"]}>
                  <LazyPage><ManagerDashboard /></LazyPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/concierge"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "concierge"]}>
                  <LazyPage><ConciergeDashboard /></LazyPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/trainer"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "trainer"]}>
                  <LazyPage><TrainerDashboard /></LazyPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/spa"
              element={<Navigate to="/dashboard/spa/female" replace />}
            />
            <Route
              path="/dashboard/spa/female"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "female_spa_attendant", "male_spa_attendant"]}>
                  <LazyPage><FemaleSpaDashboard /></LazyPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/spa/male"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "female_spa_attendant", "male_spa_attendant"]}>
                  <LazyPage><MaleSpaDashboard /></LazyPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/floater"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "floater"]}>
                  <LazyPage><FloaterDashboard /></LazyPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/cafe"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "cafe"]}>
                  <LazyPage><CafeDashboard /></LazyPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/cafe/event-drinks"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "cafe"]}>
                  <LazyPage><EventDrinksPage /></LazyPage>
                </ProtectedRoute>
              }
            />

            {/* Members page - redirects to all-clients */}
            <Route
              path="/dashboard/members"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "trainer"]}>
                  <Navigate to="/dashboard/members/all-clients" replace />
                </ProtectedRoute>
              }
            />

            {/* Member sub-pages */}
            <Route
              path="/dashboard/members/all-clients"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "trainer"]}>
                  <LazyPage><AllClientsPage /></LazyPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/members/guests"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "trainer"]}>
                  <LazyPage><GuestsPage /></LazyPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/members/application-submitted"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "trainer"]}>
                  <LazyPage><ApplicationSubmittedPage /></LazyPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/members/waitlist"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "trainer"]}>
                  <LazyPage><WaitlistPage /></LazyPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/members/onboarding"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "trainer"]}>
                  <LazyPage><OnboardingMembersPage /></LazyPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/members/subscription-active"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "trainer"]}>
                  <LazyPage><SubscriptionActivePage /></LazyPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/members/subscription-past-due"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "trainer"]}>
                  <LazyPage><SubscriptionPastDuePage /></LazyPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/members/temporary-memberships"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "trainer"]}>
                  <LazyPage><TemporaryMembershipsPage /></LazyPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/members/pauses"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "trainer"]}>
                  <LazyPage><PausesPage /></LazyPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/members/cancellations"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "trainer"]}>
                  <LazyPage><CancellationsPage /></LazyPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/members/mastercard"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager"]}>
                  <LazyPage><MastercardPage /></LazyPage>
                </ProtectedRoute>
              }
            />

            {/* Checklists management for managers */}
            <Route
              path="/dashboard/checklists"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager"]}>
                  <LazyPage><ChecklistsManagementPage /></LazyPage>
                </ProtectedRoute>
              }
            />

            {/* My checklists for staff roles */}
            <Route
              path="/dashboard/my-checklists"
              element={
                <ProtectedRoute requiredRoles={["concierge", "female_spa_attendant", "male_spa_attendant", "floater"]}>
                  <LazyPage><MyChecklistsPage /></LazyPage>
                </ProtectedRoute>
              }
            />

            {/* Communications - accessible to all authenticated users */}
            <Route
              path="/dashboard/communications"
              element={
                <ProtectedRoute>
                  <LazyPage><CommunicationsPage /></LazyPage>
                </ProtectedRoute>
              }
            />

            {/* Staff Messages - accessible to all authenticated users */}
            <Route
              path="/dashboard/messages"
              element={
                <ProtectedRoute>
                  <LazyPage><MessagesPage /></LazyPage>
                </ProtectedRoute>
              }
            />

            {/* Member Communications Hub for Concierges */}
            <Route
              path="/dashboard/member-communications"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "concierge", "trainer"]}>
                  <LazyPage><MemberCommunicationsHub /></LazyPage>
                </ProtectedRoute>
              }
            />

            {/* Lost & Found for Concierge and BoH */}
            <Route
              path="/dashboard/lost-and-found"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "concierge", "female_spa_attendant", "male_spa_attendant", "floater", "cafe"]}>
                  <LazyPage><LostAndFoundPage /></LazyPage>
                </ProtectedRoute>
              }
            />

            {/* Class Schedule for BOH and Concierge */}
            <Route
              path="/dashboard/class-schedule"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "concierge", "female_spa_attendant", "male_spa_attendant", "floater"]}>
                  <LazyPage><ClassSchedulePage /></LazyPage>
                </ProtectedRoute>
              }
            />

            {/* Announcements for BOH and Concierge */}
            <Route
              path="/dashboard/announcements"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "concierge", "female_spa_attendant", "male_spa_attendant", "floater", "cafe"]}>
                  <LazyPage><AnnouncementsPage /></LazyPage>
                </ProtectedRoute>
              }
            />

            {/* Documents for BOH and Concierge */}
            <Route
              path="/dashboard/documents"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "concierge", "female_spa_attendant", "male_spa_attendant", "floater"]}>
                  <LazyPage><DocumentsPage /></LazyPage>
                </ProtectedRoute>
              }
            />
            {/* Who's Working for BOH and Concierge */}

            {/* BoH Notes for Management */}
            <Route
              path="/dashboard/boh-notes"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "female_spa_attendant", "male_spa_attendant", "floater", "cafe"]}>
                  <LazyPage><BoHNotesPage /></LazyPage>
                </ProtectedRoute>
              }
            />

            {/* Who's Working for BOH and Concierge */}
            <Route
              path="/dashboard/whos-working"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "concierge", "female_spa_attendant", "male_spa_attendant", "floater"]}>
                  <LazyPage><WhosWorkingPage /></LazyPage>
                </ProtectedRoute>
              }
            />

            {/* Package Tracking for Concierge, Cafe, and Management */}
            <Route
              path="/dashboard/package-tracking"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "concierge", "cafe"]}>
                  <LazyPage><PackageTrackingPage /></LazyPage>
                </ProtectedRoute>
              }
            />

            {/* My Packages - for all authenticated users */}
            <Route
              path="/dashboard/my-packages"
              element={
                <ProtectedRoute>
                  <LazyPage><MyPackagesPage /></LazyPage>
                </ProtectedRoute>
              }
            />

            {/* Reports & Analytics */}
            <Route
              path="/dashboard/reports"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager"]}>
                  <LazyPage><ReportsPage /></LazyPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/daily-reports"
              element={<Navigate to="/dashboard/reports" replace />}
            />
            <Route
              path="/dashboard/report-exports"
              element={<Navigate to="/dashboard/reports" replace />}
            />

            {/* Training Plans for Trainers */}
            <Route
              path="/dashboard/training-plans"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "trainer"]}>
                  <LazyPage><TrainingPlansPage /></LazyPage>
                </ProtectedRoute>
              }
            />

            {/* Public Plan View (no auth required) */}
            <Route path="/plan/:shareSlug" element={<PublicPlanPage />} />

            {/* Analytics Dashboard for Managers */}
            <Route
              path="/dashboard/analytics"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager"]}>
                  <LazyPage><AnalyticsDashboard /></LazyPage>
                </ProtectedRoute>
              }
            />

            {/* Master Calendar for Managers */}
            <Route
              path="/dashboard/master-calendar"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager"]}>
                  <LazyPage><MasterCalendarPage /></LazyPage>
                </ProtectedRoute>
              }
            />

            {/* Staff Announcements for Managers */}
            <Route
              path="/dashboard/staff-announcements"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager"]}>
                  <LazyPage><StaffAnnouncementsPage /></LazyPage>
                </ProtectedRoute>
              }
            />

            {/* Staff Q&A / Management Inbox for Managers */}
            <Route
              path="/dashboard/staff-qa"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager"]}>
                  <LazyPage><StaffQAPage /></LazyPage>
                </ProtectedRoute>
              }
            />

            {/* Notification Control Center for Managers */}
            <Route
              path="/dashboard/notification-center"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager"]}>
                  <LazyPage><NotificationControlCenterPage /></LazyPage>
                </ProtectedRoute>
              }
            />

            {/* Staff Resources for Managers */}
            <Route
              path="/dashboard/staff-resources"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager"]}>
                  <LazyPage><StaffResourcesPage /></LazyPage>
                </ProtectedRoute>
              }
            />

            {/* Resource Page Editor (Manager) - Lazy loaded */}
            <Route
              path="/dashboard/staff-resources/pages/new"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager"]}>
                  <LazyPage><ResourcePageEditorPage /></LazyPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/staff-resources/pages/:pageId/edit"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager"]}>
                  <LazyPage><ResourcePageEditorPage /></LazyPage>
                </ProtectedRoute>
              }
            />

            {/* Staff Resources View (read-only for staff) */}
            <Route
              path="/dashboard/resources"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "concierge", "female_spa_attendant", "male_spa_attendant", "floater", "cafe"]}>
                  <LazyPage><StaffResourcesViewPage /></LazyPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/resources/quick-links"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "concierge", "female_spa_attendant", "male_spa_attendant", "floater", "cafe"]}>
                  <LazyPage><ResourcesQuickLinksPage /></LazyPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/resources/pages"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "concierge", "female_spa_attendant", "male_spa_attendant", "floater", "cafe"]}>
                  <LazyPage><ResourcesPagesPage /></LazyPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/resources/pages/:pageId"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "concierge", "female_spa_attendant", "male_spa_attendant", "floater", "cafe", "trainer"]}>
                  <LazyPage><ResourcePageReadingPage /></LazyPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/resources/policies"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "concierge", "female_spa_attendant", "male_spa_attendant", "floater", "cafe"]}>
                  <LazyPage><ResourcesPoliciesPage /></LazyPage>
                </ProtectedRoute>
              }
            />

            {/* Sling User Management for Admins */}
            <Route
              path="/dashboard/sling-users"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager"]}>
                  <LazyPage><SlingUserManagement /></LazyPage>
                </ProtectedRoute>
              }
            />

            {/* API Data Mapping for Admins */}
            <Route
              path="/dashboard/api-data-mapping"
              element={
                <ProtectedRoute requiredRoles={["admin"]}>
                  <LazyPage><ApiDataMappingPage /></LazyPage>
                </ProtectedRoute>
              }
            />

            {/* Data Patterns for Admins */}
            <Route
              path="/dashboard/data-patterns"
              element={
                <ProtectedRoute requiredRoles={["admin"]}>
                  <LazyPage><DataPatternsPage /></LazyPage>
                </ProtectedRoute>
              }
            />

            {/* Backfill Manager for Admins */}
            <Route
              path="/dashboard/backfill"
              element={
                <ProtectedRoute requiredRoles={["admin"]}>
                  <LazyPage><BackfillManagerPage /></LazyPage>
                </ProtectedRoute>
              }
            />

            {/* User Management for Admins and Managers */}
            <Route
              path="/dashboard/user-management"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager"]}>
                  <LazyPage><UserManagementPage /></LazyPage>
                </ProtectedRoute>
              }
            />

            {/* API Syncing for Admin/Manager */}
            <Route
              path="/dashboard/api-syncing"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager"]}>
                  <LazyPage><ApiSyncingPage /></LazyPage>
                </ProtectedRoute>
              }
            />

            {/* Sync Skipped Records (Dev Tools) for Admin/Manager */}
            <Route
              path="/dashboard/sync-skipped-records"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager"]}>
                  <LazyPage><SyncSkippedRecordsPage /></LazyPage>
                </ProtectedRoute>
              }
            />

            {/* Bug Reports (Dev Tools) for Admin/Manager */}
            <Route
              path="/dashboard/bug-reports"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager"]}>
                  <LazyPage><BugReportsPage /></LazyPage>
                </ProtectedRoute>
              }
            />

            {/* Testing (Dev Tools) for Admin/Manager */}
            <Route
              path="/dashboard/testing"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager"]}>
                  <LazyPage><DevTestingPage /></LazyPage>
                </ProtectedRoute>
              }
            />

            {/* AI Feedback (Dev Tools) for Admin */}
            <Route
              path="/dashboard/ai-feedback"
              element={
                <ProtectedRoute requiredRoles={["admin"]}>
                  <LazyPage><AIFeedbackPage /></LazyPage>
                </ProtectedRoute>
              }
            />

            {/* Notification Examples (Dev Tools) for Admin/Manager */}
            <Route
              path="/dashboard/notification-examples"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager"]}>
                  <LazyPage><NotificationExamplesPage /></LazyPage>
                </ProtectedRoute>
              }
            />

            {/* Dev Updates (Dev Tools) for Admin only */}
            <Route
              path="/dashboard/dev-updates"
              element={
                <ProtectedRoute requiredRoles={["admin"]}>
                  <LazyPage><DevUpdatesPage /></LazyPage>
                </ProtectedRoute>
              }
            />

            {/* Profile Page for all authenticated users */}
            <Route
              path="/dashboard/profile"
              element={
                <ProtectedRoute>
                  <LazyPage><ProfilePage /></LazyPage>
                </ProtectedRoute>
              }
            />

            {/* Account Settings for all authenticated users */}
            <Route
              path="/dashboard/settings"
              element={
                <ProtectedRoute>
                  <LazyPage><AccountSettingsPage /></LazyPage>
                </ProtectedRoute>
              }
            />

            {/* OAuth callback - must not be caught by React Router */}
            <Route path="/~oauth" element={null} />

            {/* Notifications for all authenticated users */}
            <Route
              path="/dashboard/notifications"
              element={
                <ProtectedRoute>
                  <LazyPage><NotificationsPage /></LazyPage>
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
      </ActiveRoleProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
