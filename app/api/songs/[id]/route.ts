import { NextRequest, NextResponse } from "next/server";
import { getSongById, updateSong, deleteSong } from "@/lib/db/queries";
import { extractR2ObjectKeyFromUrl, deleteSongAudioFromR2, deleteObjectsByPrefix } from "@/lib/r2";
import { updateSongSchema } from "@/lib/validations/song";
import { auth } from "@/lib/auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { CACHE_TAGS, songIdTag, songSlugTag } from "@/lib/cache";

const headers = { "X-API-Version": "1" };

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const songId = parseInt(id, 10);
    if (isNaN(songId)) {
      return NextResponse.json(
        { error: "Invalid song ID" },
        { status: 400, headers }
      );
    }

    const song = await getSongById(songId);
    if (!song) {
      return NextResponse.json(
        { error: "Song not found" },
        { status: 404, headers }
      );
    }

    return NextResponse.json(song, { headers });
  } catch (error) {
    console.error("GET /api/songs/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch song" },
      { status: 500, headers }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers }
      );
    }

    const { id } = await params;
    const songId = parseInt(id, 10);
    if (isNaN(songId)) {
      return NextResponse.json(
        { error: "Invalid song ID" },
        { status: 400, headers }
      );
    }

    const body = await request.json();
    const parsed = updateSongSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400, headers }
      );
    }

    // Delete any removed/replaced audio objects from R2. If any deletion fails,
    // abort and do NOT modify the DB so that the audioUrl remains in the table.
    const deletionErrors: Array<{ lang: string; error: unknown }> = [];
    const existing = await getSongById(songId);
    if (existing?.translations) {
      for (const oldT of existing.translations) {
        const incoming = parsed.data.translations?.find(
          (t: { languageCode: string }) => t.languageCode === oldT.languageCode
        );

        const oldUrl = oldT.audioUrl;
        const newUrl = incoming?.audioUrl ?? null;

        // If there was an old URL and it's being removed or replaced, delete the R2 object
        if (oldUrl && (!newUrl || newUrl !== oldUrl)) {
          try {
            const key = extractR2ObjectKeyFromUrl(oldUrl);
            await deleteSongAudioFromR2(key);
          } catch (err) {
            console.error("Failed to delete old audio from R2:", err);
            deletionErrors.push({ lang: oldT.languageCode, error: err });
          }
        }
      }
    }

    if (deletionErrors.length > 0) {
      // Don't apply DB changes if any R2 deletions failed.
      return NextResponse.json(
        { error: "Failed to delete audio files from storage. Aborting update.", details: deletionErrors },
        { status: 500, headers }
      );
    }

    const song = await updateSong(songId, parsed.data);

    revalidateTag(CACHE_TAGS.songs, "max");
    revalidateTag(CACHE_TAGS.mostViewed, "max");
    revalidateTag(CACHE_TAGS.categories, "max");
    revalidateTag(CACHE_TAGS.slugs, "max");
    revalidateTag(CACHE_TAGS.search, "max");
    revalidateTag(songIdTag(songId), "max");
    if (song?.slug) {
      revalidateTag(songSlugTag(song.slug), "max");
    }
    revalidatePath("/admin");
    revalidatePath("/admin/songs");
    revalidatePath(`/admin/songs/${songId}/edit`);

    return NextResponse.json(song, { headers });
  } catch (error) {
    console.error("PUT /api/songs/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update song" },
      { status: 500, headers }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers }
      );
    }

    const { id } = await params;
    const songId = parseInt(id, 10);
    if (isNaN(songId)) {
      return NextResponse.json(
        { error: "Invalid song ID" },
        { status: 400, headers }
      );
    }

    const existingSong = await getSongById(songId);
    // Delete audio objects for all translations first. If any deletion fails,
    // abort and do NOT remove DB records so URLs remain intact.
    const deletionErrors: Array<{ lang?: string; error: unknown }> = [];
    if (existingSong?.translations) {
      for (const t of existingSong.translations) {
        if (t.audioUrl) {
          try {
            const key = extractR2ObjectKeyFromUrl(t.audioUrl);
            await deleteSongAudioFromR2(key);
            continue;
          } catch (err) {
            // record error for reporting; avoid verbose debug logs here
            deletionErrors.push({ lang: t.languageCode, error: err });
          }

          // Try prefix deletion using slug-language variant and fallback to song slug
          const candidates = [] as string[];
          if (existingSong.slug) {
            candidates.push(`${existingSong.slug}-${t.languageCode}`);
            candidates.push(existingSong.slug);
          }

          let prefixDeleted = false;
          for (const c of candidates) {
            try {
              const res = await deleteObjectsByPrefix(c);
              if (res && res.deleted && res.deleted > 0) {
                prefixDeleted = true;
                break;
              }
            } catch {
              // record and continue; avoid noisy console output
            }
          }

          if (!prefixDeleted) {
            deletionErrors.push({ lang: t.languageCode, error: "Prefix deletion attempts failed" });
          }
        }
      }
    }

    if (deletionErrors.length > 0) {
      // Attempt fallback: delete by slug prefix
      try {
        if (existingSong?.slug) {
          const fallback = await deleteObjectsByPrefix(existingSong.slug);
          if (fallback.deleted && fallback.deleted > 0) {
            // proceed to delete DB now
            await deleteSong(songId);
            return NextResponse.json({ success: true, deleted: fallback.deleted }, { headers });
          } else {
            // Try more aggressive matching deletion
            try {
              const langCodes = (existingSong.translations ?? []).map((t: { languageCode: string }) => t.languageCode);
              const identifiers = (existingSong.translations ?? [])
                .map((t: { audioUrl?: string | null }) => {
                  try {
                    if (!t.audioUrl) return "";
                    const u = new URL(t.audioUrl);
                    return decodeURIComponent(u.pathname.replace(/.*\//, "")).toLowerCase();
                  } catch {
                    return "";
                  }
                })
                .filter(Boolean);

              const matchFallback = await deleteObjectsMatchingSong(existingSong.slug, langCodes, identifiers);
              if (matchFallback.deleted && matchFallback.deleted > 0) {
                await deleteSong(songId);
                return NextResponse.json({ success: true, deleted: matchFallback.deleted }, { headers });
              }
            } catch {
              // matching fallback failure recorded; proceed to aggregated error handling
            }

            return NextResponse.json(
              { error: "Failed to delete one or more audio files from storage. Aborting delete.", details: deletionErrors },
              { status: 500, headers }
            );
          }
        } else {
          return NextResponse.json(
            { error: "Failed to delete one or more audio files from storage. Aborting delete.", details: deletionErrors },
            { status: 500, headers }
          );
        }
      } catch {
        // fallback deletion failed; report to caller without extra debug logs
        return NextResponse.json(
          { error: "Failed to delete audio files from storage (fallback failed). Aborting delete.", details: deletionErrors },
          { status: 500, headers }
        );
      }
    }

    await deleteSong(songId);

    revalidateTag(CACHE_TAGS.songs, "max");
    revalidateTag(CACHE_TAGS.mostViewed, "max");
    revalidateTag(CACHE_TAGS.categories, "max");
    revalidateTag(CACHE_TAGS.slugs, "max");
    revalidateTag(CACHE_TAGS.search, "max");
    revalidateTag(songIdTag(songId), "max");
    if (existingSong?.slug) {
      revalidateTag(songSlugTag(existingSong.slug), "max");
    }
    revalidatePath("/admin");
    revalidatePath("/admin/songs");
    revalidatePath(`/admin/songs/${songId}/edit`);

    return NextResponse.json({ success: true }, { headers });
  } catch (error) {
    console.error("DELETE /api/songs/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete song" },
      { status: 500, headers }
    );
  }
}
