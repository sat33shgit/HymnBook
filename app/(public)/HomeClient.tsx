"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SongList } from "@/components/songs/SongList";
import { CategoryFilter } from "@/components/songs/CategoryFilter";
import { SearchBar } from "@/components/search/SearchBar";
import { Button } from "@/components/ui/button";
import type { SongListItem } from "@/types";
import { Music } from "lucide-react";

interface HomeClientProps {
  initialSongs: SongListItem[];
  initialTotal: number;
  initialTotalPages: number;
  categories: string[];
}

export function HomeClient({
  initialSongs,
  initialTotal,
  initialTotalPages,
  categories,
}: HomeClientProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [songs, setSongs] = useState(initialSongs);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleCategoryChange = async (category: string | null) => {
    setSelectedCategory(category);
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "20");
      if (category) params.set("category", category);

      const res = await fetch(`/api/songs?${params.toString()}`);
      const data = await res.json();
      setSongs(data.data);
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
      params.set("limit", "20");
      if (selectedCategory) params.set("category", selectedCategory);

      const res = await fetch(`/api/songs?${params.toString()}`);
      const data = await res.json();
      setSongs((prev) => [...prev, ...data.data]);
      setPage(nextPage);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (q.trim()) {
      router.push(`/search?q=${encodeURIComponent(q.trim())}`);
    }
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background px-4 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Music className="h-10 w-10 text-primary" />
          </div>
          <h1 className="font-heading text-4xl font-bold tracking-tight md:text-5xl">
            HymnBook
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Browse Christian song lyrics in multiple languages
          </p>
          <div className="mt-8">
            <SearchBar
              value={searchQuery}
              onChange={handleSearch}
              className="mx-auto max-w-lg"
            />
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-[1200px] px-4 py-8">
        {/* Category filter */}
        {categories.length > 0 && (
          <div className="mb-6">
            <CategoryFilter
              categories={categories}
              selected={selectedCategory}
              onSelect={handleCategoryChange}
            />
          </div>
        )}

        {/* Song grid */}
        <SongList songs={songs} />

        {/* Load more */}
        {page < totalPages && (
          <div className="mt-8 flex justify-center">
            <Button
              variant="outline"
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
