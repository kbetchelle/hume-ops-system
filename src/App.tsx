import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { ActiveRoleProvider } from "@/hooks/useActiveRole";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LanguageProvider } from "@/contexts/LanguageContext";

// Public pages
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";

// Auth pages
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Onboarding from "./pages/auth/Onboarding";

// Dashboard pages
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import ManagerDashboard from "./pages/dashboards/ManagerDashboard";
import ConciergeDashboard from "./pages/dashboards/ConciergeDashboard";
import TrainerDashboard from "./pages/dashboards/TrainerDashboard";
import SpaDashboard from "./pages/dashboards/SpaDashboard";
import FloaterDashboard from "./pages/dashboards/FloaterDashboard";
import MembersPage from "./pages/dashboards/MembersPage";

// Member sub-pages
import AllClientsPage from "./pages/members/AllClientsPage";
import GuestsPage from "./pages/members/GuestsPage";
import ApplicationSubmittedPage from "./pages/members/ApplicationSubmittedPage";
import WaitlistPage from "./pages/members/WaitlistPage";
import OnboardingMembersPage from "./pages/members/OnboardingPage";
import SubscriptionActivePage from "./pages/members/SubscriptionActivePage";
import SubscriptionPastDuePage from "./pages/members/SubscriptionPastDuePage";
import TemporaryMembershipsPage from "./pages/members/TemporaryMembershipsPage";
import PausesPage from "./pages/members/PausesPage";
import CancellationsPage from "./pages/members/CancellationsPage";
import ChecklistsManagementPage from "./pages/dashboards/ChecklistsManagementPage";
import MyChecklistsPage from "./pages/dashboards/MyChecklistsPage";
import CommunicationsPage from "./pages/dashboards/CommunicationsPage";
import MemberCommunicationsHub from "./components/communications/MemberCommunicationsHub";
import ShiftReportPage from "./pages/dashboards/ShiftReportPage";
import ReportsPage from "./pages/dashboards/ReportsPage";
import TrainingPlansPage from "./pages/dashboards/TrainingPlansPage";
import PublicPlanPage from "./pages/PublicPlanPage";
import FacilityManagementPage from "./pages/dashboards/FacilityManagementPage";
import AnalyticsDashboard from "./pages/dashboards/AnalyticsDashboard";
import SlingUserManagement from "./pages/admin/SlingUserManagement";
import SyncManagementPage from "./pages/admin/SyncManagementPage";
import BackfillManagerPage from "./pages/admin/BackfillManagerPage";
import StaffAnnouncementsPage from "./pages/admin/StaffAnnouncementsPage";
import UserManagementPage from "./pages/admin/UserManagementPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

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
            <Route path="/unauthorized" element={<Unauthorized />} />

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
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/manager"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager"]}>
                  <ManagerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/concierge"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "concierge"]}>
                  <ConciergeDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/trainer"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "trainer"]}>
                  <TrainerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/spa"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "female_spa_attendant", "male_spa_attendant"]}>
                  <SpaDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/floater"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "floater"]}>
                  <FloaterDashboard />
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
                  <AllClientsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/members/guests"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "trainer"]}>
                  <GuestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/members/application-submitted"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "trainer"]}>
                  <ApplicationSubmittedPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/members/waitlist"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "trainer"]}>
                  <WaitlistPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/members/onboarding"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "trainer"]}>
                  <OnboardingMembersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/members/subscription-active"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "trainer"]}>
                  <SubscriptionActivePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/members/subscription-past-due"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "trainer"]}>
                  <SubscriptionPastDuePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/members/temporary-memberships"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "trainer"]}>
                  <TemporaryMembershipsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/members/pauses"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "trainer"]}>
                  <PausesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/members/cancellations"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "trainer"]}>
                  <CancellationsPage />
                </ProtectedRoute>
              }
            />

            {/* Checklists management for managers */}
            <Route
              path="/dashboard/checklists"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager"]}>
                  <ChecklistsManagementPage />
                </ProtectedRoute>
              }
            />

            {/* My checklists for staff roles */}
            <Route
              path="/dashboard/my-checklists"
              element={
                <ProtectedRoute requiredRoles={["concierge", "female_spa_attendant", "male_spa_attendant", "floater"]}>
                  <MyChecklistsPage />
                </ProtectedRoute>
              }
            />

            {/* Communications - accessible to all authenticated users */}
            <Route
              path="/dashboard/communications"
              element={
                <ProtectedRoute>
                  <CommunicationsPage />
                </ProtectedRoute>
              }
            />

            {/* Member Communications Hub for Concierges */}
            <Route
              path="/dashboard/member-communications"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "concierge", "trainer"]}>
                  <MemberCommunicationsHub />
                </ProtectedRoute>
              }
            />

            {/* Shift Report for Concierges */}
            <Route
              path="/dashboard/shift-report"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "concierge"]}>
                  <ShiftReportPage />
                </ProtectedRoute>
              }
            />

            {/* Reports & Analytics */}
            <Route
              path="/dashboard/reports"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager"]}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />

            {/* Training Plans for Trainers */}
            <Route
              path="/dashboard/training-plans"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "trainer"]}>
                  <TrainingPlansPage />
                </ProtectedRoute>
              }
            />

            {/* Public Plan View (no auth required) */}
            <Route path="/plan/:shareSlug" element={<PublicPlanPage />} />

            {/* Facility Management for Managers */}
            <Route
              path="/dashboard/facility"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager"]}>
                  <FacilityManagementPage />
                </ProtectedRoute>
              }
            />

            {/* Analytics Dashboard for Managers */}
            <Route
              path="/dashboard/analytics"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager"]}>
                  <AnalyticsDashboard />
                </ProtectedRoute>
              }
            />

            {/* Staff Announcements for Managers */}
            <Route
              path="/dashboard/staff-announcements"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager"]}>
                  <StaffAnnouncementsPage />
                </ProtectedRoute>
              }
            />

            {/* Sling User Management for Admins */}
            <Route
              path="/dashboard/sling-users"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager"]}>
                  <SlingUserManagement />
                </ProtectedRoute>
              }
            />

            {/* Sync Management for Admins */}
            <Route
              path="/dashboard/sync-management"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager"]}>
                  <SyncManagementPage />
                </ProtectedRoute>
              }
            />

            {/* Backfill Manager for Admins */}
            <Route
              path="/dashboard/backfill"
              element={
                <ProtectedRoute requiredRoles={["admin"]}>
                  <BackfillManagerPage />
                </ProtectedRoute>
              }
            />

            {/* User Management for Admins */}
            <Route
              path="/dashboard/user-management"
              element={
                <ProtectedRoute requiredRoles={["admin"]}>
                  <UserManagementPage />
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
