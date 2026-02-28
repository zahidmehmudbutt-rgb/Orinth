import { ReactNode } from "react";
import { motion } from "framer-motion";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { cn } from "@/lib/utils";

interface SmartHeaderProps {
  children: ReactNode;
  className?: string;
  hideOnScroll?: boolean;
}

export function SmartHeader({ children, className, hideOnScroll = true }: SmartHeaderProps) {
  const { scrollDirection, isAtTop } = useScrollDirection({ threshold: 10 });

  const shouldHide = hideOnScroll && scrollDirection === "down" && !isAtTop;

  return (
    <motion.header
      initial={{ y: 0 }}
      animate={{ y: shouldHide ? -100 : 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={cn(
        "w-full sticky top-0 z-50 transition-shadow relative overflow-hidden",
        !isAtTop && "shadow-md",
        className
      )}
    >
      {/* Animated mesh blob overlays */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[400px] h-[400px] -top-48 -right-20 rounded-full bg-white/10 blur-[80px] animate-[mesh-drift_20s_ease-in-out_infinite]" />
        <div className="absolute w-[300px] h-[300px] -bottom-32 -left-16 rounded-full bg-white/8 blur-[70px] animate-[mesh-drift_25s_ease-in-out_infinite_-8s]" />
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </motion.header>
  );
}
