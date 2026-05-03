import { kv } from "@vercel/kv";

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
};

// In-memory fallback used when KV is not configured (typically local dev).
// This is intentionally per-process and per-instance — not safe for
// horizontally scaled deployments without KV/Redis.
const memoryStore = new Map<string, { count: number; expiresAt: number }>();

function fallbackLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const existing = memoryStore.get(key);
  if (!existing || existing.expiresAt <= now) {
    memoryStore.set(key, { count: 1, expiresAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  if (existing.count >= limit) {
    return { ok: false, remaining: 0, resetAt: existing.expiresAt };
  }
  existing.count += 1;
  return {
    ok: true,
    remaining: limit - existing.count,
    resetAt: existing.expiresAt,
  };
}

function isKvConfigured(): boolean {
  return Boolean(
    process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
  );
}

/**
 * Fixed-window rate limit. Returns { ok: false } once the caller has made
 * `limit` requests within the last `windowSeconds` for the given key.
 */
export async function rateLimit(params: {
  key: string;
  limit: number;
  windowSeconds: number;
}): Promise<RateLimitResult> {
  const { key, limit, windowSeconds } = params;
  const windowMs = windowSeconds * 1000;

  if (!isKvConfigured()) {
    return fallbackLimit(key, limit, windowMs);
  }

  const namespacedKey = `rl:${key}`;

  try {
    const count = await kv.incr(namespacedKey);
    if (count === 1) {
      await kv.expire(namespacedKey, windowSeconds);
    }
    const ttl = await kv.ttl(namespacedKey);
    const resetAt = Date.now() + Math.max(ttl, 0) * 1000;
    if (count > limit) {
      return { ok: false, remaining: 0, resetAt };
    }
    return { ok: true, remaining: limit - count, resetAt };
  } catch (err) {
    console.error("rateLimit KV error:", err);
    // Fail open on transient KV errors so legitimate users aren't locked out.
    return fallbackLimit(key, limit, windowMs);
  }
}

/**
 * Best-effort client IP extraction. Trust order matches what Vercel and
 * Cloudflare populate in front of the app.
 */
export function getClientIp(request: Request): string {
  const candidates = [
    request.headers.get("cf-connecting-ip")?.trim(),
    request.headers.get("x-real-ip")?.trim(),
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
  ].filter((value): value is string => Boolean(value));
  return candidates[0] || "unknown";
}
