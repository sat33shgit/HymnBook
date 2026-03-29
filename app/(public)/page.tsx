import {
  getCategories,
  getLanguages,
  getMostViewedSongs,
  getPublishedLanguageSongCounts,
} from "@/lib/db/queries";
import { HomeClient } from "./HomeClient";

export const revalidate = 300;

export default async function HomePage() {
  let mostViewedSongs: Awaited<ReturnType<typeof getMostViewedSongs>> = [];
  let totalSongs = 0;
  let totalLanguages = 0;
  let totalCategories = 0;
  let languageOverview: { code: string; label: string; count: number }[] = [];

  try {
    const [topViewed, activeLanguages, languageCountsResult, categories] = await Promise.all([
      getMostViewedSongs(12),
      getLanguages(true),
      getPublishedLanguageSongCounts(true),
      getCategories(),
    ]);

    mostViewedSongs = topViewed;
    totalLanguages = activeLanguages.length;
    totalCategories = categories.length;
    const languageCounts = new Map(
      languageCountsResult.map((language) => [language.code, language.count])
    );

    languageOverview = activeLanguages
      .map((language) => ({
        code: language.code,
        label: language.nativeName || language.name,
        count: languageCounts.get(language.code) ?? 0,
      }))
      .filter((language) => language.count > 0)
      .sort((left, right) => right.count - left.count)
      .slice(0, 6);

    totalSongs = languageOverview.reduce(
      (sum, language) => sum + language.count,
      0
    );
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
