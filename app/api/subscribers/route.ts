import { NextRequest, NextResponse } from "next/server";
import { createSubscriber, getSubscribers, getSubscriberByEmail } from "@/lib/db/queries";
import { sendEmail, getEmailHeaderAttachment } from "@/lib/email";
import { buildSubscriberWelcomeEmail } from "@/lib/email-templates/subscriber-welcome";
import { auth } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import {
  containsHeaderInjection,
  hasRequiredFormHeader,
  originIsTrusted,
  stripLineBreaks,
} from "@/lib/request-security";

const headers = { "X-API-Version": "1" };
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  // CSRF: same defenses as the contact form.
  if (!originIsTrusted(request) || !hasRequiredFormHeader(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers });
  }

  // Rate limit: 10 subscribe attempts per IP per hour. Subscribe is even
  // cheaper to spam than contact since there's no recipient choice.
  const ip = getClientIp(request);
  const rl = await rateLimit({
    key: `subscribe:${ip}`,
    limit: 10,
    windowSeconds: 3600,
  });
  if (!rl.ok) {
    const retryAfter = Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000));
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { ...headers, "Retry-After": String(retryAfter) } }
    );
  }

  try {
    const body = await request.json();
    const rawEmail = typeof body?.email === "string" ? body.email.trim() : "";
    // Reject email-header injection attempts before doing anything else.
    if (
      !rawEmail ||
      !/^\S+@\S+\.\S+$/.test(rawEmail) ||
      containsHeaderInjection(rawEmail) ||
      rawEmail.length > 254
    ) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400, headers });
    }
    const email = stripLineBreaks(rawEmail);

    // derive country/location from headers (best-effort)
    function readFirstHeader(names: string[]) {
      for (const name of names) {
        const v = request.headers.get(name);
        if (v && v.trim()) return v.trim();
      }
      return null;
    }

    function normalizeLocationValue(value: string | null) {
      if (!value) return null;
      if (value.toLowerCase() === "unknown") return null;
      return value;
    }

    const country = normalizeLocationValue(readFirstHeader(["x-vercel-ip-country", "cloudfront-viewer-country"]));

    // If already subscribed, return exists flag and avoid re-sending welcome
    const existing = await getSubscriberByEmail(email);

    const subscriber = await createSubscriber(email, country ?? undefined);

    if (existing) {
      return NextResponse.json({ success: true, exists: true, subscriber: { email: subscriber?.email ?? email, location: subscriber?.location ?? null } }, { status: 200, headers });
    }

    if (subscriber) {
      const unsubscribeUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/subscribers/unsubscribe?token=${encodeURIComponent(subscriber.token)}`;
      const welcome = buildSubscriberWelcomeEmail({ email: subscriber.email, unsubscribeUrl });

      try {
        const headerAttachment = await getEmailHeaderAttachment(false);
        await sendEmail({
          to: subscriber.email,
          subject: welcome.subject,
          html: welcome.html,
          text: welcome.text,
          replyTo: process.env.GMAIL_SMTP_USER,
          attachments: [headerAttachment],
        });
      } catch (err) {
        // log error but don't fail subscription
        console.error("Failed to send welcome email:", err);
      }
    }

    return NextResponse.json({ success: true, exists: false, subscriber: { email: subscriber?.email ?? email, location: subscriber?.location ?? null } }, { status: 201, headers });
  } catch (error) {
    console.error("POST /api/subscribers error:", error);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500, headers });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
    }

    const rows = await getSubscribers();

    const sanitized = rows.map((r) => ({ id: r.id, email: r.email, location: r.location ?? null, createdAt: r.createdAt }));
    return NextResponse.json({ subscribers: sanitized }, { headers });
  } catch (error) {
    console.error("GET /api/subscribers error:", error);
    return NextResponse.json({ error: "Failed to list subscribers" }, { status: 500, headers });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
    }

    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : undefined;
    const token = typeof body?.token === "string" ? body.token.trim() : undefined;

    if (!email && !token) {
      return NextResponse.json({ error: "Provide email or token to delete" }, { status: 400, headers });
    }

    if (email) {
      const { removeSubscriberByEmail } = await import("@/lib/db/queries");
      const removed = await removeSubscriberByEmail(email);
      if (!removed) return NextResponse.json({ error: "Subscriber not found" }, { status: 404, headers });
      return NextResponse.json({ success: true, removed }, { headers });
    }

    if (token) {
      const { removeSubscriberByToken } = await import("@/lib/db/queries");
      const removed = await removeSubscriberByToken(token);
      if (!removed) return NextResponse.json({ error: "Subscriber not found" }, { status: 404, headers });
      return NextResponse.json({ success: true, removed }, { headers });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400, headers });
  } catch (error) {
    console.error("DELETE /api/subscribers error:", error);
    return NextResponse.json({ error: "Failed to delete subscriber" }, { status: 500, headers });
  }
}
