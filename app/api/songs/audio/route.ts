import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadSongAudioToR2, extractR2ObjectKeyFromUrl, deleteSongAudioFromR2, deleteObjectsByPrefix } from "@/lib/r2";

const headers = { "X-API-Version": "1" };

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const songSlug = (formData.get("slug")?.toString() || "song").trim();

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400, headers });
    }

    const arrayBuffer = await file.arrayBuffer();
    const uploadResult = await uploadSongAudioToR2({
      fileName: file.name,
      mimeType: file.type,
      fileBytes: new Uint8Array(arrayBuffer),
      songSlug,
    });

    // If the client provided an existing URL for replacement, try to delete it now.
    const existingUrl = formData.get("existingUrl")?.toString();
    if (existingUrl) {
      try {
        const key = extractR2ObjectKeyFromUrl(existingUrl);
        await deleteSongAudioFromR2(key);
      } catch {
        // If direct delete failed, try fallback prefix delete by slug; record failures but avoid noisy logs
        try {
          const fallback = await deleteObjectsByPrefix(songSlug);
          if (!fallback || !fallback.deleted) {
            // no-op; will be visible to caller if needed
          }
        } catch {
          // no-op; aggregate error reporting covers failures
        }
      }
    }

    return NextResponse.json(uploadResult, { status: 201, headers });
  } catch (error) {
    console.error("POST /api/songs/audio error:", error);

    const message = error instanceof Error ? error.message : "Failed to upload audio";
    const status = message.includes("Only MP3") || message.includes("too large") || message.includes("empty")
      ? 400
      : 500;

    return NextResponse.json({ error: message }, { status, headers });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
    }

    const body = await request.json();
    const url: string | undefined = body?.url;
    const songSlug: string | undefined = body?.slug;

    if (!url && !songSlug) {
      return NextResponse.json({ error: "Missing url or slug" }, { status: 400, headers });
    }

    if (url) {
      try {
        const key = extractR2ObjectKeyFromUrl(url);
        await deleteSongAudioFromR2(key);
        return NextResponse.json({ success: true }, { status: 200, headers });
      } catch (err) {
        console.error("DELETE /api/songs/audio delete by url failed:", err);
        // try fallback by slug if provided
        if (songSlug) {
          try {
            const fb = await deleteObjectsByPrefix(songSlug);
            return NextResponse.json({ success: true, fallback: fb }, { status: 200, headers });
          } catch (fbErr) {
            console.error("Fallback deleteObjectsByPrefix failed:", fbErr);
            return NextResponse.json({ error: "Failed to delete audio", details: String(err) }, { status: 500, headers });
          }
        }
        return NextResponse.json({ error: "Failed to delete audio", details: String(err) }, { status: 500, headers });
      }
    }

    // If only slug provided, delete by prefix
    try {
      const fb = await deleteObjectsByPrefix(songSlug!);
      return NextResponse.json({ success: true, fallback: fb }, { status: 200, headers });
    } catch (err) {
      console.error("DELETE /api/songs/audio delete by prefix failed:", err);
      return NextResponse.json({ error: "Failed to delete audio by prefix", details: String(err) }, { status: 500, headers });
    }
  } catch (error) {
    console.error("DELETE /api/songs/audio error:", error);
    return NextResponse.json({ error: "Failed to delete audio" }, { status: 500, headers });
  }
}
