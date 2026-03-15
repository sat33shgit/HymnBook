import { NextRequest, NextResponse } from "next/server";
import { getSongs, createSong, getCategories } from "@/lib/db/queries";
import { createSongSchema } from "@/lib/validations/song";
import { auth } from "@/lib/auth";
import slugify from "slugify";

const headers = { "X-API-Version": "1" };

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
    const category = searchParams.get("category") ?? undefined;

    const result = await getSongs({ page, limit, category });

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

    const { title, category, isPublished, translations } = parsed.data;
    const slug = slugify(title, { lower: true, strict: true });

    const song = await createSong({
      slug,
      category: category ?? undefined,
      isPublished,
      translations,
    });

    return NextResponse.json(song, { status: 201, headers });
  } catch (error) {
    console.error("POST /api/songs error:", error);
    return NextResponse.json(
      { error: "Failed to create song" },
      { status: 500, headers }
    );
  }
}
