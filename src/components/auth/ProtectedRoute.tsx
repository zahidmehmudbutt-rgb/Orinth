import { useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShieldAlert } from "lucide-react";
import type { AppRole } from "@/lib/auth";
import { useTranslation } from "react-i18next";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole: AppRole;
  redirectTo?: string;
}

/**
 * Protected route component that enforces role-based access control.
 * Blocks access and redirects non-authorized users.
 */
const ProtectedRoute = ({ children, requiredRole, redirectTo }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, roles, loading, isPrincipal, isCoordinator, isClassTeacher, isTeacher, isStudent, isParent } = useAuth();

  // Map roles to their boolean flags
  const roleCheckMap: Record<AppRole, boolean> = {
    principal: isPrincipal,
    coordinator: isCoordinator,
    class_teacher: isClassTeacher,
    teacher: isTeacher,
    student: isStudent,
    parent: isParent,
  };

  // Map roles to their login pages
  const loginPageMap: Record<AppRole, string> = {
    principal: "/principal/login",
    coordinator: "/coordinator/login",
    class_teacher: "/class-teacher/login",
    teacher: "/teacher/login",
    student: "/student/login",
    parent: "/parent/login",
  };

  const hasRequiredRole = roleCheckMap[requiredRole];
  const loginPage = redirectTo || loginPageMap[requiredRole];

  useEffect(() => {
    if (!loading) {
      // If not logged in at all, redirect to login
      if (!user) {
        navigate(loginPage, { replace: true });
        return;
      }

      // If logged in but doesn't have the required role
      if (!hasRequiredRole) {
        // For security, sign them out if trying to access wrong role's dashboard
        supabase.auth.signOut().then(() => {
          navigate(loginPage, { replace: true });
        });
      }
    }
  }, [loading, user, hasRequiredRole, navigate, loginPage]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{t("protectedRoute.verifying")}</p>
        </div>
      </div>
    );
  }

  // If not authenticated or doesn't have role, show access denied briefly before redirect
  if (!user || !hasRequiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center p-8">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-xl font-bold text-foreground">{t("protectedRoute.accessDenied")}</h1>
          <p className="text-muted-foreground max-w-sm">
            {t("protectedRoute.noPermission")}
          </p>
        </div>
      </div>
    );
  }

  // User is authenticated and has the required role
  return <>{children}</>;
};

export default ProtectedRoute;
