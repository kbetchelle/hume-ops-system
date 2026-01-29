import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Public pages
import Index from "./pages/Index";
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
import ChecklistsManagementPage from "./pages/dashboards/ChecklistsManagementPage";
import MyChecklistsPage from "./pages/dashboards/MyChecklistsPage";
import CommunicationsPage from "./pages/dashboards/CommunicationsPage";
import MemberCommunicationsHub from "./components/communications/MemberCommunicationsHub";
import ShiftReportPage from "./pages/dashboards/ShiftReportPage";
import ReportsPage from "./pages/dashboards/ReportsPage";
import TrainingPlansPage from "./pages/dashboards/TrainingPlansPage";
import PublicPlanPage from "./pages/PublicPlanPage";
import FacilityManagementPage from "./pages/dashboards/FacilityManagementPage";

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
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
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

            {/* Members page for managers and trainers */}
            <Route
              path="/dashboard/members"
              element={
                <ProtectedRoute requiredRoles={["admin", "manager", "trainer"]}>
                  <MembersPage />
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

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
