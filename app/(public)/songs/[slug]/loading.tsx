import { Skeleton } from "@/components/ui/skeleton";

export default function SongLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="mt-2 h-6 w-24 rounded-full" />
      <div className="mt-6 flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-20 rounded-full" />
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-7" />
        ))}
      </div>
      <div className="mt-6 space-y-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-5" style={{ width: `${60 + Math.random() * 40}%` }} />
        ))}
      </div>
    </div>
  );
}
