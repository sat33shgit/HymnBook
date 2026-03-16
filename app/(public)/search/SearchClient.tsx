"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResults } from "@/components/search/SearchResults";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

function SearchContent() {
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
    }
  }, [q, performSearch]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (value.trim()) {
        router.push(`/search?q=${encodeURIComponent(value.trim())}`, {
          scroll: false,
        });
      }
    }, 300);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-heading text-3xl font-bold mb-6">Search Songs</h1>
      <SearchBar
        value={query}
        onChange={handleQueryChange}
        autoFocus
      />

      <div className="mt-8">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : searched ? (
          <SearchResults results={results} query={q} />
        ) : (
          <div className="flex flex-col items-center py-16 text-center">
            <Search className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg text-muted-foreground">
              Search for songs by title, lyrics, or keywords
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try &ldquo;Amazing Grace&rdquo;, &ldquo;hallelujah&rdquo;, or any phrase from a song
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function SearchPageClient() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-8">
          <Skeleton className="h-10 w-48 mb-6" />
          <Skeleton className="h-10 w-full" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
