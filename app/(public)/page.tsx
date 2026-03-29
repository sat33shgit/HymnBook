import { getCategories, getLanguages, getMostViewedSongs, getSongs } from "@/lib/db/queries";
import { HomeClient } from "./HomeClient";

export const revalidate = 300;

export default async function HomePage() {
  let mostViewedSongs: Awaited<ReturnType<typeof getMostViewedSongs>> = [];
  let totalSongs = 0;
  let totalLanguages = 0;
  let totalCategories = 0;
  let languageOverview: { code: string; label: string; count: number }[] = [];

  try {
    const [topViewed, songsResult, activeLanguages, categories] = await Promise.all([
      getMostViewedSongs(12),
      getSongs({ page: 1, limit: 500 }),
      getLanguages(true),
      getCategories(),
    ]);

    mostViewedSongs = topViewed;
    totalSongs = songsResult.total;
    totalLanguages = activeLanguages.length;
    totalCategories = categories.length;

    const languageCounts = new Map<string, number>();
    songsResult.data.forEach((song) => {
      song.languages.forEach((code) => {
        languageCounts.set(code, (languageCounts.get(code) ?? 0) + 1);
      });
    });

    languageOverview = activeLanguages
      .map((language) => ({
        code: language.code,
        label: language.nativeName || language.name,
        count: languageCounts.get(language.code) ?? 0,
      }))
      .filter((language) => language.count > 0)
      .sort((left, right) => right.count - left.count)
      .slice(0, 6);
  } catch {
    // DB not available
  }

  return (
    <HomeClient
      mostViewedSongs={mostViewedSongs}
      totalSongs={totalSongs}
      totalLanguages={totalLanguages}
      totalCategories={totalCategories}
      languageOverview={languageOverview}
    />
  );
}
