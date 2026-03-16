import { NextRequest, NextResponse } from "next/server";
import { getSongById, updateSong, deleteSong } from "@/lib/db/queries";
import { updateSongSchema } from "@/lib/validations/song";
import { auth } from "@/lib/auth";
import { revalidateTag } from "next/cache";
import { CACHE_TAGS, songIdTag, songSlugTag } from "@/lib/cache";

const headers = { "X-API-Version": "1" };

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const songId = parseInt(id, 10);
    if (isNaN(songId)) {
      return NextResponse.json(
        { error: "Invalid song ID" },
        { status: 400, headers }
      );
    }

    const song = await getSongById(songId);
    if (!song) {
      return NextResponse.json(
        { error: "Song not found" },
        { status: 404, headers }
      );
    }

    return NextResponse.json(song, { headers });
  } catch (error) {
    console.error("GET /api/songs/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch song" },
      { status: 500, headers }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers }
      );
    }

    const { id } = await params;
    const songId = parseInt(id, 10);
    if (isNaN(songId)) {
      return NextResponse.json(
        { error: "Invalid song ID" },
        { status: 400, headers }
      );
    }

    const body = await request.json();
    const parsed = updateSongSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400, headers }
      );
    }

    const song = await updateSong(songId, parsed.data);

    revalidateTag(CACHE_TAGS.songs, "max");
    revalidateTag(CACHE_TAGS.categories, "max");
    revalidateTag(CACHE_TAGS.slugs, "max");
    revalidateTag(CACHE_TAGS.search, "max");
    revalidateTag(songIdTag(songId), "max");
    if (song?.slug) {
      revalidateTag(songSlugTag(song.slug), "max");
    }

    return NextResponse.json(song, { headers });
  } catch (error) {
    console.error("PUT /api/songs/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update song" },
      { status: 500, headers }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers }
      );
    }

    const { id } = await params;
    const songId = parseInt(id, 10);
    if (isNaN(songId)) {
      return NextResponse.json(
        { error: "Invalid song ID" },
        { status: 400, headers }
      );
    }

    const existingSong = await getSongById(songId);
    await deleteSong(songId);

    revalidateTag(CACHE_TAGS.songs, "max");
    revalidateTag(CACHE_TAGS.categories, "max");
    revalidateTag(CACHE_TAGS.slugs, "max");
    revalidateTag(CACHE_TAGS.search, "max");
    revalidateTag(songIdTag(songId), "max");
    if (existingSong?.slug) {
      revalidateTag(songSlugTag(existingSong.slug), "max");
    }

    return NextResponse.json({ success: true }, { headers });
  } catch (error) {
    console.error("DELETE /api/songs/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete song" },
      { status: 500, headers }
    );
  }
}
