import { NextRequest, NextResponse } from "next/server";
import { getSubscriberByToken, removeSubscriberByToken } from "@/lib/db/queries";

const headers = { "X-API-Version": "1" };
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token") ?? undefined;
    if (!token) {
      return new NextResponse("Missing token", { status: 400, headers });
    }

    const subscriber = await getSubscriberByToken(token);
    if (!subscriber) {
      const html = `<html><body><h1>Unsubscribe</h1><p>Subscription not found or already removed.</p></body></html>`;
      return new NextResponse(html, { headers: { ...headers, "Content-Type": "text/html" } });
    }

    await removeSubscriberByToken(token);

    const html = `<html><body><h1>Unsubscribed</h1><p>${subscriber.email} has been removed from our mailing list.</p></body></html>`;
    return new NextResponse(html, { headers: { ...headers, "Content-Type": "text/html" } });
  } catch (error) {
    console.error("GET /api/subscribers/unsubscribe error:", error);
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500, headers });
  }
}
