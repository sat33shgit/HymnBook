import type { Metadata } from "next";
import { Suspense } from "react";
import {
  getCategories,
  getLanguages,
  getPublishedLanguageSongCounts,
} from "@/lib/db/queries";
import { defaultOgImagePath, publicSiteTitle, siteUrl } from "@/lib/site";
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

const homeTitle = `${publicSiteTitle} | Christian Songs Library`;
const homeDescription =
  "Browse and read Christian hymn and worship song lyrics in English, Telugu, Hindi, Tamil, Malayalam, and more. Free multilingual Christian songs library.";

export const metadata: Metadata = {
  title: homeTitle,
  description: homeDescription,
  alternates: { canonical: "/" },
  keywords: [
    "christian songs library",
    "hymn lyrics online",
    "worship song lyrics",
    "Telugu christian songs",
    "Hindi christian songs",
    "Tamil christian songs",
    "Malayalam christian songs",
    "multilingual hymns",
    "free christian lyrics",
    "online hymn book",
  ],
  openGraph: {
    type: "website",
    url: "/",
    title: homeTitle,
    description: homeDescription,
    images: [{ url: defaultOgImagePath, width: 1200, height: 630, alt: `${publicSiteTitle} — Christian Songs Library` }],
  },
  twitter: {
    card: "summary_large_image",
    title: homeTitle,
    description: homeDescription,
    images: [defaultOgImagePath],
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: publicSiteTitle,
  url: siteUrl,
  description: homeDescription,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${siteUrl}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
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
    </>
  );
}
