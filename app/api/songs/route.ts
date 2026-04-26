import { NextRequest, NextResponse } from "next/server";
import { getSongs, createSong, ensureUniqueSongSlug } from "@/lib/db/queries";
import { createSongSchema } from "@/lib/validations/song";
import { auth } from "@/lib/auth";
import { deriveSongDefaultLanguage, deriveSongSlug } from "@/lib/song-utils";
import { revalidateSongMutationCaches } from "@/lib/song-cache-revalidation";
// Individual new-song email notifications removed — batch digest handles notifications now.

const headers = { "X-API-Version": "1" };
export const runtime = "nodejs";

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
    const slug = await ensureUniqueSongSlug(
      deriveSongSlug(translations, { defaultLanguageCode: defaultLang })
    );

    const song = await createSong({
      slug,
      defaultLang,
      category: category ?? undefined,
      isPublished,
      translations,
    });

    revalidateSongMutationCaches(
      { id: song?.id ?? null, slug: song?.slug ?? slug },
      ["/admin", "/admin/songs"]
    );

    // Individual immediate notifications removed. Batch digest will send updates on schedule.

    return NextResponse.json(song, { status: 201, headers });
  } catch (error) {
    console.error("POST /api/songs error:", error);
    return NextResponse.json(
      { error: "Failed to create song" },
      { status: 500, headers }
    );
  }
}
