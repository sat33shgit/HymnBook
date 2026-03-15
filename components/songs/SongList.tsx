"use client";

import { SongCard } from "./SongCard";
import type { SongListItem } from "@/types";

interface SongListProps {
  songs: SongListItem[];
}

export function SongList({ songs }: SongListProps) {
  if (songs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg text-muted-foreground">No songs found.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Try a different category or search term.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {songs.map((song, i) => (
        <SongCard key={song.id} song={song} index={i} />
      ))}
    </div>
  );
}
