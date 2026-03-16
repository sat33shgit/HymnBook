"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResults } from "@/components/search/SearchResults";
import { BrowseSongsSection } from "@/components/songs/BrowseSongsSection";
import { Skeleton } from "@/components/ui/skeleton";
import type { SongListItem } from "@/types";

interface SearchPageClientProps {
  initialSongs: SongListItem[];
  initialTotalPages: number;
  categories: string[];
}

function SearchContent({
  initialSongs,
  initialTotalPages,
  categories,
}: SearchPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(q);
  const [results, setResults] = useState<
    {
      song_id: number;
      slug: string;
      title: string;
      matched_language: string;
      matched_text: string;
      category: string | null;
    }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery.trim())}`
      );
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (q) {
      setQuery(q);
      performSearch(q);
    } else {
      setQuery("");
      setResults([]);
      setSearched(false);
      setLoading(false);
    }
  }, [q, performSearch]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      router.replace("/search", { scroll: false });
      return;
    }

    debounceRef.current = setTimeout(() => {
      if (value.trim()) {
        router.replace(`/search?q=${encodeURIComponent(value.trim())}`, {
          scroll: false,
        });
      }
    }, 300);
  };

  return (
    <div>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 font-heading text-3xl font-bold">Search Songs</h1>
        <SearchBar value={query} onChange={handleQueryChange} autoFocus />

        <div className="mt-8">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          ) : searched ? (
            <SearchResults results={results} query={q} />
          ) : null}
        </div>
      </div>

      {!searched && (
        <div>
          <BrowseSongsSection
            initialSongs={initialSongs}
            initialTotalPages={initialTotalPages}
            categories={categories}
          />
        </div>
      )}
    </div>
  );
}

export function SearchPageClient({
  initialSongs,
  initialTotalPages,
  categories,
}: SearchPageClientProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-8">
          <Skeleton className="mb-6 h-10 w-48" />
          <Skeleton className="h-10 w-full" />
        </div>
      }
    >
      <SearchContent
        initialSongs={initialSongs}
        initialTotalPages={initialTotalPages}
        categories={categories}
      />
    </Suspense>
  );
}
