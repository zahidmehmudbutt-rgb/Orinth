import { memo } from "react";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";

interface TourHelpButtonProps {
  onClick: () => void;
}

export const TourHelpButton = memo(function TourHelpButton({ onClick }: TourHelpButtonProps) {
  const { t } = useTranslation();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed left-4 bottom-20 md:bottom-6 z-40 rounded-full shadow-lg bg-card hover:bg-accent h-10 w-10"
          onClick={onClick}
          aria-label={t("tour.helpButton", "Take a guided tour")}
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{t("tour.helpButton", "Take a guided tour")}</p>
      </TooltipContent>
    </Tooltip>
  );
});
