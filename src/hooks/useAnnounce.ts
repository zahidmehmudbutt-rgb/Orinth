import { useCallback } from "react";

/**
 * Returns a function that announces a message to screen readers
 * via the global aria-live region (#aria-live-announcements in App.tsx).
 */
export function useAnnounce() {
  return useCallback((message: string) => {
    const el = document.getElementById("aria-live-announcements");
    if (!el) return;
    // Clear then set to ensure repeat announcements are read
    el.textContent = "";
    requestAnimationFrame(() => {
      el.textContent = message;
    });
  }, []);
}
