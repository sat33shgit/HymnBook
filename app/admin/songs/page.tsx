import { getSongs, isPublicSongAudioVisible, isPublicSongYoutubeVisible } from "@/lib/db/queries";
import { AdminSongsClient } from "./AdminSongsClient";

export const dynamic = "force-dynamic";

export default async function AdminSongsPage() {
  const [result, audioVisible, youtubeVisible] = await Promise.all([
    getSongs({ publishedOnly: false, limit: 100 }),
    isPublicSongAudioVisible(),
    isPublicSongYoutubeVisible(),
  ]);

  const songsData = result.data ?? [];

  return (
    <AdminSongsClient
      songs={songsData}
      totalSongs={result.total}
      initialAudioVisible={audioVisible}
      initialYoutubeVisible={youtubeVisible}
    />
  );
}
