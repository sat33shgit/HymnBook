import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  isPublicContactVisible,
  setPublicContactVisible,
} from "@/lib/db/queries";
import { revalidatePath, revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";

const headers = { "X-API-Version": "1" };

export async function GET() {
  try {
    const visible = await isPublicContactVisible();
    return NextResponse.json({ visible }, { headers });
  } catch (error) {
    console.error("GET /api/admin/site-settings/contact-visibility error:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact visibility setting" },
      { status: 500, headers }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
    }

    const body = await request.json();
    if (typeof body?.visible !== "boolean") {
      return NextResponse.json(
        { error: "Invalid payload. 'visible' must be a boolean." },
        { status: 400, headers }
      );
    }

    const visible = await setPublicContactVisible(body.visible);

    revalidateTag(CACHE_TAGS.settings, "max");
    revalidatePath("/");
    revalidatePath("/contact");
    revalidatePath("/songs", "layout");

    return NextResponse.json({ visible }, { headers });
  } catch (error) {
    console.error("PUT /api/admin/site-settings/contact-visibility error:", error);
    return NextResponse.json(
      { error: "Failed to update contact visibility setting" },
      { status: 500, headers }
    );
  }
}
