import { NextRequest, NextResponse } from "next/server";
import { getSongs, createSong } from "@/lib/db/queries";
import { createSongSchema } from "@/lib/validations/song";
import { auth } from "@/lib/auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { CACHE_TAGS, songIdTag, songSlugTag } from "@/lib/cache";
import { deriveSongDefaultLanguage, deriveSongSlug } from "@/lib/song-utils";

const headers = { "X-API-Version": "1" };

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "15", 10), 100);
    const category = searchParams.get("category") ?? undefined;
    const language = searchParams.get("language") ?? undefined;

    const result = await getSongs({ page, limit, category, language });

    return NextResponse.json(result, { headers });
  } catch (error) {
    console.error("GET /api/songs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch songs" },
      { status: 500, headers }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers }
      );
    }

    const body = await request.json();
    const parsed = createSongSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400, headers }
      );
    }

    const { category, isPublished, translations } = parsed.data;
    const defaultLang = deriveSongDefaultLanguage(translations);
    const slug = deriveSongSlug(translations, { defaultLanguageCode: defaultLang });

    const song = await createSong({
      slug,
      defaultLang,
      category: category ?? undefined,
      isPublished,
      translations,
    });

    revalidateTag(CACHE_TAGS.songs, "max");
    revalidateTag(CACHE_TAGS.mostViewed, "max");
    revalidateTag(CACHE_TAGS.categories, "max");
    revalidateTag(CACHE_TAGS.slugs, "max");
    revalidateTag(CACHE_TAGS.search, "max");
    if (song?.id) {
      revalidateTag(songIdTag(song.id), "max");
    }
    if (song?.slug) {
      revalidateTag(songSlugTag(song.slug), "max");
    }
    revalidatePath("/admin");
    revalidatePath("/admin/songs");

    return NextResponse.json(song, { status: 201, headers });
  } catch (error) {
    console.error("POST /api/songs error:", error);
    return NextResponse.json(
      { error: "Failed to create song" },
      { status: 500, headers }
    );
  }
}
