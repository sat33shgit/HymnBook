"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SongList } from "@/components/songs/SongList";
import { SearchBar } from "@/components/search/SearchBar";
import type { SongListItem } from "@/types";
import { Music } from "lucide-react";

interface HomeClientProps {
  mostViewedSongs: SongListItem[];
}

export function HomeClient({
  mostViewedSongs,
}: HomeClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (q.trim()) {
      router.push(`/search?q=${encodeURIComponent(q.trim())}`);
    }
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background px-4 py-8 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Music className="h-10 w-10 text-primary" />
          </div>
          <h1 className="font-heading text-4xl font-bold tracking-tight md:text-5xl">
            Hymn Book
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Browse Christian song lyrics in multiple languages
          </p>
          <div className="mt-8">
            <SearchBar
              value={searchQuery}
              onChange={handleSearch}
              className="mx-auto max-w-lg"
            />
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-[1200px] px-4 py-4">
        {mostViewedSongs.length > 0 && (
          <div className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-2xl font-bold tracking-tight">Most Viewed Songs</h2>
              <span className="text-sm text-muted-foreground">Trending now</span>
            </div>
            <SongList songs={mostViewedSongs} />
          </div>
        )}
      </section>
    </div>
  );
}
