import { getSongs, getCategories } from "@/lib/db/queries";
import { HomeClient } from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let initialSongs: Awaited<ReturnType<typeof getSongs>>['data'] = [];
  let initialTotal = 0;
  let initialTotalPages = 0;
  let categories: string[] = [];

  try {
    const [songsResult, cats] = await Promise.all([
      getSongs({ page: 1, limit: 20 }),
      getCategories(),
    ]);
    initialSongs = songsResult.data;
    initialTotal = songsResult.total;
    initialTotalPages = songsResult.totalPages;
    categories = cats;
  } catch {
    // DB not available
  }

  return (
    <HomeClient
      initialSongs={initialSongs}
      initialTotal={initialTotal}
      initialTotalPages={initialTotalPages}
      categories={categories}
    />
  );
}
