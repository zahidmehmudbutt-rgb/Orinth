import { useRegisterSW } from "virtual:pwa-register/react";
import { useTranslation } from "react-i18next";
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
        const id = setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
        // Cleanup handled by useRegisterSW lifecycle; store for safety
        return () => clearInterval(id);
      }
    },
    onRegisterError(error) {
      if (import.meta.env.DEV) console.error("SW registration error:", error);
    },
  });

  const { t } = useTranslation();

  useEffect(() => {
    if (offlineReady) {
      toast.success(t("pwa.offlineReady"), {
        description: t("pwa.offlineReadyDesc"),
        duration: 5000,
      });
    }
  }, [offlineReady]);

  useEffect(() => {
    if (needRefresh) {
      toast(t("pwa.updateAvailable"), {
        description: t("pwa.updateAvailableDesc"),
        action: {
          label: t("pwa.update"),
          onClick: () => updateServiceWorker(true),
        },
        duration: Infinity,
      });
    }
  }, [needRefresh, updateServiceWorker]);

  return null;
}
