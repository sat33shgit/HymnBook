import { getSongs, isPublicSongAudioVisible } from "@/lib/db/queries";
import { AdminSongsClient } from "./AdminSongsClient";

export const dynamic = "force-dynamic";

export default async function AdminSongsPage() {
  const [result, isAudioVisible] = await Promise.all([
    getSongs({ publishedOnly: false, limit: 100 }),
    isPublicSongAudioVisible(),
  ]);

  return (
    <AdminSongsClient
      songs={result.data}
      totalSongs={result.total}
      initialAudioVisible={isAudioVisible}
    />
  );
}
