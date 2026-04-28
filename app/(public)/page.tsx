import {
  getCategories,
  getLanguages,
  getPublishedLanguageSongCounts,
} from "@/lib/db/queries";
import { Suspense } from "react";
import { HomeClient } from "./HomeClient";
import {
  DesktopMostViewedSongsSkeleton,
  DesktopMostViewedSongsSection,
  MobileMostViewedSongsSkeleton,
  MobileMostViewedSongsSection,
} from "./MostViewedSongsSection";
import {
  DesktopRecentlyAddedSongsSkeleton,
  DesktopRecentlyAddedSongsSection,
  MobileRecentlyAddedSongsSkeleton,
  MobileRecentlyAddedSongsSection,
} from "./RecentlyAddedSongsSection";

export const revalidate = 300;

export default async function HomePage() {
  let totalSongs = 0;
  let totalLanguages = 0;
  let totalCategories = 0;
  let languageOverview: { code: string; label: string; count: number }[] = [];

  try {
    const [activeLanguages, languageCountsResult, categories] = await Promise.all([
      getLanguages(true),
      getPublishedLanguageSongCounts(true),
      getCategories(),
    ]);

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
      totalSongs={totalSongs}
      totalLanguages={totalLanguages}
      totalCategories={totalCategories}
      languageOverview={languageOverview}
      mobileRecentlyAddedSongsSection={
        <Suspense fallback={<MobileRecentlyAddedSongsSkeleton />}>
          <MobileRecentlyAddedSongsSection />
        </Suspense>
      }
      desktopRecentlyAddedSongsSection={
        <Suspense fallback={<DesktopRecentlyAddedSongsSkeleton />}>
          <DesktopRecentlyAddedSongsSection />
        </Suspense>
      }
      mobileMostViewedSongsSection={
        <Suspense fallback={<MobileMostViewedSongsSkeleton />}>
          <MobileMostViewedSongsSection />
        </Suspense>
      }
      desktopMostViewedSongsSection={
        <Suspense fallback={<DesktopMostViewedSongsSkeleton />}>
          <DesktopMostViewedSongsSection />
        </Suspense>
      }
    />
  );
}
