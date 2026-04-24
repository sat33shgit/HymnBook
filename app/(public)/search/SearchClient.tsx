"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { Search } from "lucide-react";
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
  const latestSearchRequestRef = useRef(0);
  const titleCollatorRef = useRef(new Intl.Collator(undefined, { sensitivity: "base" }));

  const fetchSearchResults = useCallback(async (searchQuery: string) => {
    const res = await fetch(
      `/api/search?q=${encodeURIComponent(searchQuery.trim())}`
    );
    if (!res.ok) {
      throw new Error("Search request failed");
    }
    const data = await res.json();
    return [...((data.results ?? []) as SearchResultItem[])].sort((left, right) =>
      titleCollatorRef.current.compare(left.title, right.title)
    );
  }, []);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    const requestId = latestSearchRequestRef.current + 1;
    latestSearchRequestRef.current = requestId;
    setLoading(true);
    setSearched(true);

    try {
      const data = await fetchSearchResults(searchQuery);
      if (latestSearchRequestRef.current === requestId) {
        setResults(data);
      }
    } catch {
      if (latestSearchRequestRef.current === requestId) {
        setResults([]);
      }
    } finally {
      if (latestSearchRequestRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [fetchSearchResults]);

  const clearSearchState = useCallback(() => {
    latestSearchRequestRef.current += 1;
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

  const handleSubmit = useCallback((value: string) => {
    const trimmedValue = value.trim();

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!trimmedValue) {
      latestLocalQueryRef.current = "";
      pendingUrlQueryRef.current = "";
      setQuery("");
      setSuggestedQuery(null);
      clearSearchState();
      router.replace("/search", { scroll: false });
      return;
    }

    setQuery(trimmedValue);
    latestLocalQueryRef.current = trimmedValue;
    pendingUrlQueryRef.current = trimmedValue;
    setSuggestedQuery(null);
    performSearch(trimmedValue);
    router.replace(`/search?q=${encodeURIComponent(trimmedValue)}`, {
      scroll: false,
    });
  }, [clearSearchState, performSearch, router]);

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
    <div className="space-y-5 pt-2 md:space-y-8 md:pt-0">
      <section
        className="mx-4 rounded-[1.8rem] px-4 py-5 text-[var(--desktop-hero-foreground)] shadow-[0_28px_60px_rgba(6,78,59,0.22)] md:mx-0 md:rounded-[2.35rem] md:px-8 md:py-9"
        style={{ backgroundColor: "var(--desktop-hero-start)" }}
      >
        <div className="flex items-start justify-between gap-4 md:gap-8">
          <div className="max-w-4xl">
            <h1 className="mt-1.5 font-heading text-[clamp(1.95rem,8vw,3.3rem)] font-semibold leading-[0.97] tracking-[-0.06em]">
              Search songs, lyric lines, and language groups
            </h1>
            <p className="mt-3 max-w-3xl text-[0.84rem] leading-6 text-[var(--desktop-hero-muted)] md:mt-5 md:text-[1.02rem] md:leading-8">
              Start typing a title, chorus line, or language name. Use voice
              search to find songs even faster.
            </p>
          </div>
          <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-[1rem] bg-white/10 text-[var(--desktop-hero-foreground)] md:mt-3 md:size-16 md:rounded-[1.75rem]">
            <Search className="h-5 w-5 md:h-7 md:w-7" />
          </div>
        </div>

        <div className="mt-5 max-w-[940px] md:mt-8">
          <SearchBar
            value={query}
            onChange={handleQueryChange}
            onSubmit={handleSubmit}
            onVoiceResult={handleVoiceResult}
            suggestedQuery={suggestedQuery}
            onSuggestedQuerySelect={handleSuggestedQuerySelect}
            autoFocus
            placeholder="Search songs, lyrics, or language..."
            className="[&_[data-slot=input]]:h-11 [&_[data-slot=input]]:rounded-[1.2rem] [&_[data-slot=input]]:border-0 [&_[data-slot=input]]:bg-white/95 [&_[data-slot=input]]:text-[0.95rem] [&_[data-slot=input]]:text-slate-700 [&_[data-slot=input]]:shadow-none [&_[data-slot=input]]:placeholder:text-slate-400 [&_[data-slot=tooltip-trigger]]:h-9 [&_[data-slot=tooltip-trigger]]:w-9 [&_[data-slot=tooltip-trigger]]:text-slate-500 md:[&_[data-slot=input]]:h-14 md:[&_[data-slot=input]]:rounded-[1.45rem] md:[&_[data-slot=input]]:text-[1rem] md:[&_[data-slot=tooltip-trigger]]:h-12 md:[&_[data-slot=tooltip-trigger]]:w-12"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2 md:gap-3">
          <span className="rounded-full bg-white/10 px-3 py-1 text-[0.74rem] font-semibold md:px-4 md:py-1.5 md:text-[0.82rem]">
            {totalSongs} songs available
          </span>
          {query.trim() && (
            <span className="rounded-full bg-white/10 px-3 py-1 text-[0.74rem] font-semibold md:px-4 md:py-1.5 md:text-[0.82rem]">
              Query: {query.trim()}
            </span>
          )}
          {searched && !loading && (
            <span className="rounded-full bg-white/10 px-3 py-1 text-[0.74rem] font-semibold md:px-4 md:py-1.5 md:text-[0.82rem]">
              {results.length} {results.length === 1 ? "match" : "matches"}
            </span>
          )}
        </div>
      </section>

      {!searched && (
        <BrowseSongsSection
          initialSongs={initialSongs}
          initialTotalPages={initialTotalPages}
          categories={categories}
        />
      )}

      {(loading || searched) && (
        <section className="px-4 md:px-0">
          <div className="rounded-[1.7rem] border border-[var(--desktop-panel-border)] bg-[var(--desktop-panel)] p-3.5 shadow-[0_18px_38px_rgba(15,23,42,0.08)] dark:shadow-[0_18px_38px_rgba(2,6,23,0.28)] md:rounded-[2rem] md:p-6">
            {loading ? (
              <div className="space-y-2.5 md:space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-20 rounded-[1.2rem] md:h-32 md:rounded-[1.5rem]"
                  />
                ))}
              </div>
            ) : (
              <SearchResults results={results} query={query} />
            )}
          </div>
        </section>
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
