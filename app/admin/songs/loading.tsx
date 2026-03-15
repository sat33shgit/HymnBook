import { Skeleton } from "@/components/ui/skeleton";

export default function AdminSongsLoading() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  );
}
