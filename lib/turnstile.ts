const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

type TurnstileResponse = {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
};

export function isTurnstileConfigured(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

/**
 * Verifies a Cloudflare Turnstile token against the siteverify endpoint.
 *
 * Behaviour:
 * - If `TURNSTILE_SECRET_KEY` is not set:
 *     - In production: returns `{ ok: false }` so the form fails closed.
 *     - In dev:        returns `{ ok: true }` so local development works
 *                      without configuring keys.
 * - If `expectedAction` is provided, the response's `action` claim is checked.
 */
export async function verifyTurnstileToken(params: {
  token: string | undefined | null;
  remoteIp?: string;
  expectedAction?: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, reason: "turnstile-not-configured" };
    }
    return { ok: true };
  }

  const token = params.token?.trim();
  if (!token) {
    return { ok: false, reason: "missing-token" };
  }

  const formBody = new URLSearchParams();
  formBody.set("secret", secret);
  formBody.set("response", token);
  if (params.remoteIp && params.remoteIp !== "unknown") {
    formBody.set("remoteip", params.remoteIp);
  }

  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body: formBody,
      // No caching — siteverify tokens are single-use.
      cache: "no-store",
    });
    if (!res.ok) {
      return { ok: false, reason: `verify-http-${res.status}` };
    }
    const data = (await res.json()) as TurnstileResponse;
    if (!data.success) {
      return {
        ok: false,
        reason: data["error-codes"]?.join(",") || "verify-failed",
      };
    }
    if (
      params.expectedAction &&
      data.action &&
      data.action !== params.expectedAction
    ) {
      return { ok: false, reason: "action-mismatch" };
    }
    return { ok: true };
  } catch (err) {
    console.error("Turnstile verification error:", err);
    return { ok: false, reason: "verify-error" };
  }
}
