import { siteUrl } from "@/lib/site";

/**
 * Returns the set of origins the app considers same-origin. In production
 * this is just the canonical site URL; in dev it also allows localhost.
 */
function getAllowedOrigins(): Set<string> {
  const allowed = new Set<string>();
  try {
    allowed.add(new URL(siteUrl).origin);
  } catch {
    // ignore — siteUrl validation runs elsewhere
  }
  if (process.env.NODE_ENV !== "production") {
    allowed.add("http://localhost:3000");
    allowed.add("http://127.0.0.1:3000");
  }
  return allowed;
}

/**
 * Defends against CSRF by requiring the request to come from a trusted origin.
 *
 * We check Origin first (set automatically by browsers on POST), and fall back
 * to Referer. A request with neither is rejected — any legitimate same-origin
 * form POST will set at least one of the two.
 */
export function originIsTrusted(request: Request): boolean {
  const allowedOrigins = getAllowedOrigins();
  const origin = request.headers.get("origin");

  if (origin) {
    return allowedOrigins.has(origin);
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return allowedOrigins.has(new URL(referer).origin);
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Custom-header CSRF check. Browsers issue a CORS preflight before sending a
 * request with a non-CORS-safelisted header from a different origin, and our
 * server doesn't respond to OPTIONS with the right Access-Control-Allow-*
 * headers, so the actual POST never fires from a third-party page. Layered
 * on top of the Origin check this stops simple cross-origin form replays.
 */
export const REQUIRED_FORM_HEADER_NAME = "x-hymnbook-form";
export const REQUIRED_FORM_HEADER_VALUE = "1";

export function hasRequiredFormHeader(request: Request): boolean {
  return (
    request.headers.get(REQUIRED_FORM_HEADER_NAME) ===
    REQUIRED_FORM_HEADER_VALUE
  );
}

// --- Email-injection helpers ---------------------------------------------

// Any of these characters can be used to inject extra headers into an SMTP
// message (header smuggling). Checked by char code so the source is
// unambiguous regardless of how the file is encoded.
//   0x0A LF
//   0x0D CR
//   0x85 NEL
//   0x2028 Line Separator
//   0x2029 Paragraph Separator
const LINE_BREAK_CODE_POINTS = new Set<number>([
  0x0a, 0x0d, 0x85, 0x2028, 0x2029,
]);

export function containsHeaderInjection(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    if (LINE_BREAK_CODE_POINTS.has(value.charCodeAt(i))) {
      return true;
    }
  }
  return false;
}

/**
 * Replace any line-break-like character with a single space. Use this on
 * any field that flows into an email header (subject, From name, Reply-To
 * display name, etc.) before passing it to nodemailer.
 */
export function stripLineBreaks(value: string): string {
  let out = "";
  let lastWasBreak = false;
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (LINE_BREAK_CODE_POINTS.has(code)) {
      if (!lastWasBreak) {
        out += " ";
        lastWasBreak = true;
      }
    } else {
      out += value[i];
      lastWasBreak = false;
    }
  }
  return out.trim();
}
