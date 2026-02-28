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
      <defs>
        <linearGradient id="wave-edge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" className="[stop-color:hsl(var(--primary)/0.3)] dark:[stop-color:hsl(var(--primary)/0.5)]" />
          <stop offset="40%" className="[stop-color:hsl(var(--primary)/0.05)] dark:[stop-color:hsl(var(--primary)/0.1)]" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      {/* Glow edge behind the wave — visible in dark mode */}
      <path
        d="M0,28 C200,58 400,-2 600,28 C800,58 1000,-2 1200,28 L1200,62 L0,62 Z"
        fill="url(#wave-edge)"
      />
      {/* Main wave fill — exact match to next section */}
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
