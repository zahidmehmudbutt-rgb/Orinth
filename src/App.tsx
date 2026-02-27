import "@/i18n/config";
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { FullPageLoader } from "@/components/ui/LoadingSpinner";
import SessionTimeout from "@/components/auth/SessionTimeout";
import { AnimatedRoutes } from "@/components/AnimatedRoutes";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { PWAUpdatePrompt } from "@/components/pwa/PWAUpdatePrompt";
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt";
import { KeyboardShortcuts } from "@/components/ui/KeyboardShortcuts";
import { OnlineGuard } from "@/components/pwa/OnlineGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Analytics } from "@vercel/analytics/react";

// Lazy-loaded dashboards
const StudentDashboard = lazy(() => import("./pages/student/StudentDashboard"));
const TeacherDashboard = lazy(() => import("./pages/teacher/TeacherDashboard"));
const ClassTeacherDashboard = lazy(() => import("./pages/class-teacher/ClassTeacherDashboard"));
const CoordinatorDashboard = lazy(() => import("./pages/coordinator/CoordinatorDashboard"));
const PrincipalDashboard = lazy(() => import("./pages/principal/PrincipalDashboard"));
const ParentDashboard = lazy(() => import("./pages/parent/ParentDashboard"));

// Lazy-loaded login pages
const StudentLogin = lazy(() => import("./pages/student/StudentLogin"));
const TeacherLogin = lazy(() => import("./pages/teacher/TeacherLogin"));
const ClassTeacherLogin = lazy(() => import("./pages/class-teacher/ClassTeacherLogin"));
const CoordinatorLogin = lazy(() => import("./pages/coordinator/CoordinatorLogin"));
const PrincipalLogin = lazy(() => import("./pages/principal/PrincipalLogin"));
const ParentLogin = lazy(() => import("./pages/parent/ParentLogin"));

// Lazy-loaded auth pages
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/auth/VerifyEmail"));

// Lazy-loaded public pages
const SchoolPublicPage = lazy(() => import("./pages/public/SchoolPublicPage"));

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <div aria-live="polite" aria-atomic="true" className="sr-only" id="aria-live-announcements" />
        <PWAUpdatePrompt />
        <PWAInstallPrompt />
        <KeyboardShortcuts />
        <BrowserRouter>
        <SessionTimeout />
        <Suspense fallback={<FullPageLoader />}>
          <OnlineGuard>
          <AnimatedRoutes>
          <Routes>
            <Route path="/" element={<Index />} />

            {/* Student Routes */}
            <Route path="/student/login" element={<StudentLogin />} />
            <Route path="/student/dashboard" element={
              <ProtectedRoute requiredRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            } />

            {/* Teacher Routes */}
            <Route path="/teacher/login" element={<TeacherLogin />} />
            <Route path="/teacher/dashboard" element={
              <ProtectedRoute requiredRole="teacher">
                <TeacherDashboard />
              </ProtectedRoute>
            } />

            {/* Class Teacher Routes */}
            <Route path="/class-teacher/login" element={<ClassTeacherLogin />} />
            <Route path="/class-teacher/dashboard" element={
              <ProtectedRoute requiredRole="class_teacher">
                <ClassTeacherDashboard />
              </ProtectedRoute>
            } />

            {/* Coordinator Routes */}
            <Route path="/coordinator/login" element={<CoordinatorLogin />} />
            <Route path="/coordinator/dashboard" element={
              <ProtectedRoute requiredRole="coordinator">
                <CoordinatorDashboard />
              </ProtectedRoute>
            } />

            {/* Principal Routes */}
            <Route path="/principal/login" element={<PrincipalLogin />} />
            <Route path="/principal/dashboard" element={
              <ProtectedRoute requiredRole="principal">
                <PrincipalDashboard />
              </ProtectedRoute>
            } />

            {/* Parent Routes */}
            <Route path="/parent/login" element={<ParentLogin />} />
            <Route path="/parent/dashboard" element={
              <ProtectedRoute requiredRole="parent">
                <ParentDashboard />
              </ProtectedRoute>
            } />

            {/* Auth Routes */}
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/auth/verify-email" element={<VerifyEmail />} />

            {/* Public School Page */}
            <Route path="/school/:schoolSlug" element={<SchoolPublicPage />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </AnimatedRoutes>
          </OnlineGuard>
        </Suspense>
      </BrowserRouter>
        <Analytics />
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
  </HelmetProvider>
  </ErrorBoundary>
);

export default App;
