import { NextRequest, NextResponse } from "next/server";
import { searchSongs } from "@/lib/db/queries";
import { searchSchema } from "@/lib/validations/song";
import { auth } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { jsonError, jsonServerError } from "@/lib/api/errors";

const headers = { "X-API-Version": "1" };

export async function GET(request: NextRequest) {
  // Rate limit search by client IP — prevents enumerating the catalog by
  // hammering /api/search with random queries. Limits chosen to allow a
  // human typing a search-as-you-type box (~2 req/keystroke) but cut off
  // crawlers that fire thousands per minute.
  const ip = getClientIp(request);
  const rl = await rateLimit({
    key: `search:${ip}`,
    limit: 60,
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
    const parsed = searchSchema.safeParse({
      q: searchParams.get("q") ?? "",
      lang: searchParams.get("lang") ?? undefined,
      includeUnpublished:
        searchParams.get("includeUnpublished") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid search query" },
        { status: 400, headers }
      );
    }

    // Only authenticated users can request unpublished songs. Anonymous
    // callers passing the flag get it silently ignored.
    let includeUnpublished = false;
    if (
      parsed.data.includeUnpublished === "1" ||
      parsed.data.includeUnpublished === "true"
    ) {
      const session = await auth();
      includeUnpublished = Boolean(session?.user);
    }

    const results = await searchSongs(
      parsed.data.q,
      parsed.data.lang,
      includeUnpublished
    );

    // Strip fields that are only relevant to admin tooling from the public
    // response. `is_published` is always true for public results anyway,
    // but trimming it keeps the response surface minimal.
    const publicResults = includeUnpublished
      ? results
      : results.map((row) => {
          // Discard `is_published` for unauthenticated callers.
          const {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            is_published,
            ...rest
          } = row;
          return rest;
        });

    return NextResponse.json({ results: publicResults }, { headers });
  } catch (error) {
    return jsonServerError("GET /api/search", error, headers);
  }
}
