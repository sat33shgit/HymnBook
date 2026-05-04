import type { Metadata } from "next";
import { getSongs, getCategories, getPublishedSongTranslationCount } from "@/lib/db/queries";
import { SearchPageClient } from "./SearchClient";

export const metadata: Metadata = {
  title: "Search Songs",
  description:
    "Search our full library of Christian hymn and worship song lyrics in English, Telugu, Hindi, Tamil, Malayalam, and more.",
  keywords: [
    "search christian songs",
    "find hymn lyrics",
    "search worship songs",
    "christian song search",
    "hymn search engine",
  ],
  alternates: { canonical: "/search" },
};

export const revalidate = 300;

export default async function SearchPage() {
  let initialSongs: Awaited<ReturnType<typeof getSongs>>["data"] = [];
  let totalSongs = 0;
  let initialTotalPages = 0;
  let categories: string[] = [];

  try {
    const [songsResult, indexedSongCount, cats] = await Promise.all([
      getSongs({ page: 1, limit: 15 }),
      getPublishedSongTranslationCount(),
      getCategories(),
    ]);
    initialSongs = songsResult.data;
    totalSongs = indexedSongCount;
    initialTotalPages = songsResult.totalPages;
    categories = cats;
  } catch {
    // DB not available
  }

  return (
    <SearchPageClient
      initialSongs={initialSongs}
      totalSongs={totalSongs}
      initialTotalPages={initialTotalPages}
      categories={categories}
    />
  );
}
