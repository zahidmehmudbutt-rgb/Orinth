import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type IllustrationVariant =
  | "no-homework"
  | "no-students"
  | "no-attendance"
  | "no-messages"
  | "no-notifications"
  | "no-results"
  | "no-data"
  | "error";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  illustration?: IllustrationVariant;
}

function Illustration({ variant }: { variant: IllustrationVariant }) {
  const commonClasses = "w-40 h-40 mb-2";

  switch (variant) {
    case "no-homework":
      return (
        <svg className={commonClasses} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="80" className="fill-primary/5" />
          <rect x="55" y="40" width="90" height="115" rx="8" className="fill-background stroke-primary/20" strokeWidth="2" />
          <rect x="55" y="40" width="90" height="28" rx="8" className="fill-primary/10" />
          <line x1="72" y1="85" x2="128" y2="85" className="stroke-muted-foreground/20" strokeWidth="2" strokeLinecap="round" />
          <line x1="72" y1="100" x2="118" y2="100" className="stroke-muted-foreground/20" strokeWidth="2" strokeLinecap="round" />
          <line x1="72" y1="115" x2="108" y2="115" className="stroke-muted-foreground/20" strokeWidth="2" strokeLinecap="round" />
          <line x1="72" y1="130" x2="98" y2="130" className="stroke-muted-foreground/20" strokeWidth="2" strokeLinecap="round" />
          <circle cx="145" cy="140" r="28" className="fill-background stroke-primary/30" strokeWidth="2" />
          <path d="M135 140 L142 147 L155 133" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );
    case "no-students":
      return (
        <svg className={commonClasses} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="80" className="fill-primary/5" />
          <circle cx="80" cy="80" r="18" className="fill-primary/10 stroke-primary/20" strokeWidth="2" />
          <path d="M55 130 C55 108 105 108 105 130" className="fill-primary/10 stroke-primary/20" strokeWidth="2" />
          <circle cx="125" cy="75" r="15" className="fill-muted stroke-muted-foreground/20" strokeWidth="2" strokeDasharray="4 4" />
          <path d="M103 120 C103 102 147 102 147 120" className="fill-muted stroke-muted-foreground/20" strokeWidth="2" strokeDasharray="4 4" />
          <circle cx="140" cy="140" r="22" className="fill-background stroke-primary/30" strokeWidth="2" />
          <line x1="132" y1="140" x2="148" y2="140" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="140" y1="132" x2="140" y2="148" className="stroke-primary" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case "no-attendance":
      return (
        <svg className={commonClasses} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="80" className="fill-primary/5" />
          <rect x="50" y="45" width="100" height="110" rx="8" className="fill-background stroke-primary/20" strokeWidth="2" />
          <rect x="50" y="45" width="100" height="30" rx="8" className="fill-primary/10" />
          {[0, 1, 2, 3].map((row) =>
            [0, 1, 2, 3].map((col) => (
              <rect
                key={`${row}-${col}`}
                x={65 + col * 22}
                y={88 + row * 16}
                width="14"
                height="10"
                rx="2"
                className={
                  row === 0 && col < 3 ? "fill-green-500/20 stroke-green-500/30" :
                  row === 1 && col === 2 ? "fill-red-500/20 stroke-red-500/30" :
                  row < 2 ? "fill-green-500/20 stroke-green-500/30" :
                  "fill-muted stroke-muted-foreground/10"
                }
                strokeWidth="1"
              />
            ))
          )}
        </svg>
      );
    case "no-messages":
      return (
        <svg className={commonClasses} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="80" className="fill-primary/5" />
          <path d="M50 70 C50 62 58 55 66 55 H134 C142 55 150 62 150 70 V115 C150 123 142 130 134 130 H90 L70 148 V130 H66 C58 130 50 123 50 115 Z" className="fill-background stroke-primary/20" strokeWidth="2" />
          <line x1="72" y1="80" x2="128" y2="80" className="stroke-muted-foreground/20" strokeWidth="2" strokeLinecap="round" />
          <line x1="72" y1="95" x2="115" y2="95" className="stroke-muted-foreground/20" strokeWidth="2" strokeLinecap="round" />
          <line x1="72" y1="110" x2="100" y2="110" className="stroke-muted-foreground/20" strokeWidth="2" strokeLinecap="round" />
          <circle cx="100" cy="92" r="6" className="fill-muted-foreground/10" />
          <circle cx="100" cy="92" r="2" className="fill-muted-foreground/30" />
        </svg>
      );
    case "no-notifications":
      return (
        <svg className={commonClasses} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="80" className="fill-primary/5" />
          <path d="M100 55 C80 55 65 70 65 90 V110 L55 125 H145 L135 110 V90 C135 70 120 55 100 55Z" className="fill-background stroke-primary/20" strokeWidth="2" />
          <path d="M90 125 C90 135 95 142 100 142 C105 142 110 135 110 125" className="stroke-primary/20" strokeWidth="2" fill="none" />
          <line x1="100" y1="45" x2="100" y2="55" className="stroke-primary/30" strokeWidth="2" strokeLinecap="round" />
          <text x="100" y="100" textAnchor="middle" className="fill-muted-foreground/30 text-[32px] font-bold" fontFamily="sans-serif">z</text>
          <text x="115" y="88" textAnchor="middle" className="fill-muted-foreground/20 text-[24px] font-bold" fontFamily="sans-serif">z</text>
        </svg>
      );
    case "no-results":
      return (
        <svg className={commonClasses} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="80" className="fill-primary/5" />
          <circle cx="90" cy="90" r="35" className="fill-background stroke-primary/20" strokeWidth="2" />
          <line x1="115" y1="115" x2="145" y2="145" className="stroke-primary/30" strokeWidth="4" strokeLinecap="round" />
          <line x1="78" y1="85" x2="102" y2="85" className="stroke-muted-foreground/20" strokeWidth="2" strokeLinecap="round" />
          <line x1="78" y1="95" x2="95" y2="95" className="stroke-muted-foreground/20" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "error":
      return (
        <svg className={commonClasses} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="80" className="fill-destructive/5" />
          <circle cx="100" cy="100" r="40" className="fill-background stroke-destructive/20" strokeWidth="2" />
          <line x1="100" y1="80" x2="100" y2="105" className="stroke-destructive/50" strokeWidth="3" strokeLinecap="round" />
          <circle cx="100" cy="118" r="3" className="fill-destructive/50" />
        </svg>
      );
    default:
      return (
        <svg className={commonClasses} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="80" className="fill-primary/5" />
          <rect x="60" y="55" width="80" height="90" rx="8" className="fill-background stroke-primary/20" strokeWidth="2" />
          <line x1="78" y1="80" x2="122" y2="80" className="stroke-muted-foreground/20" strokeWidth="2" strokeLinecap="round" />
          <line x1="78" y1="95" x2="115" y2="95" className="stroke-muted-foreground/20" strokeWidth="2" strokeLinecap="round" />
          <line x1="78" y1="110" x2="105" y2="110" className="stroke-muted-foreground/20" strokeWidth="2" strokeLinecap="round" />
          <circle cx="100" cy="100" r="4" className="fill-muted-foreground/10" />
        </svg>
      );
  }
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  illustration,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {illustration ? (
        <div className="animate-float">
          <Illustration variant={illustration} />
        </div>
      ) : (
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 animate-float">
          <Icon className="w-8 h-8 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-6">{description}</p>
      <div className="flex flex-col sm:flex-row gap-3">
        {actionLabel && onAction && (
          <Button onClick={onAction} className="bg-gradient-primary text-primary-foreground">
            {actionLabel}
          </Button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <Button variant="outline" onClick={onSecondaryAction}>
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
