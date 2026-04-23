import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import {
  deleteContactMessage,
  getContactMessageById,
} from "@/lib/db/queries";
import { CACHE_TAGS } from "@/lib/cache";

const headers = { "X-API-Version": "1" };
export const runtime = "nodejs";

async function requireAdmin() {
  const session = await auth();
  return session?.user ? session : null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers }
      );
    }

    const { id } = await params;
    const messageId = parseInt(id, 10);
    if (isNaN(messageId)) {
      return NextResponse.json(
        { error: "Invalid message ID" },
        { status: 400, headers }
      );
    }

    const message = await getContactMessageById(messageId);
    if (!message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404, headers }
      );
    }

    return NextResponse.json(message, { headers });
  } catch (error) {
    console.error("GET /api/admin/contact-messages/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch message" },
      { status: 500, headers }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers }
      );
    }

    const { id } = await params;
    const messageId = parseInt(id, 10);
    if (isNaN(messageId)) {
      return NextResponse.json(
        { error: "Invalid message ID" },
        { status: 400, headers }
      );
    }

    const deleted = await deleteContactMessage(messageId);
    if (!deleted) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404, headers }
      );
    }

    revalidateTag(CACHE_TAGS.messages, "max");
    return NextResponse.json({ success: true }, { headers });
  } catch (error) {
    console.error("DELETE /api/admin/contact-messages/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500, headers }
    );
  }
}
