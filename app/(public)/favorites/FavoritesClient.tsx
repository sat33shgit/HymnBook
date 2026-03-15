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
    <div className="mx-auto max-w-[1200px] px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold">Favorites</h1>
        {songs.length > 0 && (
          <div className="flex gap-2">
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

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      ) : songs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Heart className="mb-4 h-16 w-16 text-muted-foreground/30" />
          <p className="text-lg font-medium text-muted-foreground">
            No favorites yet
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Tap the heart on any song to save it here.
          </p>
          <Link href="/" className={buttonVariants({ className: "mt-6" })}>
            Browse Songs
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((song, i) => (
            <SongCard key={song.id} song={song} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
