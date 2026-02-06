import { ReactNode, useCallback, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";

interface SwipeableTabContentProps {
  children: ReactNode;
  activeTab: string;
  tabOrder: string[];
  onTabChange: (tab: string) => void;
  className?: string;
}

const variants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -60 : 60,
    opacity: 0,
  }),
};

export function SwipeableTabContent({
  children,
  activeTab,
  tabOrder,
  onTabChange,
  className,
}: SwipeableTabContentProps) {
  const [direction, setDirection] = useState(0);
  const prevTab = useRef(activeTab);
  const shouldReduceMotion = useReducedMotion();

  // Track direction when activeTab changes (from any source — swipe, click, or bottom nav)
  useEffect(() => {
    if (prevTab.current !== activeTab) {
      const prevIndex = tabOrder.indexOf(prevTab.current);
      const newIndex = tabOrder.indexOf(activeTab);
      if (prevIndex !== -1 && newIndex !== -1) {
        setDirection(newIndex > prevIndex ? 1 : -1);
      }
      prevTab.current = activeTab;
    }
  }, [activeTab, tabOrder]);

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
      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.div
          key={activeTab}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
