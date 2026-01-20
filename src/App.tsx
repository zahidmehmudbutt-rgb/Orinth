import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          
          {/* Student Routes */}
          <Route path="/student/login" element={<StudentLogin />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          
          {/* Teacher Routes */}
          <Route path="/teacher/login" element={<TeacherLogin />} />
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          
          {/* Class Teacher Routes */}
          <Route path="/class-teacher/login" element={<ClassTeacherLogin />} />
          <Route path="/class-teacher/dashboard" element={<ClassTeacherDashboard />} />
          
          {/* Coordinator Routes */}
          <Route path="/coordinator/login" element={<CoordinatorLogin />} />
          <Route path="/coordinator/dashboard" element={<CoordinatorDashboard />} />
          
          {/* Principal Routes */}
          <Route path="/principal/login" element={<PrincipalLogin />} />
          <Route path="/principal/dashboard" element={<PrincipalDashboard />} />
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
