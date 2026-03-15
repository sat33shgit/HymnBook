import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div>
      <section className="bg-gradient-to-b from-primary/5 to-background px-4 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <Skeleton className="mx-auto h-10 w-10 rounded-full" />
          <Skeleton className="mx-auto mt-4 h-12 w-64" />
          <Skeleton className="mx-auto mt-3 h-6 w-80" />
          <Skeleton className="mx-auto mt-8 h-10 w-full max-w-lg" />
        </div>
      </section>
      <section className="mx-auto max-w-[1200px] px-4 py-8">
        <div className="mb-6 flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </section>
    </div>
  );
}
