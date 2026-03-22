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
    <section className="mx-auto max-w-[1200px] px-4 py-4">
      {categories.length > 0 && (
        <div className="mb-6">
          <CategoryFilter
            categories={categories}
            selected={selectedCategory}
            onSelect={handleCategoryChange}
          />
        </div>
      )}

      <SongList songs={songs} />

      {page < totalPages && (
        <div className="mt-8 flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            {loading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </section>
  );
}