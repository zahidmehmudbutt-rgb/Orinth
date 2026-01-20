import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  icon: LucideIcon;
  value: string;
  label: string;
}

export const StatsCard = ({ icon: Icon, value, label }: StatsCardProps) => {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-full border-2 border-primary/20 flex items-center justify-center mb-3">
        <Icon className="w-7 h-7 text-primary" />
      </div>
      <div className="text-3xl font-bold text-primary">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
};
