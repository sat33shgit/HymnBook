import { NextRequest, NextResponse } from "next/server";
import { getSongs, createSong, ensureUniqueSongSlug } from "@/lib/db/queries";
import {
  createSongSchema,
  songsListQuerySchema,
} from "@/lib/validations/song";
import { auth } from "@/lib/auth";
import { deriveSongDefaultLanguage, deriveSongSlug } from "@/lib/song-utils";
import { revalidateSongMutationCaches } from "@/lib/song-cache-revalidation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { jsonError, jsonServerError } from "@/lib/api/errors";
// Individual new-song email notifications removed — batch digest handles notifications now.

const headers = { "X-API-Version": "1" };
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  // Rate limit catalog browsing the same way as search to deter scrapers
  // that page through the entire dataset.
  const ip = getClientIp(request);
  const rl = await rateLimit({
    key: `songs-list:${ip}`,
    limit: 120,
    windowSeconds: 60,
  });
  if (!rl.ok) {
    const retryAfter = Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000));
    return jsonError(429, "Too many requests. Please slow down.", {
      "Retry-After": String(retryAfter),
    });
  }

  try {
    const { searchParams } = request.nextUrl;
    const parsed = songsListQuerySchema.safeParse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      language: searchParams.get("language") ?? undefined,
    });
    if (!parsed.success) {
      return jsonError(400, "Invalid query parameters");
    }

    const result = await getSongs(parsed.data);

    return NextResponse.json(result, { headers });
  } catch (error) {
    return jsonServerError("GET /api/songs", error, headers);
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
