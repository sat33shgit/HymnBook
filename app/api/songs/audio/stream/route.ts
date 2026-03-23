import { NextRequest, NextResponse } from "next/server";
import { Readable } from "node:stream";
import { extractR2ObjectKeyFromUrl, getSongAudioObjectFromR2 } from "@/lib/r2";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const urlParam = request.nextUrl.searchParams.get("url");
    if (!urlParam) {
      return NextResponse.json({ error: "Missing audio url" }, { status: 400 });
    }

    const key = extractR2ObjectKeyFromUrl(urlParam);
    const result = await getSongAudioObjectFromR2(key);

    if (!result.Body) {
      return NextResponse.json({ error: "Audio not found" }, { status: 404 });
    }

    const bodyStream =
      typeof (result.Body as { transformToWebStream?: () => ReadableStream }).transformToWebStream ===
      "function"
        ? (result.Body as { transformToWebStream: () => ReadableStream }).transformToWebStream()
        : Readable.toWeb(result.Body as Readable);

    // Normalize content type for M4A variants so browsers accept the stream.
    let contentType = result.ContentType || "audio/mpeg";
    const ct = String(contentType).toLowerCase();
    if (ct.includes("m4a") || ct.includes("audio/mp4") || ct.includes("audio/x-m4a")) {
      contentType = "audio/mp4";
    }

    return new Response(bodyStream as ReadableStream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
        ...(result.ContentLength ? { "Content-Length": String(result.ContentLength) } : {}),
      },
    });
  } catch (error) {
    console.error("GET /api/songs/audio/stream error:", error);
    return NextResponse.json({ error: "Failed to stream audio" }, { status: 500 });
  }
}
