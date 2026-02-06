import { useRegisterSW } from "virtual:pwa-register/react";
import { toast } from "sonner";
import { useEffect } from "react";

export function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      if (import.meta.env.DEV) console.error("SW registration error:", error);
    },
  });

  useEffect(() => {
    if (offlineReady) {
      toast.success("App ready for offline use", {
        description: "School Smart Pakistan can now work offline.",
        duration: 5000,
      });
    }
  }, [offlineReady]);

  useEffect(() => {
    if (needRefresh) {
      toast("Update available", {
        description: "A new version of School Smart Pakistan is available.",
        action: {
          label: "Update",
          onClick: () => updateServiceWorker(true),
        },
        duration: Infinity,
      });
    }
  }, [needRefresh, updateServiceWorker]);

  return null;
}
