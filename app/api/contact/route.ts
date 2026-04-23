import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createContactMessage } from "@/lib/db/queries";
import { CACHE_TAGS } from "@/lib/cache";
import { createContactMessageSchema } from "@/lib/validations/contact";

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
  try {
    const body = await request.json();
    const parsed = createContactMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
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

    const message = await createContactMessage({
      ...parsed.data,
      country,
      deviceType: getDeviceType(userAgent),
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
      { error: "Failed to send message" },
      { status: 500, headers }
    );
  }
}
