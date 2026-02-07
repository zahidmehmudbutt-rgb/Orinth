import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TourHelpButtonProps {
  onClick: () => void;
  className?: string;
}

export function TourHelpButton({ onClick, className }: TourHelpButtonProps) {
  return (
    <div className={cn("fixed z-40 left-4 bottom-20 md:bottom-6", className)}>
      <Button
        variant="outline"
        size="icon"
        className="w-12 h-12 rounded-full shadow-lg bg-card border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        onClick={onClick}
        aria-label="Take a guided tour"
        title="Take a guided tour"
      >
        <HelpCircle className="w-5 h-5" />
      </Button>
    </div>
  );
}
