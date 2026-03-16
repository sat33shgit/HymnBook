import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { incrementSongViews } from "@/lib/db/queries";
import { CACHE_TAGS, songIdTag, songSlugTag } from "@/lib/cache";

const headers = { "X-API-Version": "1" };

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const songId = parseInt(id, 10);

    if (isNaN(songId)) {
      return NextResponse.json({ error: "Invalid song ID" }, { status: 400, headers });
    }

    const song = await incrementSongViews(songId);
    if (!song) {
      return NextResponse.json({ error: "Song not found" }, { status: 404, headers });
    }

    revalidateTag(CACHE_TAGS.mostViewed, "max");
    revalidateTag(songIdTag(song.id), "max");
    revalidateTag(songSlugTag(song.slug), "max");

    return NextResponse.json({ success: true, viewCount: song.viewCount }, { headers });
  } catch (error) {
    console.error("POST /api/songs/[id]/view error:", error);
    return NextResponse.json({ error: "Failed to update view count" }, { status: 500, headers });
  }
}
