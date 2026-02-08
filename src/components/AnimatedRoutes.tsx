import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

const pageVariants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: "easeOut" as const,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.15,
      ease: "easeIn" as const,
    },
  },
};

export const AnimatedRoutes = ({ children }: { children: ReactNode }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="enter"
        exit="exit"
        style={{ minHeight: "100vh" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
