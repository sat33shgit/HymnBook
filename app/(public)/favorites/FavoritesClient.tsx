"use client";

import { useEffect, useRef, useState } from "react";
import { useFavorites } from "@/hooks/useFavorites";
import { SongCard } from "@/components/songs/SongCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { SongListItem } from "@/types";

function getSortButtonClassName(isActive: boolean) {
  return isActive
    ? "rounded-full bg-[var(--desktop-nav-active)] px-4 text-[var(--desktop-nav-active-foreground)] hover:bg-[var(--desktop-nav-active)]/95"
    : "rounded-full border-[var(--desktop-chip-border)] bg-[var(--desktop-chip)] px-4 text-[var(--desktop-chip-foreground)] hover:border-[var(--desktop-chip-hover-border)] hover:bg-[var(--desktop-chip-hover)] hover:text-[var(--desktop-chip-hover-foreground)]";
}

const browseSongsLinkClassName =
  "inline-flex h-11 w-full max-w-[14rem] items-center justify-center whitespace-nowrap rounded-full border border-[var(--desktop-chip-border)] bg-[var(--desktop-chip)] px-5 text-[0.88rem] font-semibold text-[var(--desktop-chip-foreground)] transition-all hover:border-[var(--desktop-chip-hover-border)] hover:bg-[var(--desktop-chip-hover)] hover:text-[var(--desktop-chip-hover-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/35 md:h-12 md:w-auto md:max-w-none md:border-[var(--desktop-panel-border)] md:bg-[var(--desktop-panel)] md:px-6 md:text-[0.94rem] md:text-foreground md:shadow-[0_10px_24px_rgba(15,23,42,0.08)] md:hover:-translate-y-px md:hover:border-[var(--desktop-chip-hover-border)] md:hover:bg-[var(--desktop-chip-hover)] md:hover:text-[var(--desktop-chip-hover-foreground)] md:hover:shadow-[0_16px_32px_rgba(15,23,42,0.12)] dark:md:shadow-[0_12px_24px_rgba(2,6,23,0.28)] dark:md:hover:shadow-[0_16px_32px_rgba(2,6,23,0.36)]";

export function FavoritesClient() {
  const { favorites } = useFavorites();
  const [songs, setSongs] = useState<SongListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"recent" | "alpha">("recent");
  const titleCollatorRef = useRef(
    new Intl.Collator(undefined, { sensitivity: "base" })
  );

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const fetchFavorites = async () => {
      if (favorites.length === 0) {
        if (active) {
          setSongs([]);
          setLoading(false);
        }
        return;
      }

      try {
        // Fetch all songs to find the favorites
        const res = await fetch(`/api/songs?limit=100`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error("Favorites songs request failed");
        }
        const data = await res.json();
        const favoriteSet = new Set(favorites);
        const favoriteOrder = new Map(
          favorites.map((songId, index) => [songId, index])
        );

        const favSongs = ((data.data ?? []) as SongListItem[])
          .filter((song) => favoriteSet.has(song.id))
          .sort(
            (left, right) =>
              (favoriteOrder.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
              (favoriteOrder.get(right.id) ?? Number.MAX_SAFE_INTEGER)
          );

        if (active) {
          setSongs(favSongs);
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError" && active) {
          setSongs([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchFavorites();

    return () => {
      active = false;
      controller.abort();
    };
  }, [favorites]);

  const sorted =
    sortBy === "alpha"
      ? [...songs].sort((a, b) =>
          titleCollatorRef.current.compare(a.title, b.title)
        )
      : songs;

  return (
    <div className="space-y-6 pt-2 md:space-y-8 md:pt-0">
      <section className="mx-4 rounded-[2rem] border border-[var(--desktop-panel-border)] bg-[var(--desktop-panel)] p-5 shadow-[0_18px_38px_rgba(15,23,42,0.08)] dark:shadow-[0_18px_38px_rgba(2,6,23,0.28)] md:mx-0 md:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between md:gap-6">
          <div className="flex items-start gap-4">
            <div className="flex size-14 items-center justify-center rounded-[1.4rem] bg-[var(--desktop-panel-soft)] text-rose-500">
              <Heart className="h-6 w-6" />
            </div>
            <div>
              <h1 className="mt-2 font-heading text-[clamp(2.2rem,6vw,3rem)] font-semibold leading-[0.95] tracking-[-0.06em] text-foreground">
                Favorites
              </h1>
              <p className="mt-3 max-w-2xl text-[0.94rem] leading-7 text-[var(--desktop-nav-muted)] md:mt-4 md:text-[0.98rem] md:leading-8">
                Keep quick access to the songs you revisit most.
              </p>
            </div>
          </div>

          {songs.length > 0 && (
            <div className="flex flex-wrap gap-2 md:justify-end">
              <Button
                variant={sortBy === "recent" ? "default" : "outline"}
                className={getSortButtonClassName(sortBy === "recent")}
                size="sm"
                onClick={() => setSortBy("recent")}
              >
                Recent
              </Button>
              <Button
                variant={sortBy === "alpha" ? "default" : "outline"}
                className={getSortButtonClassName(sortBy === "alpha")}
                size="sm"
                onClick={() => setSortBy("alpha")}
              >
                A-Z
              </Button>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <span className="rounded-full bg-[var(--desktop-chip)] px-4 py-1.5 text-[0.82rem] font-semibold text-[var(--desktop-chip-foreground)]">
            {songs.length} saved
          </span>
          <span className="rounded-full bg-[var(--desktop-chip)] px-4 py-1.5 text-[0.82rem] font-semibold text-[var(--desktop-chip-foreground)]">
            Persistent across sessions
          </span>
        </div>
      </section>

      {loading ? (
        <section className="px-4 md:px-0">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 xl:gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-44 rounded-[1.7rem] md:h-64 md:rounded-[2rem]"
              />
            ))}
          </div>
        </section>
      ) : songs.length === 0 ? (
        <section className="px-4 md:px-0">
          <div className="flex flex-col items-center justify-center rounded-[2rem] border border-[var(--desktop-panel-border)] bg-[var(--desktop-panel)] px-5 py-14 text-center shadow-[0_18px_38px_rgba(15,23,42,0.08)] dark:shadow-[0_18px_38px_rgba(2,6,23,0.28)] md:px-8 md:py-[4.5rem] lg:px-10 lg:py-20">
            <div className="flex size-16 items-center justify-center rounded-[1.4rem] bg-[var(--desktop-panel-soft)] text-rose-500 shadow-[0_14px_30px_rgba(15,23,42,0.08)] dark:shadow-[0_16px_34px_rgba(2,6,23,0.22)] md:size-[4.75rem] md:rounded-[1.65rem]">
              <Heart className="h-8 w-8 md:h-10 md:w-10" />
            </div>
            <p className="mt-5 font-heading text-[1.45rem] font-semibold leading-[1.02] tracking-[-0.04em] text-foreground md:mt-6 md:text-[1.85rem]">
              No favorites yet
            </p>
            <p className="mt-3 max-w-md text-[0.92rem] leading-7 text-[var(--desktop-nav-muted)] md:text-[0.98rem] md:leading-8">
              Tap the heart on any song to save it here.
            </p>
            <Link
              href="/"
              className={`${browseSongsLinkClassName} mt-7 md:mt-8`}
            >
              Browse Songs
            </Link>
          </div>
        </section>
      ) : (
        <section className="px-4 md:px-0">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 xl:gap-5">
            {sorted.map((song, i) => (
              <SongCard key={song.id} song={song} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
