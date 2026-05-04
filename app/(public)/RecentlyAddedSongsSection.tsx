import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { SongList } from "@/components/songs/SongList";
import { getRecentSongs } from "@/lib/db/queries";

async function RecentlyAddedSongsSection({
  className,
}: {
  className?: string;
}) {
  let songs: Awaited<ReturnType<typeof getRecentSongs>>;

    try {
    songs = await getRecentSongs(6);
  } catch {
    return null;
  }

  if (songs.length === 0) {
    return null;
  }

  return (
    <section className={className}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-heading text-[1.45rem] font-semibold leading-[1.06] tracking-[-0.04em] text-foreground md:text-[1.85rem] md:leading-[1.05]">
            Newly added songs
          </h2>
        </div>
        <Link
          href="/search"
          className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-full border border-[var(--desktop-chip-border)] bg-[var(--desktop-chip)] px-3.5 text-[0.78rem] font-semibold text-[var(--desktop-chip-foreground)] transition-all hover:border-[var(--desktop-chip-hover-border)] hover:bg-[var(--desktop-chip-hover)] hover:text-[var(--desktop-chip-hover-foreground)] md:h-11 md:border-[var(--desktop-panel-border)] md:bg-[var(--desktop-panel)] md:px-5 md:text-[0.9rem] md:text-foreground md:shadow-[0_10px_24px_rgba(15,23,42,0.08)] md:hover:-translate-y-px md:hover:border-[var(--desktop-chip-hover-border)] md:hover:bg-[var(--desktop-chip-hover)] md:hover:text-[var(--desktop-chip-hover-foreground)] md:hover:shadow-[0_16px_32px_rgba(15,23,42,0.12)] md:focus-visible:outline-none md:focus-visible:ring-2 md:focus-visible:ring-[var(--ring)]/35 dark:md:shadow-[0_12px_24px_rgba(2,6,23,0.28)] dark:md:hover:shadow-[0_16px_32px_rgba(2,6,23,0.36)]"
        >
          View all
        </Link>
      </div>
      <SongList songs={songs} className="xl:grid-cols-3" />
    </section>
  );
}

function RecentlyAddedSongsSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-44 rounded-full md:h-9 md:w-56" />
        </div>
        <Skeleton className="h-9 w-20 rounded-full md:h-11 md:w-24" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 xl:gap-5">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-[10.75rem] rounded-[1.45rem] md:h-[14rem] md:rounded-[2rem]"
          />
        ))}
      </div>
    </section>
  );
}

export function MobileRecentlyAddedSongsSection() {
  return (
    <RecentlyAddedSongsSection className="mt-4 rounded-[1.7rem] border border-[var(--desktop-panel-border)] bg-[var(--desktop-panel)] p-4 shadow-[0_18px_38px_rgba(15,23,42,0.08)] dark:shadow-[0_18px_38px_rgba(2,6,23,0.28)] md:hidden" />
  );
}

export function MobileRecentlyAddedSongsSkeleton() {
  return (
    <RecentlyAddedSongsSkeleton className="mt-4 rounded-[1.7rem] border border-[var(--desktop-panel-border)] bg-[var(--desktop-panel)] p-4 shadow-[0_18px_38px_rgba(15,23,42,0.08)] dark:shadow-[0_18px_38px_rgba(2,6,23,0.28)] md:hidden" />
  );
}

export function DesktopRecentlyAddedSongsSection() {
  return <RecentlyAddedSongsSection className="mt-8 hidden md:block" />;
}

export function DesktopRecentlyAddedSongsSkeleton() {
  return <RecentlyAddedSongsSkeleton className="mt-8 hidden md:block" />;
}
