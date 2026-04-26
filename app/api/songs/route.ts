import { NextRequest, NextResponse } from "next/server";
import { getSongs, createSong, ensureUniqueSongSlug, getSubscribers, getLanguageByCode, isSongNotificationsEnabled } from "@/lib/db/queries";
import { createSongSchema } from "@/lib/validations/song";
import { auth } from "@/lib/auth";
import { deriveSongDefaultLanguage, deriveSongSlug } from "@/lib/song-utils";
import { revalidateSongMutationCaches } from "@/lib/song-cache-revalidation";
import { deriveSongPrimaryTitle } from "@/lib/song-utils";
import { sendEmail } from "@/lib/email";
import { buildNewSongNotificationEmail } from "@/lib/email-templates/new-song-notification";
import { siteUrl } from "@/lib/site";

const headers = { "X-API-Version": "1" };
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "15", 10), 100);
    const category = searchParams.get("category") ?? undefined;
    const language = searchParams.get("language") ?? undefined;

    const result = await getSongs({ page, limit, category, language });

    return NextResponse.json(result, { headers });
  } catch (error) {
    console.error("GET /api/songs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch songs" },
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
    const parsed = createSongSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400, headers }
      );
    }

    const { category, isPublished, translations } = parsed.data;
    const defaultLang = deriveSongDefaultLanguage(translations);
    const slug = await ensureUniqueSongSlug(
      deriveSongSlug(translations, { defaultLanguageCode: defaultLang })
    );

    const song = await createSong({
      slug,
      defaultLang,
      category: category ?? undefined,
      isPublished,
      translations,
    });

    revalidateSongMutationCaches(
      { id: song?.id ?? null, slug: song?.slug ?? slug },
      ["/admin", "/admin/songs"]
    );

    // Notify subscribers about the new song when it's published (best-effort, run in background)
    if (song?.isPublished) {
      void (async () => {
        try {
          const enabled = await isSongNotificationsEnabled();
          if (!enabled) return;
          const subscribers = await getSubscribers();
          if (!subscribers || subscribers.length === 0) return;

          const title = deriveSongPrimaryTitle(song?.translations ?? [], song?.defaultLang ?? defaultLang) || (translations[0]?.title ?? slug);

          await Promise.allSettled(subscribers.map(async (sub) => {
            try {
              const unsubscribeUrl = `${siteUrl.replace(/\/$/, "")}/api/subscribers/unsubscribe?token=${encodeURIComponent(sub.token)}`;
              const langName = (await getLanguageByCode(song?.defaultLang ?? defaultLang))?.name ?? (song?.defaultLang ?? defaultLang);
              const email = buildNewSongNotificationEmail({ title, slug: song?.slug ?? slug, unsubscribeUrl, language: langName, category: song?.category ?? undefined });
              await sendEmail({ to: sub.email, subject: email.subject, html: email.html, text: email.text, replyTo: process.env.GMAIL_SMTP_USER });
            } catch (err) {
              console.error("Failed to send new-song notification to", sub?.email, err);
            }
          }));
        } catch (err) {
          console.error("Failed to notify subscribers:", err);
        }
      })();
    }

    return NextResponse.json(song, { status: 201, headers });
  } catch (error) {
    console.error("POST /api/songs error:", error);
    return NextResponse.json(
      { error: "Failed to create song" },
      { status: 500, headers }
    );
  }
}
