import { type ReactNode, useRef } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useTranslation } from "react-i18next";
import { WifiOff } from "lucide-react";
import Offline from "@/pages/Offline";

/**
 * OnlineGuard wraps the app content:
 * - First load while offline → shows the full Offline page.
 * - Goes offline after content has already rendered → shows a compact
 *   banner at the top while keeping the cached content visible.
 */
export function OnlineGuard({ children }: { children: ReactNode }) {
  const isOnline = useOnlineStatus();
  const { t } = useTranslation();
  const hasRendered = useRef(false);

  // Track whether we've ever rendered children successfully
  if (isOnline) {
    hasRendered.current = true;
  }

  // Never rendered content before → show full offline page
  if (!isOnline && !hasRendered.current) {
    return <Offline />;
  }

  return (
    <>
      {!isOnline && (
        <div
          className="bg-warning/90 text-warning-foreground text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-2 sticky top-0 z-[100]"
          role="alert"
        >
          <WifiOff className="w-4 h-4" />
          {t("offline.banner", "You are offline. Some features may be unavailable.")}
        </div>
      )}
      {children}
    </>
  );
}
