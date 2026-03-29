"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BrowseByLanguageSection,
  type LanguageOverviewItem,
} from "@/components/languages/BrowseByLanguageSection";
import { SongList } from "@/components/songs/SongList";
import { Button } from "@/components/ui/button";
import type { SongListItem } from "@/types";

interface LanguagesClientProps {
  initialSongs: SongListItem[];
  initialTotalPages: number;
  initialLanguageCode: string;
  languageOverview: LanguageOverviewItem[];
}

export function LanguagesClient({
  initialSongs,
  initialTotalPages,
  initialLanguageCode,
  languageOverview,
}: LanguagesClientProps) {
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState(initialLanguageCode);
  const [songs, setSongs] = useState(initialSongs);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading] = useState(false);

  const activeLabel =
    languageOverview.find((language) => language.code === selectedLanguage)?.label ?? "English";

  const fetchSongsForLanguage = async (languageCode: string, nextPage = 1) => {
    const params = new URLSearchParams();
    params.set("page", nextPage.toString());
    params.set("limit", "15");
    params.set("language", languageCode);

    const res = await fetch(`/api/songs?${params.toString()}`);
    return res.json();
  };

  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode === selectedLanguage) {
      router.replace(`/languages?lang=${encodeURIComponent(languageCode)}`, {
        scroll: false,
      });
      return;
    }

    setSelectedLanguage(languageCode);
    setLoading(true);

    try {
      const data = await fetchSongsForLanguage(languageCode);
      setSongs(data.data ?? []);
      setPage(1);
      setTotalPages(data.totalPages ?? 0);
      router.replace(`/languages?lang=${encodeURIComponent(languageCode)}`, {
        scroll: false,
      });
    } catch {
      // Keep existing state on error.
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (page >= totalPages) return;

    setLoading(true);

    try {
      const nextPage = page + 1;
      const data = await fetchSongsForLanguage(selectedLanguage, nextPage);
      setSongs((prev) => [...prev, ...(data.data ?? [])]);
      setPage(nextPage);
      setTotalPages(data.totalPages ?? totalPages);
    } catch {
      // Ignore load more failures and keep current items visible.
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 px-4 py-6 md:space-y-8 md:px-0 md:py-0">
      <BrowseByLanguageSection
        languages={languageOverview}
        selectedCode={selectedLanguage}
        onSelect={handleLanguageChange}
        title="Browse by language"
        description="English is selected by default. Switch to another language to view songs available in that language."
      />

      <section className="rounded-[2rem] border border-[var(--desktop-panel-border)] bg-[var(--desktop-panel)] p-6 shadow-[0_18px_38px_rgba(15,23,42,0.07)] dark:shadow-[0_18px_38px_rgba(2,6,23,0.28)]">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-heading text-[1.85rem] font-semibold leading-[1.05] tracking-[-0.04em] text-foreground">
              {activeLabel} songs
            </h2>
            <p className="mt-2 text-[0.94rem] text-[var(--desktop-nav-muted)]">
              Showing songs that have lyrics available in {activeLabel}.
            </p>
          </div>
          <span className="hidden rounded-full bg-[var(--desktop-chip)] px-4 py-1.5 text-[0.82rem] font-semibold text-[var(--desktop-chip-foreground)] md:inline-flex">
            {songs.length} loaded
          </span>
        </div>

        <SongList
          songs={songs}
          className="xl:grid-cols-3"
          preferredLanguage={selectedLanguage}
        />

        {page < totalPages && (
          <div className="mt-8 flex justify-center md:mt-10">
            <Button
              variant="outline"
              className="rounded-full border-[var(--desktop-chip-border)] bg-[var(--desktop-chip)] px-6 text-[var(--desktop-chip-foreground)]"
              onClick={loadMore}
              disabled={loading}
            >
              {loading ? "Loading..." : "Load More"}
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
