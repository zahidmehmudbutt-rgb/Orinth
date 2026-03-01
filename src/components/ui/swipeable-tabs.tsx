import { ReactNode, useCallback } from "react";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";

interface SwipeableTabContentProps {
  children: ReactNode;
  activeTab: string;
  tabOrder: string[];
  onTabChange: (tab: string) => void;
  className?: string;
}

export function SwipeableTabContent({
  children,
  activeTab,
  tabOrder,
  onTabChange,
  className,
}: SwipeableTabContentProps) {
  const goToNext = useCallback(() => {
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex !== -1 && currentIndex < tabOrder.length - 1) {
      onTabChange(tabOrder[currentIndex + 1]);
    }
  }, [activeTab, tabOrder, onTabChange]);

  const goToPrev = useCallback(() => {
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex > 0) {
      onTabChange(tabOrder[currentIndex - 1]);
    }
  }, [activeTab, tabOrder, onTabChange]);

  const { onTouchStart, onTouchMove, onTouchEnd } = useSwipeNavigation({
    onSwipeLeft: goToNext,
    onSwipeRight: goToPrev,
  });

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className={className}
    >
      {children}
    </div>
  );
}
