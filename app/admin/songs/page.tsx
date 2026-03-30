import {
  getLanguages,
  getPublishedSongTranslationCount,
  getSongs,
  isPublicSongAudioVisible,
  isPublicSongYoutubeVisible,
} from "@/lib/db/queries";
import { AdminSongsClient } from "./AdminSongsClient";

export const dynamic = "force-dynamic";

export default async function AdminSongsPage() {
  const [result, publishedSongCount, languages, audioVisible, youtubeVisible] = await Promise.all([
    getSongs({ publishedOnly: false, limit: 100 }),
    getPublishedSongTranslationCount(),
    getLanguages(),
    isPublicSongAudioVisible(),
    isPublicSongYoutubeVisible(),
  ]);

  const songsData = result.data ?? [];
  const availableLanguageCodes = new Set(
    songsData.flatMap((song) => song.languages)
  );
  const availableLanguages = languages
    .filter((language) => availableLanguageCodes.has(language.code))
    .map((language) => ({
      code: language.code,
      label: language.nativeName || language.name || language.code.toUpperCase(),
    }));
  const availableCategories = Array.from(
    new Set(
      songsData
        .map((song) => song.category)
        .filter((category): category is string => Boolean(category))
    )
  ).sort((left, right) =>
    left.localeCompare(right, undefined, { sensitivity: "base" })
  );

  return (
    <AdminSongsClient
      songs={songsData}
      totalSongs={publishedSongCount}
      availableLanguages={availableLanguages}
      availableCategories={availableCategories}
      initialAudioVisible={audioVisible}
      initialYoutubeVisible={youtubeVisible}
    />
  );
}
