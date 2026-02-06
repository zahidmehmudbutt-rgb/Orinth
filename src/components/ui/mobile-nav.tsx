import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface MobileNavProps {
  items: NavItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  accentColor?: string;
}

export function MobileNav({ items, activeTab, onTabChange, accentColor = "bg-primary" }: MobileNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-50 md:hidden safe-area-bottom" aria-label="Mobile navigation">
      <div className="flex items-center justify-around px-2 py-1 landscape-compact:py-0.5">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center justify-center py-2 px-3 min-w-[64px] min-h-[44px] rounded-xl transition-all landscape-compact:py-1 landscape-compact:min-w-0 landscape-compact:px-2",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className={cn("absolute inset-0 rounded-xl", accentColor, "opacity-10")}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <div className="relative">
                <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full flex items-center justify-center animate-badge-pulse">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[11px] font-medium mt-1 transition-colors landscape-compact:hidden",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
