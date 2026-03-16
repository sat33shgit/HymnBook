import { NextRequest, NextResponse } from "next/server";
import {
  getLanguages,
  createLanguage,
  updateLanguage,
  deleteLanguage,
} from "@/lib/db/queries";
import {
  createLanguageSchema,
  updateLanguageSchema,
} from "@/lib/validations/song";
import { auth } from "@/lib/auth";
import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";

const headers = { "X-API-Version": "1" };

export async function GET() {
  try {
    const langs = await getLanguages();
    return NextResponse.json({ languages: langs }, { headers });
  } catch (error) {
    console.error("GET /api/languages error:", error);
    return NextResponse.json(
      { error: "Failed to fetch languages" },
      { status: 500, headers }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers }
      );
    }

    const body = await request.json();
    const parsed = createLanguageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400, headers }
      );
    }

    const lang = await createLanguage(parsed.data);
    revalidateTag(CACHE_TAGS.languages, "max");
    return NextResponse.json(lang, { status: 201, headers });
  } catch (error) {
    console.error("POST /api/languages error:", error);
    return NextResponse.json(
      { error: "Failed to create language" },
      { status: 500, headers }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers }
      );
    }

    const body = await request.json();
    const { code, ...data } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Language code is required" },
        { status: 400, headers }
      );
    }

    const parsed = updateLanguageSchema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400, headers }
      );
    }

    const lang = await updateLanguage(code, parsed.data);
    revalidateTag(CACHE_TAGS.languages, "max");
    return NextResponse.json(lang, { headers });
  } catch (error) {
    console.error("PUT /api/languages error:", error);
    return NextResponse.json(
      { error: "Failed to update language" },
      { status: 500, headers }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers }
      );
    }

    const { code } = await request.json();
    if (!code) {
      return NextResponse.json(
        { error: "Language code is required" },
        { status: 400, headers }
      );
    }

    await deleteLanguage(code);
    revalidateTag(CACHE_TAGS.languages, "max");
    return NextResponse.json({ success: true }, { headers });
  } catch (error) {
    console.error("DELETE /api/languages error:", error);
    return NextResponse.json(
      { error: "Failed to delete language" },
      { status: 500, headers }
    );
  }
}
