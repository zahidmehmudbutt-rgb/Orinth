import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import CountUp from "react-countup";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface AnimatedCounterProps {
  end: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({
  end,
  suffix = "",
  prefix = "",
  duration = 2,
  className,
}: AnimatedCounterProps) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });
  const [hasStarted, setHasStarted] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (inView) setHasStarted(true);
  }, [inView]);

  // Skip animation if user prefers reduced motion
  if (prefersReducedMotion) {
    return (
      <span ref={ref} className={className}>
        {`${prefix}${end}${suffix}`}
      </span>
    );
  }

  return (
    <span ref={ref} className={className}>
      {hasStarted ? (
        <CountUp start={0} end={end} duration={duration} prefix={prefix} suffix={suffix} />
      ) : (
        `${prefix}0${suffix}`
      )}
    </span>
  );
}
