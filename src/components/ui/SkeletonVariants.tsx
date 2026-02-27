import { Skeleton } from "@/components/ui/skeleton";

/* -------------------------------------------------------------------------- */
/*  1. TableSkeleton                                                          */
/* -------------------------------------------------------------------------- */

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="w-full overflow-auto rounded-xl border border-border bg-card shadow-sm">
      {/* Header row */}
      <div className="flex items-center gap-4 border-b border-border bg-muted/40 px-4 py-3">
        {Array.from({ length: columns }).map((_, col) => (
          <Skeleton
            key={`header-${col}`}
            className="h-4 flex-1 rounded-md"
          />
        ))}
      </div>

      {/* Body rows */}
      {Array.from({ length: rows }).map((_, row) => (
        <div
          key={`row-${row}`}
          className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-b-0"
        >
          {Array.from({ length: columns }).map((_, col) => (
            <Skeleton
              key={`cell-${row}-${col}`}
              className={`flex-1 rounded-md ${
                row % 2 === 0 ? "h-4" : "h-3.5"
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  2. CardSkeleton                                                           */
/* -------------------------------------------------------------------------- */

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Image area */}
      <Skeleton className="h-40 w-full rounded-none" />

      {/* Content area */}
      <div className="space-y-3 p-5">
        {/* Title line */}
        <Skeleton className="h-5 w-3/4 rounded-md" />
        {/* Description lines */}
        <Skeleton className="h-3.5 w-full rounded-md" />
        <Skeleton className="h-3.5 w-5/6 rounded-md" />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  3. ChatSkeleton                                                           */
/* -------------------------------------------------------------------------- */

interface ChatSkeletonProps {
  messages?: number;
}

export function ChatSkeleton({ messages = 4 }: ChatSkeletonProps) {
  return (
    <div className="flex flex-col gap-4 p-4">
      {Array.from({ length: messages }).map((_, i) => {
        const isLeft = i % 2 === 0;

        return (
          <div
            key={`msg-${i}`}
            className={`flex items-end gap-2.5 ${
              isLeft ? "justify-start" : "flex-row-reverse"
            }`}
          >
            {/* Avatar circle */}
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />

            {/* Message bubble */}
            <div
              className={`flex flex-col gap-1.5 ${
                isLeft ? "items-start" : "items-end"
              }`}
            >
              <Skeleton
                className={`h-4 rounded-md ${
                  isLeft ? "w-36 sm:w-48" : "w-28 sm:w-40"
                }`}
              />
              <Skeleton
                className={`h-4 rounded-md ${
                  isLeft ? "w-48 sm:w-64" : "w-40 sm:w-56"
                }`}
              />
              {isLeft && (
                <Skeleton className="h-4 w-24 sm:w-32 rounded-md" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  4. FormSkeleton                                                           */
/* -------------------------------------------------------------------------- */

interface FormSkeletonProps {
  fields?: number;
}

export function FormSkeleton({ fields = 4 }: FormSkeletonProps) {
  return (
    <div className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={`field-${i}`} className="space-y-2">
          {/* Label */}
          <Skeleton className="h-4 w-28 rounded-md" />
          {/* Input placeholder */}
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}

      {/* Submit button */}
      <Skeleton className="h-10 w-full sm:w-32 rounded-lg" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  5. StatsSkeleton                                                          */
/* -------------------------------------------------------------------------- */

interface StatsSkeletonProps {
  count?: number;
}

export function StatsSkeleton({ count = 4 }: StatsSkeletonProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`stat-${i}`}
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          {/* Icon circle */}
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />

          {/* Value + label */}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-16 rounded-md" />
            <Skeleton className="h-3 w-24 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
