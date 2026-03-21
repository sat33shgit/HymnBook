import { NextRequest, NextResponse } from "next/server";
import { searchSongs } from "@/lib/db/queries";
import { searchSchema } from "@/lib/validations/song";

const headers = { "X-API-Version": "1" };

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const q = searchParams.get("q") ?? "";
    const lang = searchParams.get("lang") ?? undefined;
    const includeUnpublishedRaw = searchParams.get("includeUnpublished") ?? "0";
    const includeUnpublished = includeUnpublishedRaw === "1" || includeUnpublishedRaw === "true";

    const parsed = searchSchema.safeParse({ q, lang });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid search query", details: parsed.error.issues },
        { status: 400, headers }
      );
    }

    const results = await searchSongs(parsed.data.q, parsed.data.lang, includeUnpublished);

    return NextResponse.json({ results }, { headers });
  } catch (error) {
    console.error("GET /api/search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500, headers }
    );
  }
}
