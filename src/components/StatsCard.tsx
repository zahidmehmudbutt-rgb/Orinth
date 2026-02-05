import { LucideIcon } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { FadeInView } from "@/components/ui/motion-wrapper";

interface StatsCardProps {
  icon: LucideIcon;
  value: string;
  label: string;
}

export const StatsCard = ({ icon: Icon, value, label }: StatsCardProps) => {
  // Extract numeric value and suffix from string like "5,000+" or "15+"
  const numericMatch = value.match(/^([\d,]+)(.*)$/);
  const numericValue = numericMatch ? parseInt(numericMatch[1].replace(/,/g, ""), 10) : 0;
  const suffix = numericMatch ? numericMatch[2] : "";

  return (
    <FadeInView>
      <div className="flex flex-col items-center text-center group">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
          <Icon className="w-7 h-7 text-primary" />
        </div>
        <div className="text-3xl font-bold text-primary">
          <AnimatedCounter end={numericValue} suffix={suffix} duration={2.5} />
        </div>
        <div className="text-sm text-muted-foreground mt-1">{label}</div>
      </div>
    </FadeInView>
  );
};
