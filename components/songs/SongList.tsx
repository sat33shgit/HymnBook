"use client";

import { SongCard } from "./SongCard";
import type { SongListItem } from "@/types";
import { cn } from "@/lib/utils";

interface SongListProps {
  songs: SongListItem[];
  className?: string;
  preferredLanguage?: string;
  titleVariant?: "common" | "localized";
}

export function SongList({
  songs,
  className,
  preferredLanguage,
  titleVariant = "common",
}: SongListProps) {
  if (songs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-[1.12rem] font-semibold text-muted-foreground">
          No songs found.
        </p>
        <p className="mt-2 text-[0.88rem] text-muted-foreground">
          Try a different category or search term.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 gap-4 md:grid-cols-2 xl:gap-5", className)}>
      {songs.map((song, i) => (
        <SongCard
          key={song.id}
          song={song}
          index={i}
          preferredLanguage={preferredLanguage}
          titleVariant={titleVariant}
        />
      ))}
    </div>
  );
}
