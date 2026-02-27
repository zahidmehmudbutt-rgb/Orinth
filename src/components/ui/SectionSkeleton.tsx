import { Skeleton } from "@/components/ui/skeleton-loader";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/** Compact skeleton for dashboard card sections (stats, lists, charts). */
export function SectionSkeleton({ lines = 3, showHeader = true }: { lines?: number; showHeader?: boolean }) {
  return (
    <Card>
      {showHeader && (
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/** Stats row skeleton — 3 stat cards. */
export function StatsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-3 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
