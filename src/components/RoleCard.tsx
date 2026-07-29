import { memo } from "react";
import { LucideIcon, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
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
    <Link
      to={href}
      className="group flex h-full flex-col rounded-xl border border-border bg-card p-6 transition-colors duration-200 hover:border-primary/40"
    >
      <div className={`w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center mb-4`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2 tracking-tight">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed mb-5 flex-1">{description}</p>
      <div className="flex items-center gap-1.5 text-sm font-medium text-primary">
        {t("roleCard.enterPortal")}
        <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
});
