import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createSongAudioUploadUrl } from "@/lib/r2";

const headers = { "X-API-Version": "1" };

export const runtime = "nodejs";

function getUploadErrorStatus(message: string) {
  return message.includes("Only MP3") ||
    message.includes("too large") ||
    message.includes("empty")
    ? 400
    : 500;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
    }

    const body = await request.json();
    const fileName = body?.fileName?.toString()?.trim() || "";
    const mimeType = body?.mimeType?.toString()?.trim() || "";
    const fileSize = Number(body?.size);
    const songSlug = (body?.slug?.toString() || "song").trim();

    if (!fileName || !Number.isFinite(fileSize) || fileSize <= 0) {
      return NextResponse.json(
        { error: "Missing file name or size" },
        { status: 400, headers }
      );
    }

    const upload = await createSongAudioUploadUrl({
      fileName,
      mimeType,
      fileSize,
      songSlug,
    });

    return NextResponse.json(upload, { status: 200, headers });
  } catch (error) {
    console.error("POST /api/songs/audio/presign error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to prepare audio upload";
    return NextResponse.json(
      { error: message },
      { status: getUploadErrorStatus(message), headers }
    );
  }
}
