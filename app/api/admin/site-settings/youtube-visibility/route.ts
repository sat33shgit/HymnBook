import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isPublicSongYoutubeVisible, setPublicSongYoutubeVisible } from "@/lib/db/queries";
import { revalidatePath, revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";

const headers = { "X-API-Version": "1" };

export async function GET() {
  try {
    const visible = await isPublicSongYoutubeVisible();
    return NextResponse.json({ visible }, { headers });
  } catch (error) {
    console.error("GET /api/admin/site-settings/youtube-visibility error:", error);
    return NextResponse.json(
      { error: "Failed to fetch youtube visibility setting" },
      { status: 500, headers }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers }
      );
    }

    const body = await request.json();
    if (typeof body?.visible !== "boolean") {
      return NextResponse.json(
        { error: "Invalid payload. 'visible' must be a boolean." },
        { status: 400, headers }
      );
    }

    const visible = await setPublicSongYoutubeVisible(body.visible);

    revalidateTag(CACHE_TAGS.settings, "max");
    revalidateTag(CACHE_TAGS.songs, "max");
    revalidatePath("/admin/songs");
    revalidatePath("/songs", "layout");

    return NextResponse.json({ visible }, { headers });
  } catch (error) {
    console.error("PUT /api/admin/site-settings/youtube-visibility error:", error);
    return NextResponse.json(
      { error: "Failed to update youtube visibility setting" },
      { status: 500, headers }
    );
  }
}
