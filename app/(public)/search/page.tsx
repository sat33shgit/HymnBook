import { getSongs, getCategories } from "@/lib/db/queries";
import { SearchPageClient } from "./SearchClient";

export const metadata = {
  title: "Search Songs",
  description: "Search for Christian song lyrics across multiple languages.",
};

export const revalidate = 300;

export default async function SearchPage() {
  let initialSongs: Awaited<ReturnType<typeof getSongs>>["data"] = [];
  let totalSongs = 0;
  let initialTotalPages = 0;
  let categories: string[] = [];

  try {
    const [songsResult, cats] = await Promise.all([
      getSongs({ page: 1, limit: 15 }),
      getCategories(),
    ]);
    initialSongs = songsResult.data;
    totalSongs = songsResult.total;
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
