import { ReactNode } from "react";
import { motion } from "framer-motion";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { cn } from "@/lib/utils";

interface SmartHeaderProps extends React.HTMLAttributes<HTMLElement> {
  children: ReactNode;
  className?: string;
  hideOnScroll?: boolean;
}

export function SmartHeader({ children, className, hideOnScroll = true, ...rest }: SmartHeaderProps) {
  const { scrollDirection, isAtTop } = useScrollDirection({ threshold: 10 });

  const shouldHide = hideOnScroll && scrollDirection === "down" && !isAtTop;

  return (
    <motion.header
      initial={{ y: 0 }}
      animate={{ y: shouldHide ? -100 : 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={cn(
        "w-full sticky top-0 z-50 transition-shadow",
        !isAtTop && "shadow-md",
        className
      )}
      {...rest}
    >
      {children}
    </motion.header>
  );
}
