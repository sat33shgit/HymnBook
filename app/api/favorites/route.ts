import { NextRequest, NextResponse } from "next/server";
import {
  getUserFavorites,
  addFavorite,
  removeFavorite,
  syncFavorites,
} from "@/lib/db/queries";
import { favoriteSchema, syncFavoritesSchema } from "@/lib/validations/song";

const headers = { "X-API-Version": "1" };

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400, headers }
      );
    }

    const favorites = await getUserFavorites(userId);
    return NextResponse.json({ favorites }, { headers });
  } catch (error) {
    console.error("GET /api/favorites error:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorites" },
      { status: 500, headers }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if this is a sync request
    if (body.songIds) {
      const parsed = syncFavoritesSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parsed.error.issues },
          { status: 400, headers }
        );
      }
      const favorites = await syncFavorites(
        parsed.data.userId,
        parsed.data.songIds
      );
      return NextResponse.json({ favorites }, { headers });
    }

    const parsed = favoriteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400, headers }
      );
    }

    await addFavorite(parsed.data.userId, parsed.data.songId);
    return NextResponse.json({ success: true }, { status: 201, headers });
  } catch (error) {
    console.error("POST /api/favorites error:", error);
    return NextResponse.json(
      { error: "Failed to add favorite" },
      { status: 500, headers }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = favoriteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400, headers }
      );
    }

    await removeFavorite(parsed.data.userId, parsed.data.songId);
    return NextResponse.json({ success: true }, { headers });
  } catch (error) {
    console.error("DELETE /api/favorites error:", error);
    return NextResponse.json(
      { error: "Failed to remove favorite" },
      { status: 500, headers }
    );
  }
}
