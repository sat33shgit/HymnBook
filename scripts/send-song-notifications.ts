import "dotenv/config";
import { DateTime } from "luxon";
import { db } from "../lib/db/index";
import { songs as songsTable, songTranslations as songTranslationsTable, subscribers as subscribersTable, appSettings as appSettingsTable, languages as languagesTable } from "../lib/db/schema";
import { eq, and, gt, asc, desc, inArray } from "drizzle-orm";
import { deriveSongDisplayTitle } from "../lib/song-utils";
import { buildNewSongsDigestEmail } from "../lib/email-templates/new-songs-digest";
import { sendEmail } from "../lib/email";
import { siteUrl } from "../lib/site";

async function run() {
  console.log("Starting send-song-notifications script...");

  // Direct DB queries (avoid server-only unstable_cache wrappers)
  async function isSongNotificationsEnabledDirect(): Promise<boolean> {
    try {
      const rows = await db
        .select({ boolValue: appSettingsTable.boolValue })
        .from(appSettingsTable)
        .where(eq(appSettingsTable.key, "song_notifications_enabled"))
        .limit(1);

      return rows[0]?.boolValue ?? false;
    } catch (error) {
      // If the table doesn't exist (fresh DB), behave as disabled
      if (error instanceof Error && error.message.includes("relation \"app_settings\" does not exist")) {
        return false;
      }
      throw error;
    }
  }

  async function getLastSongNotificationTimeDirect(): Promise<Date | null> {
    const rows = await db
      .select({ updatedAt: appSettingsTable.updatedAt })
      .from(appSettingsTable)
      .where(eq(appSettingsTable.key, "last_song_notifications"))
      .limit(1);

    return rows[0]?.updatedAt ?? null;
  }

  async function touchLastSongNotificationTimeDirect(): Promise<void> {
    await db
      .insert(appSettingsTable)
      .values({ key: "last_song_notifications", boolValue: true, updatedAt: new Date() })
      .onConflictDoUpdate({ target: appSettingsTable.key, set: { updatedAt: new Date(), boolValue: true } });
  }

  async function getSubscribersDirect(): Promise<any[]> {
    return db.select().from(subscribersTable).orderBy(desc(subscribersTable.createdAt));
  }

  async function getSongsAddedSinceDirect(since: Date): Promise<any[]> {
    const songRows = await db
      .select()
      .from(songsTable)
      .where(and(eq(songsTable.isPublished, true), gt(songsTable.createdAt, since)))
      .orderBy(asc(songsTable.createdAt));

    if (songRows.length === 0) return [];

    const songIds = songRows.map((s) => s.id);

    const translations = await db
      .select({ songId: songTranslationsTable.songId, languageCode: songTranslationsTable.languageCode, title: songTranslationsTable.title, lyrics: songTranslationsTable.lyrics, audioUrl: songTranslationsTable.audioUrl, youtubeUrl: songTranslationsTable.youtubeUrl })
      .from(songTranslationsTable)
      .where(inArray(songTranslationsTable.songId, songIds))
      .orderBy(asc(songTranslationsTable.languageCode));

    const translationsBySongId = new Map<number, any[]>();
    for (const t of translations) {
      const arr = translationsBySongId.get(t.songId) ?? [];
      arr.push({ languageCode: t.languageCode, title: t.title, lyrics: t.lyrics ?? null, audioUrl: t.audioUrl, youtubeUrl: t.youtubeUrl });
      translationsBySongId.set(t.songId, arr);
    }

    return songRows.map((song) => ({ ...song, translations: translationsBySongId.get(song.id) ?? [] }));
  }

  const lastSentRaw = await getLastSongNotificationTimeDirect();
  const lastSent = lastSentRaw ? new Date(lastSentRaw) : null;

  // Configuration: timezone and scheduled time (defaults to 17:00 America/Los_Angeles)
  const TZ = process.env.SONG_NOTIFICATIONS_TIMEZONE ?? process.env.NOTIFICATION_TIMEZONE ?? "America/Los_Angeles";
  const HOUR = Number(process.env.SONG_NOTIFICATIONS_HOUR ?? process.env.NOTIFICATION_HOUR ?? "17");
  const MINUTE = Number(process.env.SONG_NOTIFICATIONS_MINUTE ?? process.env.NOTIFICATION_MINUTE ?? "0");

  // Allow forced runs (useful for debugging): set FORCE_SEND=1
  const FORCE = process.env.FORCE_SEND === "1" || process.env.FORCE_SEND === "true";

  // If not forced, only run when the current time in TZ matches the configured schedule
  const nowTzCheck = DateTime.now().setZone(TZ);
  if (!FORCE) {
    if (nowTzCheck.hour !== HOUR || nowTzCheck.minute !== MINUTE) {
      console.log(
        `Not scheduled time in ${TZ} (current ${nowTzCheck.toFormat("HH:mm")}). Exiting without sending.`
      );
      return;
    }
  }

  // Check admin flag in DB; if disabled, exit
  try {
    const enabled = await isSongNotificationsEnabledDirect();
    if (!enabled) {
      console.log("Song notifications are disabled in admin settings. Exiting.");
      return;
    }
  } catch (err) {
    console.error("Failed to read song notifications flag, aborting:", err);
    return;
  }

  // Compute the window to query for new songs. Prefer the last-sent marker when it
  // exists and is older than 24 hours; otherwise use the past 24 hours as the safe
  // fallback. This avoids the case where a recent last-sent timestamp (e.g. from a
  // manual test run) would set the window to 'now' and return no songs.
  const fallback = DateTime.now().toUTC().minus({ hours: 24 });
  let since: Date;
  if (lastSent) {
    const lastSentDt = DateTime.fromJSDate(lastSent).toUTC();
    // If lastSent is older than the 24h window, use it (we haven't sent in >24h).
    // If lastSent is within the last 24h (e.g. a recent test run), use fallback
    // so we still scan the full 24-hour window.
    if (lastSentDt < fallback) {
      since = lastSent;
    } else {
      since = fallback.toJSDate();
    }
  } else {
    since = fallback.toJSDate();
  }

  console.log("Fetching songs added since:", since.toISOString());
  const songList = await getSongsAddedSinceDirect(since);

  if (!songList || songList.length === 0) {
    console.log("No new songs to notify.");
    // update last-sent marker so we don't re-run for the same window
    await touchLastSongNotificationTimeDirect();
    return;
  }

  console.log(`Found ${songList.length} new song(s). Preparing digest...`);

  const subscriberRows = await getSubscribersDirect();
  if (!subscriberRows || subscriberRows.length === 0) {
    console.log("No subscribers registered. Aborting.");
    // still touch marker to avoid repeating
    await touchLastSongNotificationTimeDirect();
    return;
  }

  // Build a language lookup to map codes to full names
  const languageRows = await db.select({ code: languagesTable.code, name: languagesTable.name }).from(languagesTable);
  const langMap = new Map<string, string>();
  for (const lr of languageRows) {
    if (lr.code && lr.name) langMap.set(String(lr.code), String(lr.name));
  }

  // Build a simple array of songs for the digest
  const digestSongs = songList.map((s) => {
    const translations = s.translations ?? [];
    const displayTitle = deriveSongDisplayTitle(translations, { defaultLanguageCode: s.defaultLang ?? null }) || s.slug;

    // pick the first translation as the representative translation
    const rep = translations[0] ?? null;

    // build a 3-line snippet from the lyrics (first 3 non-empty lines)
    let snippet: string | null = null;
    if (rep && rep.lyrics) {
      const lines = String(rep.lyrics).split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean);
      snippet = lines.slice(0, 3).join("\n");
    }

    const langCode = rep?.languageCode ?? s.defaultLang ?? null;
    const langFull = langCode ? (langMap.get(String(langCode)) ?? String(langCode)) : null;

    return {
      title: displayTitle,
      slug: s.slug,
      language: langFull,
      category: s.category ?? null,
      album: null,
      snippet,
    };
  });

  // Send in batches to avoid overwhelming SMTP
  const BATCH_SIZE = Number(process.env.SEND_BATCH_SIZE ?? "50");
  let sent = 0;
  for (let i = 0; i < subscriberRows.length; i += BATCH_SIZE) {
    const batch = subscriberRows.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(batch.map(async (sub) => {
      try {
        const unsubscribeUrl = `${siteUrl.replace(/\/$/, "")}/api/subscribers/unsubscribe?token=${encodeURIComponent(sub.token)}`;
        const email = buildNewSongsDigestEmail({ songs: digestSongs, unsubscribeUrl });
        await sendEmail({ to: sub.email, subject: email.subject, html: email.html, text: email.text, replyTo: process.env.GMAIL_SMTP_USER });
        sent += 1;
      } catch (err) {
        console.error("Failed to send digest to", sub.email, err);
      }
    }));
    // small pause between batches
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`Sent digest to ${sent} subscribers (attempted ${subscriberRows.length}).`);

  // update last-sent marker
  await touchLastSongNotificationTimeDirect();

  console.log("Completed send-song-notifications.");
}

run().catch((err) => {
  console.error("send-song-notifications failed:", err);
  process.exitCode = 1;
});
