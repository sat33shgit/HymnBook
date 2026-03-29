"use client";

import { useEffect, useState } from "react";
import { useFavorites } from "@/hooks/useFavorites";
import { SongCard } from "@/components/songs/SongCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import type { SongListItem } from "@/types";

export function FavoritesClient() {
  const { favorites } = useFavorites();
  const [songs, setSongs] = useState<SongListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"recent" | "alpha">("recent");

  useEffect(() => {
    const fetchFavorites = async () => {
      if (favorites.length === 0) {
        setSongs([]);
        setLoading(false);
        return;
      }

      try {
        // Fetch all songs to find the favorites
        const res = await fetch(`/api/songs?limit=100`);
        const data = await res.json();
        const favSongs = (data.data as SongListItem[]).filter((s) =>
          favorites.includes(s.id)
        );
        setSongs(favSongs);
      } catch {
        setSongs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [favorites]);

  const sorted =
    sortBy === "alpha"
      ? [...songs].sort((a, b) => a.title.localeCompare(b.title))
      : songs;

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="mx-auto max-w-[1200px] px-4 py-8 md:hidden">
        <h1 className="font-heading text-[clamp(2.2rem,5vw,4rem)] font-semibold leading-none tracking-[-0.04em]">
          Favorites
        </h1>
        {songs.length > 0 && (
          <div className="mt-6 flex gap-2">
            <Button
              variant={sortBy === "recent" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("recent")}
            >
              Recent
            </Button>
            <Button
              variant={sortBy === "alpha" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("alpha")}
            >
              A-Z
            </Button>
          </div>
        )}
      </div>

      <section className="hidden rounded-[2rem] border border-[var(--desktop-panel-border)] bg-[var(--desktop-panel)] p-6 shadow-[0_18px_38px_rgba(15,23,42,0.07)] dark:shadow-[0_18px_38px_rgba(2,6,23,0.28)] md:block">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex size-14 items-center justify-center rounded-[1.4rem] bg-[var(--desktop-panel-soft)] text-rose-500">
              <Heart className="h-6 w-6" />
            </div>
            <div>
              <h1 className="mt-3 font-heading text-[3rem] font-semibold leading-[0.95] tracking-[-0.06em] text-foreground">
                Favorites
              </h1>
              <p className="mt-4 max-w-2xl text-[0.98rem] leading-8 text-[var(--desktop-nav-muted)]">
                Keep quick access to the songs you revisit most.
              </p>
            </div>
          </div>

          {songs.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant={sortBy === "recent" ? "default" : "outline"}
                className={
                  sortBy === "recent"
                    ? "rounded-full bg-[var(--desktop-nav-active)] px-4 text-[var(--desktop-nav-active-foreground)]"
                    : "rounded-full border-[var(--desktop-chip-border)] bg-[var(--desktop-chip)] px-4 text-[var(--desktop-chip-foreground)]"
                }
                size="sm"
                onClick={() => setSortBy("recent")}
              >
                Recent
              </Button>
              <Button
                variant={sortBy === "alpha" ? "default" : "outline"}
                className={
                  sortBy === "alpha"
                    ? "rounded-full bg-[var(--desktop-nav-active)] px-4 text-[var(--desktop-nav-active-foreground)]"
                    : "rounded-full border-[var(--desktop-chip-border)] bg-[var(--desktop-chip)] px-4 text-[var(--desktop-chip-foreground)]"
                }
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
              <Skeleton key={i} className="h-40 rounded-lg md:h-64 md:rounded-[2rem]" />
            ))}
          </div>
        </section>
      ) : songs.length === 0 ? (
        <section className="px-4 md:px-0">
          <div className="flex flex-col items-center justify-center rounded-[1.5rem] py-20 text-center md:rounded-[2rem] md:border md:border-[var(--desktop-panel-border)] md:bg-[var(--desktop-panel)] md:px-6 md:shadow-[0_18px_38px_rgba(15,23,42,0.07)] dark:md:shadow-[0_18px_38px_rgba(2,6,23,0.28)]">
            <Heart className="mb-4 h-16 w-16 text-muted-foreground/30" />
            <p className="text-[1.12rem] font-semibold text-muted-foreground">
              No favorites yet
            </p>
            <p className="mt-2 text-[0.88rem] text-muted-foreground">
              Tap the heart on any song to save it here.
            </p>
            <Link href="/" className={buttonVariants({ className: "mt-6 rounded-full" })}>
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
