import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuccessAnimationProps {
  show: boolean;
  message?: string;
  onComplete?: () => void;
  duration?: number;
  className?: string;
}

export function SuccessAnimation({
  show,
  message = "Success!",
  onComplete,
  duration = 2000,
  className,
}: SuccessAnimationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-background/60 animate-in fade-in duration-300",
        className
      )}
    >
      <div className="flex flex-col items-center gap-3 animate-in zoom-in-75 duration-300">
        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 animate-in zoom-in-50 duration-500" />
        </div>
        <p className="text-lg font-semibold text-foreground animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
          {message}
        </p>
      </div>
    </div>
  );
}
