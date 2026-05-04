import { NextRequest, NextResponse } from "next/server";
import { Readable } from "node:stream";
import { extractR2ObjectKeyFromUrl, getSongAudioObjectFromR2 } from "@/lib/r2";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  // Tighter limit than the catalog API — each request proxies a full audio
  // file through R2, so unchecked bulk access would be expensive.
  const ip = getClientIp(request);
  const rl = await rateLimit({
    key: `audio-stream:${ip}`,
    limit: 30,
    windowSeconds: 60,
  });
  if (!rl.ok) {
    const retryAfter = Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000));
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

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
