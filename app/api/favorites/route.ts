import { NextRequest, NextResponse } from "next/server";
import {
  getUserFavorites,
  addFavorite,
  removeFavorite,
  syncFavorites,
} from "@/lib/db/queries";
import { favoriteSchema, syncFavoritesSchema } from "@/lib/validations/song";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

const headers = { "X-API-Version": "1" };

/** Shared rate-limit check for all favorites endpoints. */
async function checkRateLimit(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await rateLimit({
    key: `favorites:${ip}`,
    limit: 60,
    windowSeconds: 60,
  });
  if (!rl.ok) {
    const retryAfter = Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000));
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { ...headers, "Retry-After": String(retryAfter) } }
    );
  }
  return null;
}

export async function GET(request: NextRequest) {
  const limited = await checkRateLimit(request);
  if (limited) return limited;

  try {
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400, headers }
      );
    }

    // Validate userId is a proper UUID before hitting the DB.
    const parsed = z.string().uuid().safeParse(userId);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid userId" },
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
  const limited = await checkRateLimit(request);
  if (limited) return limited;

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
  const limited = await checkRateLimit(request);
  if (limited) return limited;

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
