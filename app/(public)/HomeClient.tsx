"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { SongList } from "@/components/songs/SongList";
import { SearchBar } from "@/components/search/SearchBar";
import { resolveVoiceSearchQuery, type VoiceSearchResultCandidate } from "@/lib/voice-search";
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

  const fetchSearchResults = useCallback(async (query: string) => {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
    const data = await res.json();
    return (data.results ?? []) as VoiceSearchResultCandidate[];
  }, []);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (q.trim()) {
      router.push(`/search?q=${encodeURIComponent(q.trim())}`);
    }
  };

  const handleVoiceResult = useCallback(async (candidates: string[]) => {
    if (candidates.length === 0) {
      return;
    }

    const resolution = await resolveVoiceSearchQuery(candidates, fetchSearchResults);
    setSearchQuery(resolution.resolvedQuery);

    if (resolution.resolvedQuery.trim()) {
      const targetUrl = resolution.isUncertain && resolution.suggestion
        ? `/search?q=${encodeURIComponent(resolution.resolvedQuery.trim())}&suggest=${encodeURIComponent(resolution.suggestion)}`
        : `/search?q=${encodeURIComponent(resolution.resolvedQuery.trim())}`;

      router.push(targetUrl);
    }
  }, [fetchSearchResults, router]);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background px-4 py-8 text-center">
        <div className="mx-auto max-w-2xl">
          <p className="mt-3 text-lg text-muted-foreground">
            Browse Christian song lyrics in multiple languages
          </p>
          <div className="mt-8">
            <SearchBar
              value={searchQuery}
              onChange={handleSearch}
              onVoiceResult={handleVoiceResult}
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
            </div>
            <SongList songs={mostViewedSongs} />
          </div>
        )}
      </section>
    </div>
  );
}
