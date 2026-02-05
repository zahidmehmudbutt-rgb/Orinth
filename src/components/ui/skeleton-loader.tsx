import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-muted",
        className
      )}
      {...props}
    />
  );
}

export function DashboardSkeleton({ roleColor = "bg-primary" }: { roleColor?: string }) {
  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header skeleton */}
      <header className={`w-full ${roleColor} sticky top-0 z-50`}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg" />
            <div className="space-y-1.5">
              <div className="h-4 w-36 bg-white/20 rounded" />
              <div className="h-3 w-24 bg-white/15 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-white/15 rounded-lg" />
            <div className="w-9 h-9 bg-white/15 rounded-lg" />
            <div className="w-9 h-9 bg-white/15 rounded-lg" />
          </div>
        </div>
      </header>

      {/* Main content skeleton */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Tab bar skeleton */}
        <div className="w-full max-w-2xl mx-auto">
          <div className="bg-card rounded-xl p-1.5 shadow-card flex gap-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-1 h-9 bg-muted rounded-lg animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
            ))}
          </div>
        </div>

        {/* Stats row skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl p-4 shadow-card border border-border">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Content cards skeleton */}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl p-5 shadow-card border border-border space-y-3" style={{ animationDelay: `${i * 150}ms` }}>
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export { Skeleton };
