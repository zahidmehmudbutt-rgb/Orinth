import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  completed: boolean;
  onClick?: () => void;
}

interface OnboardingChecklistProps {
  title: string;
  subtitle?: string;
  items: ChecklistItem[];
  className?: string;
}

export function OnboardingChecklist({ title, subtitle, items, className }: OnboardingChecklistProps) {
  const { t } = useTranslation();
  const completedCount = items.filter(item => item.completed).length;
  const progress = (completedCount / items.length) * 100;

  return (
    <div className={cn("bg-card rounded-xl p-6 shadow-card border border-border", className)}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        
        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">{t("onboarding.progress")}</span>
            <span className="font-medium text-foreground">{t("onboarding.completed", { completed: completedCount, total: items.length })}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-primary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            disabled={item.completed}
            className={cn(
              "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors",
              item.completed 
                ? "bg-success/5 cursor-default" 
                : "bg-muted/50 hover:bg-muted cursor-pointer"
            )}
          >
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
              item.completed 
                ? "bg-success text-success-foreground" 
                : "bg-muted-foreground/20"
            )}>
              {item.completed ? (
                <Check className="w-4 h-4" />
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn(
                "font-medium",
                item.completed ? "text-muted-foreground line-through" : "text-foreground"
              )}>
                {item.label}
              </p>
              {item.description && (
                <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
