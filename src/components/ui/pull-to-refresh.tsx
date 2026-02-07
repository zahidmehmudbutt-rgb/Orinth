import { useState, useRef, ReactNode } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
  disabled?: boolean;
}

export function PullToRefresh({
  children,
  onRefresh,
  className,
  disabled = false,
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const pullDistance = useMotionValue(0);

  const threshold = 80;
  const maxPull = 120;

  const opacity = useTransform(pullDistance, [0, threshold], [0, 1]);
  const scale = useTransform(pullDistance, [0, threshold], [0.5, 1]);
  const rotate = useTransform(pullDistance, [0, threshold, maxPull], [0, 180, 360]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;

    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;

    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;

    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 0) {
      // Resistance effect - pull gets harder as you go
      const resistance = 0.5;
      const pull = Math.min(diff * resistance, maxPull);
      pullDistance.set(pull);
    }
  };

  const handleTouchEnd = async () => {
    if (disabled || isRefreshing) return;

    const currentPull = pullDistance.get();

    if (currentPull >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    pullDistance.set(0);
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-auto", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <motion.div
        style={{ height: pullDistance, opacity }}
        className="absolute top-0 left-0 right-0 flex items-center justify-center overflow-hidden bg-muted/50"
      >
        <motion.div style={{ scale, rotate }}>
          <RefreshCw
            className={cn(
              "w-6 h-6 text-primary",
              isRefreshing && "animate-spin"
            )}
          />
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div style={{ y: pullDistance }}>
        {children}
      </motion.div>
    </div>
  );
}
