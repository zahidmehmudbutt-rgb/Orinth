import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      try {
        const dismissed = localStorage.getItem("pwa-install-dismissed");
        if (!dismissed || Date.now() - parseInt(dismissed) > 7 * 24 * 60 * 60 * 1000) {
          setShowBanner(true);
        }
      } catch {
        setShowBanner(true);
      }
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    try {
      localStorage.setItem("pwa-install-dismissed", Date.now().toString());
    } catch { /* private browsing */ }
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:bottom-4 sm:w-96 z-50 bg-card border border-border rounded-xl shadow-lg p-4 flex items-start gap-3">
      <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shrink-0">
        <Download className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm">Install School Smart</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Install for quick access and offline support
        </p>
        <div className="flex gap-2 mt-2">
          <Button size="sm" onClick={handleInstall} className="text-xs h-8">
            Install
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDismiss} className="text-xs h-8">
            Not now
          </Button>
        </div>
      </div>
      <button
        onClick={handleDismiss}
        className="text-muted-foreground hover:text-foreground p-1"
        aria-label="Dismiss install prompt"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
