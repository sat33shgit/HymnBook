import { db } from "./index";
import { songs, songTranslations, languages, userFavorites, appSettings } from "./schema";
import { eq, sql, and, desc, asc } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { CACHE_TAGS, CACHE_TTL, songIdTag, songSlugTag } from "@/lib/cache";

const PUBLIC_SONG_AUDIO_VISIBLE_KEY = "public_song_audio_visible";
const PUBLIC_SONG_YOUTUBE_VISIBLE_KEY = "public_song_youtube_visible";

// ─── Languages ───────────────────────────────────────────────

export async function getLanguages(activeOnly = false) {
  const cacheKey = activeOnly ? "active" : "all";

  return unstable_cache(
    async () => {
      const query = db
        .select()
        .from(languages)
        .orderBy(asc(languages.sortOrder));

      if (activeOnly) {
        return query.where(eq(languages.isActive, true));
      }
      return query;
    },
    ["getLanguages", cacheKey],
    {
      revalidate: CACHE_TTL.languages,
      tags: [CACHE_TAGS.languages],
    }
  )();
}

export async function getLanguageByCode(code: string) {
  return unstable_cache(
    async () => {
      const result = await db
        .select()
        .from(languages)
        .where(eq(languages.code, code))
        .limit(1);
      return result[0] ?? null;
    },
    ["getLanguageByCode", code],
    {
      revalidate: CACHE_TTL.languages,
      tags: [CACHE_TAGS.languages],
    }
  )();
}

export async function createLanguage(data: {
  code: string;
  name: string;
  nativeName: string;
  fontStack?: string;
  sortOrder?: number;
}) {
  const result = await db
    .insert(languages)
    .values({
      code: data.code,
      name: data.name,
      nativeName: data.nativeName,
      fontStack: data.fontStack ?? null,
      sortOrder: data.sortOrder ?? 0,
    })
    .returning();
  return result[0];
}

export async function updateLanguage(
  code: string,
  data: Partial<{
    name: string;
    nativeName: string;
    fontStack: string | null;
    sortOrder: number;
    isActive: boolean;
  }>
) {
  const result = await db
    .update(languages)
    .set(data)
    .where(eq(languages.code, code))
    .returning();
  return result[0];
}

export async function deleteLanguage(code: string) {
  return db.delete(languages).where(eq(languages.code, code));
}

// ─── Songs ───────────────────────────────────────────────────

export async function getSongs({
  page = 1,
  limit = 20,
  category,
  language,
  publishedOnly = true,
}: {
  page?: number;
  limit?: number;
  category?: string;
  language?: string;
  publishedOnly?: boolean;
} = {}) {
  const cacheKey = [
    "getSongs",
    `page:${page}`,
    `limit:${limit}`,
    `category:${category ?? "all"}`,
    `language:${language ?? "all"}`,
    `publishedOnly:${publishedOnly ? "1" : "0"}`,
  ];

  return unstable_cache(
    async () => {
      const offset = (page - 1) * limit;

      const conditions = [];
      if (publishedOnly) {
        conditions.push(eq(songs.isPublished, true));
      }
      if (category) {
        conditions.push(eq(songs.category, category));
      }

      const whereClause =
        conditions.length > 0
          ? conditions.length === 1
            ? conditions[0]
            : and(...conditions)
          : undefined;

      const songRows = await db
        .select()
        .from(songs)
        .where(whereClause)
        .orderBy(desc(songs.createdAt));

      const songIds = songRows.map((s) => s.id);
      const translations =
        songIds.length > 0
          ? await db
              .select()
              .from(songTranslations)
              .where(
                sql`${songTranslations.songId} = ANY(${sql.raw(
                  `ARRAY[${songIds.join(",")}]`
                )})`
              )
          : [];

      const data = songRows.map((song) => {
        const songTrans = translations.filter((t) => t.songId === song.id);
        const englishTitle = songTrans.find((t) => t.languageCode === "en")?.title;
        const defaultTitle = songTrans.find(
          (t) => t.languageCode === (song.defaultLang ?? "en")
        )?.title;
        return {
          id: song.id,
          slug: song.slug,
          category: song.category,
          defaultLang: song.defaultLang,
          viewCount: song.viewCount,
          isPublished: song.isPublished,
          title: englishTitle ?? defaultTitle ?? songTrans[0]?.title ?? "Untitled",
          languages: songTrans.map((t) => t.languageCode),
          hasAudio: songTrans.some((t) => (t.audioUrl ?? "").toString().trim() !== ""),
          hasYoutube: songTrans.some((t) => (t.youtubeUrl ?? "").toString().trim() !== ""),
        };
      });

      data.sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
      );

      const filteredData = language
        ? data.filter((song) => song.languages.includes(language))
        : data;

      const total = filteredData.length;
      const pagedData = filteredData.slice(offset, offset + limit);

      return {
        data: pagedData,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    },
    cacheKey,
    {
      revalidate: CACHE_TTL.songs,
      tags: [CACHE_TAGS.songs, CACHE_TAGS.categories],
    }
  )();
}

export async function getSongBySlug(slug: string) {
  return unstable_cache(
    async () => {
      const songRows = await db
        .select()
        .from(songs)
        .where(eq(songs.slug, slug))
        .limit(1);

      if (!songRows[0]) return null;

      const song = songRows[0];
      const translations = await db
        .select()
        .from(songTranslations)
        .where(eq(songTranslations.songId, song.id));

      return { ...song, translations };
    },
    ["getSongBySlug", slug],
    {
      revalidate: CACHE_TTL.song,
      tags: [CACHE_TAGS.songs, songSlugTag(slug)],
    }
  )();
}

export async function getSongById(id: number) {
  return unstable_cache(
    async () => {
      const songRows = await db
        .select()
        .from(songs)
        .where(eq(songs.id, id))
        .limit(1);

      if (!songRows[0]) return null;

      const song = songRows[0];
      const translations = await db
        .select()
        .from(songTranslations)
        .where(eq(songTranslations.songId, song.id));

      return { ...song, translations };
    },
    ["getSongById", String(id)],
    {
      revalidate: CACHE_TTL.song,
      tags: [CACHE_TAGS.songs, songIdTag(id)],
    }
  )();
}

export async function getMostViewedSongs(limit = 5) {
  const safeLimit = Math.min(Math.max(limit, 1), 20);

  return unstable_cache(
    async () => {
      const songRows = await db
        .select()
        .from(songs)
        .where(eq(songs.isPublished, true))
        .orderBy(desc(songs.viewCount), desc(songs.createdAt))
        .limit(safeLimit);

      const songIds = songRows.map((s) => s.id);
      const translations =
        songIds.length > 0
          ? await db
              .select()
              .from(songTranslations)
              .where(
                sql`${songTranslations.songId} = ANY(${sql.raw(
                  `ARRAY[${songIds.join(",")}]`
                )})`
              )
          : [];

      return songRows.map((song) => {
        const songTrans = translations.filter((t) => t.songId === song.id);
        const englishTitle = songTrans.find((t) => t.languageCode === "en")?.title;
        const defaultTitle = songTrans.find(
          (t) => t.languageCode === (song.defaultLang ?? "en")
        )?.title;

        return {
          id: song.id,
          slug: song.slug,
          category: song.category,
          defaultLang: song.defaultLang,
          viewCount: song.viewCount,
          isPublished: song.isPublished,
          title: englishTitle ?? defaultTitle ?? songTrans[0]?.title ?? "Untitled",
          languages: songTrans.map((t) => t.languageCode),
        };
      });
    },
    ["getMostViewedSongs", String(safeLimit)],
    {
      revalidate: CACHE_TTL.mostViewed,
      tags: [CACHE_TAGS.mostViewed, CACHE_TAGS.songs],
    }
  )();
}

export async function incrementSongViews(songId: number) {
  const result = await db
    .update(songs)
    .set({
      viewCount: sql`${songs.viewCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(songs.id, songId))
    .returning({
      id: songs.id,
      slug: songs.slug,
      viewCount: songs.viewCount,
    });

  return result[0] ?? null;
}

export async function createSong(data: {
  slug: string;
  category?: string;
  defaultLang?: string;
  isPublished?: boolean;
  translations: {
    languageCode: string;
    title: string;
    lyrics: string;
    englishMeaning?: string;
    audioUrl?: string | null;
    youtubeUrl?: string | null;
  }[];
}) {
  const [song] = await db
    .insert(songs)
    .values({
      slug: data.slug,
      category: data.category ?? null,
      defaultLang: data.defaultLang ?? "en",
      isPublished: data.isPublished ?? true,
    })
    .returning();

  if (data.translations.length > 0) {
    await db.insert(songTranslations).values(
      data.translations.map((t) => ({
        songId: song.id,
        languageCode: t.languageCode,
        title: t.title,
        lyrics: t.lyrics,
        englishMeaning: t.englishMeaning?.trim() ? t.englishMeaning : null,
        audioUrl: t.audioUrl ?? null,
        youtubeUrl: t.youtubeUrl ?? null,
      }))
    );
  }

  // Update search vectors
  await db.execute(
    sql`UPDATE song_translations SET search_vector = to_tsvector('english', coalesce(title, '') || ' ' || coalesce(lyrics, '')) WHERE song_id = ${song.id}`
  );

  return getSongById(song.id);
}

export async function updateSong(
  id: number,
  data: {
    slug?: string;
    category?: string | null;
    defaultLang?: string;
    isPublished?: boolean;
    translations?: {
      languageCode: string;
      title: string;
      lyrics: string;
      englishMeaning?: string;
      audioUrl?: string | null;
      youtubeUrl?: string | null;
    }[];
  }
) {
  const updateFields: Record<string, unknown> = { updatedAt: new Date() };
  if (data.slug !== undefined) updateFields.slug = data.slug;
  if (data.category !== undefined) updateFields.category = data.category;
  if (data.defaultLang !== undefined) updateFields.defaultLang = data.defaultLang;
  if (data.isPublished !== undefined) updateFields.isPublished = data.isPublished;

  await db.update(songs).set(updateFields).where(eq(songs.id, id));

  if (data.translations) {
    // Delete existing translations & re-insert
    await db
      .delete(songTranslations)
      .where(eq(songTranslations.songId, id));

    if (data.translations.length > 0) {
      await db.insert(songTranslations).values(
        data.translations.map((t) => ({
          songId: id,
          languageCode: t.languageCode,
          title: t.title,
          lyrics: t.lyrics,
          englishMeaning: t.englishMeaning?.trim() ? t.englishMeaning : null,
          audioUrl: t.audioUrl ?? null,
          youtubeUrl: t.youtubeUrl ?? null,
        }))
      );
    }

    // Update search vectors
    await db.execute(
      sql`UPDATE song_translations SET search_vector = to_tsvector('english', coalesce(title, '') || ' ' || coalesce(lyrics, '')) WHERE song_id = ${id}`
    );
  }

  return getSongById(id);
}

export async function deleteSong(id: number) {
  return db.delete(songs).where(eq(songs.id, id));
}

export async function getCategories() {
  return unstable_cache(
    async () => {
      const result = await db
        .selectDistinct({ category: songs.category })
        .from(songs)
        .where(eq(songs.isPublished, true))
        .orderBy(asc(songs.category));
      return result
        .map((r) => r.category)
        .filter((c): c is string => c !== null);
    },
    ["getCategories"],
    {
      revalidate: CACHE_TTL.categories,
      tags: [CACHE_TAGS.categories, CACHE_TAGS.songs],
    }
  )();
}

export async function getAllSlugs() {
  return unstable_cache(
    async () => {
      return db
        .select({ slug: songs.slug })
        .from(songs)
        .where(eq(songs.isPublished, true));
    },
    ["getAllSlugs"],
    {
      revalidate: CACHE_TTL.slugs,
      tags: [CACHE_TAGS.slugs, CACHE_TAGS.songs],
    }
  )();
}

export async function isPublicSongAudioVisible() {
  return unstable_cache(
    async () => {
      try {
        const rows = await db
          .select({ boolValue: appSettings.boolValue })
          .from(appSettings)
          .where(eq(appSettings.key, PUBLIC_SONG_AUDIO_VISIBLE_KEY))
          .limit(1);

        return rows[0]?.boolValue ?? true;
      } catch (error) {
        // During rollout, table may not exist before migration runs.
        if (
          error instanceof Error &&
          error.message.includes('relation "app_settings" does not exist')
        ) {
          return true;
        }
        throw error;
      }
    },
    ["isPublicSongAudioVisible"],
    {
      revalidate: CACHE_TTL.settings,
      tags: [CACHE_TAGS.settings],
    }
  )();
}

export async function setPublicSongAudioVisible(isVisible: boolean) {
  const result = await db
    .insert(appSettings)
    .values({
      key: PUBLIC_SONG_AUDIO_VISIBLE_KEY,
      boolValue: isVisible,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: {
        boolValue: isVisible,
        updatedAt: new Date(),
      },
    })
    .returning({ boolValue: appSettings.boolValue });

  return result[0]?.boolValue ?? true;
}

export async function isPublicSongYoutubeVisible() {
  return unstable_cache(
    async () => {
      try {
        const rows = await db
          .select({ boolValue: appSettings.boolValue })
          .from(appSettings)
          .where(eq(appSettings.key, PUBLIC_SONG_YOUTUBE_VISIBLE_KEY))
          .limit(1);

        return rows[0]?.boolValue ?? true;
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes('relation "app_settings" does not exist')
        ) {
          return true;
        }
        throw error;
      }
    },
    ["isPublicSongYoutubeVisible"],
    {
      revalidate: CACHE_TTL.settings,
      tags: [CACHE_TAGS.settings],
    }
  )();
}

export async function setPublicSongYoutubeVisible(isVisible: boolean) {
  const result = await db
    .insert(appSettings)
    .values({
      key: PUBLIC_SONG_YOUTUBE_VISIBLE_KEY,
      boolValue: isVisible,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { boolValue: isVisible, updatedAt: new Date() },
    })
    .returning({ boolValue: appSettings.boolValue });

  return result[0]?.boolValue ?? true;
}

// ─── Search ──────────────────────────────────────────────────

export async function searchSongs(
  query: string,
  lang?: string,
  includeUnpublished = false
) {
  const sanitized = query.replace(/[^\w\s\u0C00-\u0C7F\u0900-\u097F\u0B80-\u0BFF\u0D00-\u0D7F]/g, " ").trim();
  if (!sanitized) return [];

  return unstable_cache(
    async () => {
      const langCondition = lang
        ? sql`AND st.language_code = ${lang}`
        : sql``;

      const publishedCondition = includeUnpublished
        ? sql``
        : sql`AND s.is_published = true`;

      const results = await db.execute(sql`
        SELECT
          s.id as song_id,
          s.slug,
          s.is_published,
          st.title,
          st.language_code as matched_language,
          (
            SELECT EXISTS(
              SELECT 1 FROM song_translations st2 WHERE st2.song_id = s.id AND coalesce(st2.audio_url, '') <> ''
            )
          ) as has_audio,
          (
            SELECT EXISTS(
              SELECT 1 FROM song_translations st2 WHERE st2.song_id = s.id AND coalesce(st2.youtube_url, '') <> ''
            )
          ) as has_youtube,
          s.category,
          (
            CASE
              WHEN lower(st.title) = lower(${sanitized}) THEN 100
              WHEN st.title ILIKE ${"%" + sanitized + "%"} THEN 50
              WHEN coalesce(st.english_meaning, '') ILIKE ${"%" + sanitized + "%"} THEN 30
              WHEN coalesce(s.category, '') ILIKE ${"%" + sanitized + "%"} THEN 20
              WHEN l.name ILIKE ${"%" + sanitized + "%"} THEN 20
              WHEN l.native_name ILIKE ${"%" + sanitized + "%"} THEN 20
              WHEN l.code ILIKE ${"%" + sanitized + "%"} THEN 15
              WHEN st.lyrics ILIKE ${"%" + sanitized + "%"} THEN 10
              ELSE 0
            END
          ) + coalesce(ts_rank(st.search_vector, plainto_tsquery('english', ${sanitized})), 0) as match_score,
          ts_headline('english', st.lyrics, plainto_tsquery('english', ${sanitized}),
            'MaxWords=30, MinWords=10, StartSel=<mark>, StopSel=</mark>'
          ) as matched_text
        FROM song_translations st
        JOIN songs s ON s.id = st.song_id
        JOIN languages l ON l.code = st.language_code
        WHERE 1=1
          ${publishedCondition}
          ${langCondition}
          AND (
            st.search_vector @@ plainto_tsquery('english', ${sanitized})
            OR st.title ILIKE ${"%" + sanitized + "%"}
            OR st.lyrics ILIKE ${"%" + sanitized + "%"}
            OR coalesce(st.english_meaning, '') ILIKE ${"%" + sanitized + "%"}
            OR coalesce(s.category, '') ILIKE ${"%" + sanitized + "%"}
            OR l.name ILIKE ${"%" + sanitized + "%"}
            OR l.native_name ILIKE ${"%" + sanitized + "%"}
            OR l.code ILIKE ${"%" + sanitized + "%"}
          )
        ORDER BY
          match_score DESC,
          st.title ASC
        LIMIT 50
      `);

      return results.rows as {
        song_id: number;
        slug: string;
        is_published: boolean;
        title: string;
        matched_language: string;
        has_audio: boolean;
        matched_text: string;
        category: string | null;
      }[];
    },
    ["searchSongs", sanitized.toLowerCase(), lang ?? "all", includeUnpublished ? "1" : "0"],
    {
      revalidate: CACHE_TTL.search,
      tags: [CACHE_TAGS.search, CACHE_TAGS.songs],
    }
  )();
}

// ─── Favorites ───────────────────────────────────────────────

export async function getUserFavorites(userId: string) {
  const results = await db
    .select({
      songId: userFavorites.songId,
      addedAt: userFavorites.addedAt,
    })
    .from(userFavorites)
    .where(eq(userFavorites.userId, userId))
    .orderBy(desc(userFavorites.addedAt));

  return results;
}

export async function addFavorite(userId: string, songId: number) {
  return db
    .insert(userFavorites)
    .values({ userId, songId })
    .onConflictDoNothing();
}

export async function removeFavorite(userId: string, songId: number) {
  return db
    .delete(userFavorites)
    .where(
      and(
        eq(userFavorites.userId, userId),
        eq(userFavorites.songId, songId)
      )
    );
}

export async function syncFavorites(userId: string, songIds: number[]) {
  for (const songId of songIds) {
    await db
      .insert(userFavorites)
      .values({ userId, songId })
      .onConflictDoNothing();
  }
  return getUserFavorites(userId);
}
