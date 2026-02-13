import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function ClubCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-2/3" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </div>
      </CardHeader>
      <CardContent><div className="h-4 bg-muted rounded w-1/3" /></CardContent>
    </Card>
  );
}

export function ClubDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-muted/30 p-6 animate-pulse">
        <div className="h-4 w-24 bg-muted rounded mb-4" />
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-xl bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-7 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        </div>
      </div>
      <div className="h-10 bg-muted rounded w-full" />
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="animate-pulse">
          <CardHeader><div className="h-5 bg-muted rounded w-1/3" /></CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex justify-between">
                <div className="h-4 bg-muted rounded w-1/4" />
                <div className="h-4 bg-muted rounded w-1/4" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="animate-pulse">
          <CardHeader><div className="h-5 bg-muted rounded w-1/3" /></CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex justify-between">
                <div className="h-4 bg-muted rounded w-1/4" />
                <div className="h-4 bg-muted rounded w-1/4" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="rounded-xl border bg-muted/30 p-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-muted" />
          <div className="space-y-2">
            <div className="h-6 bg-muted rounded w-40" />
            <div className="h-4 bg-muted rounded w-28" />
          </div>
        </div>
      </div>
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-5 bg-muted rounded w-1/4" />
          <div className="h-4 bg-muted rounded w-1/3 mt-1" />
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
          <div className="h-10 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
        </CardContent>
      </Card>
    </div>
  );
}

export function TableSkeleton({ rows = 3, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse space-y-2">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 bg-muted rounded" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid gap-4 py-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-4 bg-muted rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}
