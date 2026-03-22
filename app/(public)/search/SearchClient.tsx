"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResults } from "@/components/search/SearchResults";
import { BrowseSongsSection } from "@/components/songs/BrowseSongsSection";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveVoiceSearchQuery } from "@/lib/voice-search";
import type { SearchResultItem, SongListItem } from "@/types";

interface SearchPageClientProps {
  initialSongs: SongListItem[];
  totalSongs: number;
  initialTotalPages: number;
  categories: string[];
}

function SearchContent({
  initialSongs,
  totalSongs,
  initialTotalPages,
  categories,
}: SearchPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") ?? "";
  const suggestedQueryParam = searchParams.get("suggest") ?? "";
  const [query, setQuery] = useState(q);
  const [suggestedQuery, setSuggestedQuery] = useState(suggestedQueryParam || null);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const hasInitializedFromUrlRef = useRef(false);
  const latestLocalQueryRef = useRef(q);
  const pendingUrlQueryRef = useRef(q);

  const fetchSearchResults = useCallback(async (searchQuery: string) => {
    const res = await fetch(
      `/api/search?q=${encodeURIComponent(searchQuery.trim())}`
    );
    const data = await res.json();
    return (data.results ?? []) as SearchResultItem[];
  }, []);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await fetchSearchResults(searchQuery);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [fetchSearchResults]);

  const clearSearchState = useCallback(() => {
    setResults([]);
    setSearched(false);
    setLoading(false);
  }, []);

  useEffect(() => {
    const normalizedQ = q.trim();
    const normalizedLocalQuery = latestLocalQueryRef.current.trim();
    const isStaleUrlSync =
      normalizedQ === pendingUrlQueryRef.current.trim() &&
      normalizedQ !== normalizedLocalQuery;

    if (isStaleUrlSync) {
      return;
    }

    pendingUrlQueryRef.current = normalizedQ;

    if (!hasInitializedFromUrlRef.current || normalizedQ !== normalizedLocalQuery) {
      latestLocalQueryRef.current = normalizedQ;
      setQuery(normalizedQ);

      if (normalizedQ) {
        performSearch(normalizedQ);
      } else {
        clearSearchState();
      }
    }

    hasInitializedFromUrlRef.current = true;
  }, [clearSearchState, performSearch, q]);

  useEffect(() => {
    setSuggestedQuery(suggestedQueryParam || null);
  }, [suggestedQueryParam]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    latestLocalQueryRef.current = value;
    setSuggestedQuery(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      pendingUrlQueryRef.current = "";
      clearSearchState();
      router.replace("/search", { scroll: false });
      return;
    }

    debounceRef.current = setTimeout(() => {
      const trimmedValue = value.trim();

      if (trimmedValue) {
        pendingUrlQueryRef.current = trimmedValue;
        performSearch(trimmedValue);
        router.replace(`/search?q=${encodeURIComponent(trimmedValue)}`, {
          scroll: false,
        });
      }
    }, 300);
  };

  const handleVoiceResult = useCallback(async (candidates: string[]) => {
    if (candidates.length === 0) {
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const resolution = await resolveVoiceSearchQuery(candidates, fetchSearchResults);
      setQuery(resolution.resolvedQuery);
      latestLocalQueryRef.current = resolution.resolvedQuery;
      pendingUrlQueryRef.current = resolution.resolvedQuery;
      setSuggestedQuery(resolution.isUncertain ? resolution.suggestion : null);
      await performSearch(resolution.resolvedQuery);

      const targetUrl = resolution.isUncertain && resolution.suggestion
        ? `/search?q=${encodeURIComponent(resolution.resolvedQuery)}&suggest=${encodeURIComponent(resolution.suggestion)}`
        : `/search?q=${encodeURIComponent(resolution.resolvedQuery)}`;

      router.replace(targetUrl, {
        scroll: false,
      });
    } catch {
      const fallbackQuery = candidates[0] ?? "";
      setQuery(fallbackQuery);
      latestLocalQueryRef.current = fallbackQuery;
      pendingUrlQueryRef.current = fallbackQuery;
      setSuggestedQuery(null);
      if (fallbackQuery) {
        await performSearch(fallbackQuery);
        router.replace(`/search?q=${encodeURIComponent(fallbackQuery)}`, {
          scroll: false,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [fetchSearchResults, performSearch, router]);

  const handleSuggestedQuerySelect = useCallback((value: string) => {
    setQuery(value);
    latestLocalQueryRef.current = value;
    pendingUrlQueryRef.current = value;
    setSuggestedQuery(null);
    performSearch(value);
    router.replace(`/search?q=${encodeURIComponent(value)}`, {
      scroll: false,
    });
  }, [performSearch, router]);

  return (
    <div>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 font-heading text-3xl font-bold">Search Songs</h1>
        <SearchBar
          value={query}
          onChange={handleQueryChange}
          onVoiceResult={handleVoiceResult}
          suggestedQuery={suggestedQuery}
          onSuggestedQuerySelect={handleSuggestedQuerySelect}
          autoFocus
        />
        <div className="mt-3 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
          Total Songs: {totalSongs}
        </div>

        {(loading || searched) && (
          <div className="mt-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-lg" />
                ))}
              </div>
            ) : (
              <SearchResults results={results} query={query} />
            )}
          </div>
        )}
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
  totalSongs,
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
        totalSongs={totalSongs}
        initialTotalPages={initialTotalPages}
        categories={categories}
      />
    </Suspense>
  );
}
