import { NextResponse } from "next/server";
import { isSongNotificationsEnabled, setSongNotificationsEnabled } from "@/lib/db/queries";

export async function GET() {
  try {
    const enabled = await isSongNotificationsEnabled();
    return NextResponse.json({ enabled });
  } catch (err) {
    console.error("GET /api/admin/site-settings/song-notifications error:", err);
    return NextResponse.json({ error: "Failed to read setting" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const enabled = Boolean(body.enabled);
    const result = await setSongNotificationsEnabled(enabled);
    return NextResponse.json({ enabled: result });
  } catch (err) {
    console.error("PUT /api/admin/site-settings/song-notifications error:", err);
    return NextResponse.json({ error: "Failed to update setting" }, { status: 500 });
  }
}
