import { NextResponse } from "next/server";

const COMMON_HEADERS = { "X-API-Version": "1" } as const;

/**
 * Standardized 500 response. Logs the full error server-side and returns a
 * generic message to the client in production. In development the message
 * field includes the error string for easier debugging.
 *
 * Never returns stack traces, internal field names, or DB metadata to the
 * caller.
 */
export function jsonServerError(
  context: string,
  error: unknown,
  extraHeaders: Record<string, string> = {}
) {
  console.error(`${context} error:`, error);

  const generic = "Something went wrong. Please try again.";
  const debug =
    process.env.NODE_ENV === "production"
      ? undefined
      : error instanceof Error
        ? error.message
        : String(error);

  return NextResponse.json(
    debug ? { error: generic, debug } : { error: generic },
    { status: 500, headers: { ...COMMON_HEADERS, ...extraHeaders } }
  );
}

/**
 * Convenience for explicit error responses (400/401/403/404/429). Always
 * includes the API version header.
 */
export function jsonError(
  status: number,
  message: string,
  extraHeaders: Record<string, string> = {}
) {
  return NextResponse.json(
    { error: message },
    { status, headers: { ...COMMON_HEADERS, ...extraHeaders } }
  );
}
