"use client";

import { useState } from "react";
import { SongList } from "@/components/songs/SongList";
import { CategoryFilter } from "@/components/songs/CategoryFilter";
import { Button } from "@/components/ui/button";
import type { SongListItem } from "@/types";

function sortSongsByTitle(items: SongListItem[]) {
  return [...items].sort((left, right) =>
    left.title.localeCompare(right.title, undefined, { sensitivity: "base" })
  );
}

interface BrowseSongsSectionProps {
  initialSongs: SongListItem[];
  initialTotalPages: number;
  categories: string[];
}

export function BrowseSongsSection({
  initialSongs,
  initialTotalPages,
  categories,
}: BrowseSongsSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [songs, setSongs] = useState(initialSongs);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading] = useState(false);

  const handleCategoryChange = async (category: string | null) => {
    setSelectedCategory(category);
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "15");
      if (category) params.set("category", category);

      const res = await fetch(`/api/songs?${params.toString()}`);
      const data = await res.json();
      setSongs(sortSongsByTitle(data.data ?? []));
      setPage(1);
      setTotalPages(data.totalPages);
    } catch {
      // Keep existing data on error
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (page >= totalPages) return;
    setLoading(true);
    try {
      const nextPage = page + 1;
      const params = new URLSearchParams();
      params.set("page", nextPage.toString());
      params.set("limit", "15");
      if (selectedCategory) params.set("category", selectedCategory);

      const res = await fetch(`/api/songs?${params.toString()}`);
      const data = await res.json();
      setSongs((prev) => sortSongsByTitle([...prev, ...(data.data ?? [])]));
      setPage(nextPage);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full px-4 py-3 md:px-0 md:py-0">
      <div className="rounded-[1.7rem] border border-[var(--desktop-panel-border)] bg-[var(--desktop-panel)] p-4 shadow-[0_18px_38px_rgba(15,23,42,0.08)] dark:shadow-[0_18px_38px_rgba(2,6,23,0.28)] md:rounded-[2rem] md:p-6">
        <div>
          <h2 className="font-heading text-[1.45rem] font-semibold leading-[1.05] tracking-[-0.04em] text-foreground md:text-[1.85rem]">
            Browse all songs
          </h2>
          <p className="mt-1.5 text-[0.84rem] leading-6 text-[var(--desktop-nav-muted)] md:mt-2 md:text-[0.94rem] md:leading-7">
            Filter by category and continue exploring the full library.
          </p>
        </div>

        {categories.length > 0 && (
          <div className="mb-5 md:mt-6 md:mb-6">
            <CategoryFilter
              categories={categories}
              selected={selectedCategory}
              onSelect={handleCategoryChange}
            />
          </div>
        )}

        <SongList songs={songs} className="xl:grid-cols-3" />

        {page < totalPages && (
          <div className="mt-6 flex justify-center md:mt-10">
            <Button
              variant="outline"
              className="h-9 rounded-full border-[var(--desktop-chip-border)] bg-[var(--desktop-chip)] px-4 text-[0.84rem] text-[var(--desktop-chip-foreground)] hover:border-[var(--desktop-chip-hover-border)] hover:bg-[var(--desktop-chip-hover)] hover:text-[var(--desktop-chip-hover-foreground)] md:h-10 md:px-6 md:text-sm"
              onClick={loadMore}
              disabled={loading}
            >
              {loading ? "Loading..." : "Load More"}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
