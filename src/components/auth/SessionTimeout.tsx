import { useEffect, useCallback, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const DEFAULT_TIMEOUT_MINUTES = 30;
const WARNING_BEFORE_LOGOUT_SECONDS = 60;
const ACTIVITY_DEBOUNCE_MS = 1000; // Debounce activity events by 1 second

export default function SessionTimeout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(WARNING_BEFORE_LOGOUT_SECONDS);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const activityDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const cachedTimeoutMinutesRef = useRef<number | null>(null);
  const isAuthPage = location.pathname.startsWith("/auth/") ||
                     location.pathname.includes("/login") ||
                     location.pathname === "/";

  const clearAllTimeouts = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (activityDebounceRef.current) clearTimeout(activityDebounceRef.current);
  }, []);

  const handleLogout = useCallback(async () => {
    clearAllTimeouts();
    setShowWarning(false);

    await supabase.auth.signOut();

    toast({
      variant: "destructive",
      title: t("session.expired"),
      description: t("session.expiredDesc"),
    });

    navigate("/");
  }, [clearAllTimeouts, navigate, toast]);

  const startCountdown = useCallback(() => {
    setCountdown(WARNING_BEFORE_LOGOUT_SECONDS);
    setShowWarning(true);

    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [handleLogout]);

  const resetTimeout = useCallback(async (forceRefresh = false) => {
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    setShowWarning(false);

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || isAuthPage) return;

    // Get user's timeout preference (use cache if available)
    let timeoutMinutes = cachedTimeoutMinutesRef.current;

    if (timeoutMinutes === null || forceRefresh) {
      timeoutMinutes = DEFAULT_TIMEOUT_MINUTES;
      try {
        const { data: prefs, error } = await supabase
          .from("user_preferences")
          .select("session_timeout_minutes")
          .eq("user_id", session.user.id)
          .single();

        if (!error && prefs?.session_timeout_minutes) {
          timeoutMinutes = prefs.session_timeout_minutes;
        }
      } catch {
        // Use default if table/preferences don't exist
      }
      cachedTimeoutMinutesRef.current = timeoutMinutes;
    }

    const timeoutMs = (timeoutMinutes * 60 - WARNING_BEFORE_LOGOUT_SECONDS) * 1000;

    // Set warning timeout
    warningTimeoutRef.current = setTimeout(() => {
      startCountdown();
    }, timeoutMs);

  }, [isAuthPage, startCountdown]);

  const handleContinueSession = useCallback(() => {
    clearAllTimeouts();
    setShowWarning(false);
    resetTimeout();
  }, [clearAllTimeouts, resetTimeout]);

  // Set up activity listeners with debouncing
  useEffect(() => {
    if (isAuthPage) return;

    const events = ["mousedown", "keydown", "touchstart", "scroll"];

    const handleActivity = () => {
      if (!showWarning) {
        // Debounce activity events to avoid excessive calls
        if (activityDebounceRef.current) {
          clearTimeout(activityDebounceRef.current);
        }
        activityDebounceRef.current = setTimeout(() => {
          resetTimeout();
        }, ACTIVITY_DEBOUNCE_MS);
      }
    };

    // Initial timeout setup
    resetTimeout(true);

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      clearAllTimeouts();
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [isAuthPage, resetTimeout, showWarning, clearAllTimeouts]);

  // Don't render anything on auth pages
  if (isAuthPage) return null;

  return (
    <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("session.expiringTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("session.expiringDesc", { countdown })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleLogout}>
            {t("session.logOutNow")}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleContinueSession}>
            {t("session.continueSession")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
