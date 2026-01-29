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

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
