import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import SessionTimeout from "@/components/auth/SessionTimeout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Student
import StudentLogin from "./pages/student/StudentLogin";
import StudentDashboard from "./pages/student/StudentDashboard";

// Teacher
import TeacherLogin from "./pages/teacher/TeacherLogin";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";

// Class Teacher
import ClassTeacherLogin from "./pages/class-teacher/ClassTeacherLogin";
import ClassTeacherDashboard from "./pages/class-teacher/ClassTeacherDashboard";

// Coordinator
import CoordinatorLogin from "./pages/coordinator/CoordinatorLogin";
import CoordinatorDashboard from "./pages/coordinator/CoordinatorDashboard";

// Principal
import PrincipalLogin from "./pages/principal/PrincipalLogin";
import PrincipalDashboard from "./pages/principal/PrincipalDashboard";

// Parent
import ParentLogin from "./pages/parent/ParentLogin";
import ParentDashboard from "./pages/parent/ParentDashboard";

// Auth
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import VerifyEmail from "./pages/auth/VerifyEmail";

// Public
import SchoolPublicPage from "./pages/public/SchoolPublicPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <SessionTimeout />
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
      </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
