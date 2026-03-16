import { getMostViewedSongs } from "@/lib/db/queries";
import { HomeClient } from "./HomeClient";

export const revalidate = 300;

export default async function HomePage() {
  let mostViewedSongs: Awaited<ReturnType<typeof getMostViewedSongs>> = [];

  try {
    const topViewed = await getMostViewedSongs(20);
    mostViewedSongs = topViewed;
  } catch {
    // DB not available
  }

  return (
    <HomeClient
      mostViewedSongs={mostViewedSongs}
    />
  );
}
