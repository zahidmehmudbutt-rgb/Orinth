import { LucideIcon, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WelcomeBannerProps {
  icon: LucideIcon;
  title: string;
  description: string;
  tips?: string[];
  dismissible?: boolean;
  storageKey?: string;
  className?: string;
  accentColor?: string;
}

export function WelcomeBanner({
  icon: Icon,
  title,
  description,
  tips,
  dismissible = true,
  storageKey,
  className,
  accentColor = "bg-primary",
}: WelcomeBannerProps) {
  const [dismissed, setDismissed] = useState(() => {
    if (storageKey) {
      return localStorage.getItem(storageKey) === "true";
    }
    return false;
  });
  const { t } = useTranslation();

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    if (storageKey) {
      localStorage.setItem(storageKey, "true");
    }
  };

  return (
    <div className={cn(
      "relative bg-card rounded-xl p-6 shadow-card border border-border overflow-hidden",
      className
    )}>
      {/* Accent bar */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1", accentColor)} />
      
      {dismissible && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
          onClick={handleDismiss}
        >
          <X className="w-4 h-4" />
        </Button>
      )}

      <div className="flex gap-4">
        <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0", accentColor, "text-primary-foreground")}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0 pr-8">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-muted-foreground mt-1">{description}</p>
          
          {tips && tips.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-foreground">{t("welcomeBanner.quickTips")}</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
