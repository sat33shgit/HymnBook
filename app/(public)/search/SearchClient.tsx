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
  const titleCollatorRef = useRef(new Intl.Collator(undefined, { sensitivity: "base" }));

  const fetchSearchResults = useCallback(async (searchQuery: string) => {
    const res = await fetch(
      `/api/search?q=${encodeURIComponent(searchQuery.trim())}`
    );
    const data = await res.json();
    return [...((data.results ?? []) as SearchResultItem[])].sort((left, right) =>
      titleCollatorRef.current.compare(left.title, right.title)
    );
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
    <div className="space-y-6 md:space-y-8">
      <div className="mx-auto max-w-3xl px-4 py-8 md:hidden">
        <h1 className="mb-6 font-heading text-[clamp(2.2rem,5vw,4rem)] font-semibold leading-none tracking-[-0.04em]">
          Search Songs
        </h1>
        <SearchBar
          value={query}
          onChange={handleQueryChange}
          onSubmit={handleSubmit}
          onVoiceResult={handleVoiceResult}
          suggestedQuery={suggestedQuery}
          onSuggestedQuerySelect={handleSuggestedQuerySelect}
          autoFocus
        />
        <div className="mt-3 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-[0.88rem] font-semibold text-primary">
          Total Songs: {totalSongs}
        </div>
      </div>

      <section
        className="hidden rounded-[2.35rem] px-8 py-9 text-[var(--desktop-hero-foreground)] shadow-[0_28px_60px_rgba(6,78,59,0.22)] md:block"
        style={{
          backgroundImage:
            "linear-gradient(135deg, var(--desktop-hero-start), var(--desktop-hero-end))",
        }}
      >
        <div className="flex items-start justify-between gap-8">
          <div className="max-w-4xl">
            <h1 className="mt-4 font-heading text-[3.3rem] font-semibold leading-[0.96] tracking-[-0.06em]">
              Search songs, lyric lines, and language groups
            </h1>
            <p className="mt-5 max-w-3xl text-[1.02rem] leading-8 text-[var(--desktop-hero-muted)]">
              Start typing a title, chorus line, or language name. Use voice search to find songs even faster.
            </p>
          </div>
          <div className="mt-3 flex size-16 shrink-0 items-center justify-center rounded-[1.75rem] bg-white/10 text-[var(--desktop-hero-foreground)]">
            <Search className="h-7 w-7" />
          </div>
        </div>

        <div className="mt-8 max-w-[940px]">
          <SearchBar
            value={query}
            onChange={handleQueryChange}
            onSubmit={handleSubmit}
            onVoiceResult={handleVoiceResult}
            suggestedQuery={suggestedQuery}
            onSuggestedQuerySelect={handleSuggestedQuerySelect}
            autoFocus
            placeholder="Search songs, lyrics, or language..."
            className="[&_[data-slot=input]]:h-14 [&_[data-slot=input]]:rounded-[1.6rem] [&_[data-slot=input]]:border-0 [&_[data-slot=input]]:bg-white/95 [&_[data-slot=input]]:text-[1rem] [&_[data-slot=input]]:text-slate-700 [&_[data-slot=input]]:shadow-none [&_[data-slot=input]]:placeholder:text-slate-400 [&_[data-slot=tooltip-trigger]]:h-12 [&_[data-slot=tooltip-trigger]]:w-12 [&_[data-slot=tooltip-trigger]]:text-slate-500"
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <span className="rounded-full bg-white/10 px-4 py-1.5 text-[0.82rem] font-semibold">
            {totalSongs} songs indexed
          </span>
          {query.trim() && (
            <span className="rounded-full bg-white/10 px-4 py-1.5 text-[0.82rem] font-semibold">
              Query: {query.trim()}
            </span>
          )}
          {searched && !loading && (
            <span className="rounded-full bg-white/10 px-4 py-1.5 text-[0.82rem] font-semibold">
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
          <div className="md:rounded-[2rem] md:border md:border-[var(--desktop-panel-border)] md:bg-[var(--desktop-panel)] md:p-6 md:shadow-[0_18px_38px_rgba(15,23,42,0.07)] dark:md:shadow-[0_18px_38px_rgba(2,6,23,0.28)]">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-lg md:h-32 md:rounded-[1.5rem]" />
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
