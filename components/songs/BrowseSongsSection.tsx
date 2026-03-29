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
    <section className="w-full px-4 py-4 md:px-0 md:py-0">
      <div className="md:rounded-[2rem] md:border md:border-[var(--desktop-panel-border)] md:bg-[var(--desktop-panel)] md:p-6 md:shadow-[0_18px_38px_rgba(15,23,42,0.07)] dark:md:shadow-[0_18px_38px_rgba(2,6,23,0.28)]">
        <div className="hidden md:block">
          <h2 className="font-heading text-[1.85rem] font-semibold leading-[1.05] tracking-[-0.04em] text-foreground">
            Browse all songs
          </h2>
          <p className="mt-2 text-[0.94rem] text-[var(--desktop-nav-muted)]">
            Filter by category and continue exploring the full library.
          </p>
        </div>

        {categories.length > 0 && (
          <div className="mb-6 md:mt-6">
            <CategoryFilter
              categories={categories}
              selected={selectedCategory}
              onSelect={handleCategoryChange}
            />
          </div>
        )}

        <SongList songs={songs} className="xl:grid-cols-3" />

        {page < totalPages && (
          <div className="mt-8 flex justify-center md:mt-10">
            <Button
              variant="outline"
              className="md:rounded-full md:border-[var(--desktop-chip-border)] md:bg-[var(--desktop-chip)] md:px-6 md:text-[var(--desktop-chip-foreground)]"
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
