import { getLanguages, getPublishedLanguageSongCounts, getSongs } from "@/lib/db/queries";
import type { LanguageOverviewItem } from "@/components/languages/BrowseByLanguageSection";
import { LanguagesClient } from "./LanguagesClient";

export const metadata = {
  title: "Languages",
  description: "Browse Christian songs by available language.",
};

export const revalidate = 300;

const DEFAULT_LANGUAGE_CODE = "en";

export default async function LanguagesPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang } = await searchParams;

  let initialSongs: Awaited<ReturnType<typeof getSongs>>["data"] = [];
  let initialTotalPages = 0;
  let initialLanguageCode = DEFAULT_LANGUAGE_CODE;
  let languageOverview: LanguageOverviewItem[] = [];

  try {
    const [activeLanguages, languageCountsResult] = await Promise.all([
      getLanguages(true),
      getPublishedLanguageSongCounts(true),
    ]);
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
      .sort((left, right) => right.count - left.count);

    const fallbackLanguageCode =
      activeLanguages.find((language) => language.code === DEFAULT_LANGUAGE_CODE)?.code ??
      activeLanguages[0]?.code ??
      DEFAULT_LANGUAGE_CODE;

    initialLanguageCode = activeLanguages.some((language) => language.code === lang)
      ? (lang as string)
      : fallbackLanguageCode;

    const songsResult = await getSongs({
      page: 1,
      limit: 15,
      language: initialLanguageCode,
    });

    initialSongs = songsResult.data;
    initialTotalPages = songsResult.totalPages;
  } catch {
    // DB not available
  }

  return (
    <LanguagesClient
      initialSongs={initialSongs}
      initialTotalPages={initialTotalPages}
      initialLanguageCode={initialLanguageCode}
      languageOverview={languageOverview}
    />
  );
}
