import { memo } from "react";
import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface RoleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  colorClass: string;
}

export const RoleCard = memo(function RoleCard({ title, description, icon: Icon, href, colorClass }: RoleCardProps) {
  const { t } = useTranslation();
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Link
        to={href}
        className="group flex flex-col p-6 bg-card/80 dark:bg-card/70 backdrop-blur-xl rounded-xl shadow-card hover:shadow-card-hover transition-all duration-300 border border-white/20 dark:border-white/[0.08] hover:border-primary/30 dark:hover:border-primary/25 h-full"
      >
        <div className={`w-14 h-14 rounded-xl ${colorClass} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4 flex-1">{description}</p>
        <div className="flex items-center text-primary font-medium text-sm group-hover:gap-2 transition-all duration-300">
          {t("roleCard.enterPortal")}
          <svg
            className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>
    </motion.div>
  );
});
