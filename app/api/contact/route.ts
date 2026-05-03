import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createContactMessage } from "@/lib/db/queries";
import { CACHE_TAGS } from "@/lib/cache";
import { createContactMessageSchema } from "@/lib/validations/contact";
import { sendEmail, getEmailHeaderAttachment } from "@/lib/email";
import { buildContactConfirmationEmail } from "@/lib/email-templates/contact-confirmation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile";
import {
  hasRequiredFormHeader,
  originIsTrusted,
  stripLineBreaks,
} from "@/lib/request-security";

const headers = { "X-API-Version": "1" };
export const runtime = "nodejs";

function readFirstHeader(request: NextRequest, names: string[]) {
  for (const name of names) {
    const value = request.headers.get(name);
    if (value && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function normalizeLocationValue(value: string | null) {
  if (!value) return null;
  if (value.toLowerCase() === "unknown") return null;
  return value;
}

function getDeviceType(userAgent: string | null) {
  const ua = (userAgent ?? "").toLowerCase();

  if (!ua) return null;
  if (
    /mobile|iphone|ipod|windows phone|blackberry|opera mini/i.test(ua) &&
    !/ipad|tablet/i.test(ua)
  ) {
    return "mobile";
  }
  if (/ipad|tablet|android(?!.*mobile)|kindle|silk/i.test(ua)) {
    return "tablet";
  }
  return "desktop";
}

export async function POST(request: NextRequest) {
  // 1. CSRF: require the request to come from our own origin and to carry
  //    the custom header set by our client. Either layer alone would be
  //    enough; both together make CSRF essentially impossible.
  if (!originIsTrusted(request)) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403, headers }
    );
  }
  if (!hasRequiredFormHeader(request)) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403, headers }
    );
  }

  // 2. Rate limit by client IP. 5 submissions per 10 minutes per IP is
  //    enough for legitimate users (re-submits, multiple family members on
  //    the same NAT) but cuts off spam floods.
  const ip = getClientIp(request);
  const rl = await rateLimit({
    key: `contact:${ip}`,
    limit: 5,
    windowSeconds: 600,
  });
  if (!rl.ok) {
    const retryAfter = Math.max(
      1,
      Math.ceil((rl.resetAt - Date.now()) / 1000)
    );
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          ...headers,
          "Retry-After": String(retryAfter),
        },
      }
    );
  }

  try {
    const body = await request.json();
    const parsed = createContactMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400, headers }
      );
    }

    // 3. Honeypot. Real users never see the `website` field; any non-empty
    //    value is a bot. Return 200 so scanners can't tell the difference
    //    between a real success and a silent drop.
    if (parsed.data.website && parsed.data.website.length > 0) {
      console.warn("Contact form honeypot triggered", { ip });
      return NextResponse.json(
        { success: true, id: null },
        { status: 201, headers }
      );
    }

    // 4. Cloudflare Turnstile. Must succeed before we touch the DB or
    //    email pipeline.
    const turnstile = await verifyTurnstileToken({
      token: parsed.data.turnstileToken,
      remoteIp: ip,
      expectedAction: "contact",
    });
    if (!turnstile.ok) {
      return NextResponse.json(
        { error: "Captcha verification failed" },
        { status: 400, headers }
      );
    }

    const userAgent = request.headers.get("user-agent");
    const country = normalizeLocationValue(
      readFirstHeader(request, [
        "x-vercel-ip-country",
        "cloudfront-viewer-country",
      ])
    );
    const deviceType = getDeviceType(userAgent);
    const submittedAt = new Date();

    // Strip the honeypot + Turnstile fields before persisting.
    const {
      website: _honeypot,
      turnstileToken: _ts,
      ...persistable
    } = parsed.data;
    void _honeypot;
    void _ts;

    const message = await createContactMessage({
      ...persistable,
      country,
      deviceType,
    });

    // 5. Defense-in-depth: sanitize anything that flows into an email
    //    header (subject and Reply-To). The validator already rejects
    //    line-breaks but we strip again here so a future schema change
    //    can't introduce a header-injection bug.
    const safeReplyTo = stripLineBreaks(persistable.email);
    const safeFromUser = process.env.GMAIL_SMTP_USER;

    const confirmationEmail = buildContactConfirmationEmail({
      form: persistable,
      submittedAt,
    });
    const safeSubject = stripLineBreaks(confirmationEmail.subject);

    const headerAttachment = await getEmailHeaderAttachment(false);
    await sendEmail({
      to: safeReplyTo,
      subject: safeSubject,
      html: confirmationEmail.html,
      text: confirmationEmail.text,
      replyTo: safeFromUser,
      attachments: [headerAttachment],
    });

    revalidateTag(CACHE_TAGS.messages, "max");

    return NextResponse.json(
      {
        success: true,
        id: message?.id ?? null,
      },
      { status: 201, headers }
    );
  } catch (error) {
    console.error("POST /api/contact error:", error);
    return NextResponse.json(
      { error: "Failed to send message or confirmation email" },
      { status: 500, headers }
    );
  }
}
