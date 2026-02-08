import { memo } from "react";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface TourHelpButtonProps {
  onClick: () => void;
  className?: string;
}

export const TourHelpButton = memo(function TourHelpButton({ onClick, className }: TourHelpButtonProps) {
  const { t } = useTranslation();
  return (
    <div className={cn("fixed z-40 left-4 bottom-20 md:bottom-6", className)}>
      <Button
        variant="outline"
        size="icon"
        className="w-12 h-12 rounded-full shadow-lg bg-card border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        onClick={onClick}
        aria-label={t("tour.helpButton")}
        title={t("tour.helpButton")}
      >
        <HelpCircle className="w-5 h-5" />
      </Button>
    </div>
  );
});
