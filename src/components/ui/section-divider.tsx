interface SectionDividerProps {
  /** The fill color — should match the NEXT section's background */
  fill?: string;
  /** Flip vertically to use as a top divider */
  flip?: boolean;
  className?: string;
}

export const WaveDivider = ({ flip = false, className = "" }: Omit<SectionDividerProps, "fill">) => (
  <div
    className={`absolute left-0 w-full overflow-hidden leading-[0] pointer-events-none text-card ${
      flip ? "top-0 rotate-180" : "-bottom-px"
    } ${className}`}
    aria-hidden="true"
  >
    <svg
      className="relative block w-full h-[42px] sm:h-[62px]"
      viewBox="0 0 1200 62"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0,30 C200,60 400,0 600,30 C800,60 1000,0 1200,30 L1200,62 L0,62 Z"
        fill="currentColor"
      />
    </svg>
  </div>
);

export const CurveDivider = ({ fill = "hsl(var(--card))", flip = false, className = "" }: SectionDividerProps) => (
  <div
    className={`absolute left-0 w-full overflow-hidden leading-[0] pointer-events-none ${
      flip ? "top-0 rotate-180" : "bottom-0"
    } ${className}`}
    aria-hidden="true"
  >
    <svg
      className="relative block w-full h-[40px] sm:h-[60px]"
      viewBox="0 0 1200 60"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0,40 Q600,-20 1200,40 L1200,60 L0,60 Z"
        fill={fill}
      />
    </svg>
  </div>
);
