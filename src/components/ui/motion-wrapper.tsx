import { motion, useReducedMotion, type Variants } from "framer-motion";
import { type ReactNode } from "react";

// Fade in from bottom
export function FadeIn({
  children,
  delay = 0,
  duration = 0.5,
  className,
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Fade in when scrolled into view
export function FadeInView({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Staggered children container
const staggerItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

function getStaggerContainerVariants(delay: number): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: delay,
      },
    },
  };
}

export function StaggerContainer({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      variants={shouldReduceMotion ? undefined : getStaggerContainerVariants(delay)}
      initial={shouldReduceMotion ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      variants={shouldReduceMotion ? undefined : staggerItem}
      animate={shouldReduceMotion ? { opacity: 1, y: 0 } : undefined}
      transition={shouldReduceMotion ? { duration: 0 } : undefined}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Scale on hover (for cards)
export function HoverScale({
  children,
  className,
  scale = 1.02,
}: {
  children: ReactNode;
  className?: string;
  scale?: number;
}) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      whileHover={shouldReduceMotion ? {} : { scale, y: -4 }}
      whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Page transition wrapper
export function PageTransition({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.25 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
