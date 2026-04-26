import "dotenv/config";
import { DateTime } from "luxon";
import { db } from "../lib/db/index";
import { songs, songTranslations, subscribers, appSettings } from "../lib/db/schema";
import { eq, and, gt, asc, desc, inArray } from "drizzle-orm";
import { buildNewSongsDigestEmail } from "../lib/email-templates/new-songs-digest";
import { sendEmail } from "../lib/email";
import { siteUrl } from "../lib/site";

async function run() {
  console.log("Starting send-song-notifications script...");

  // Direct DB queries (avoid server-only unstable_cache wrappers)
  async function isSongNotificationsEnabledDirect() {
    try {
      const rows = await db
        .select({ boolValue: appSettings.boolValue })
        .from(appSettings)
        .where(eq(appSettings.key, "song_notifications_enabled"))
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

  async function getLastSongNotificationTimeDirect() {
    const rows = await db
      .select({ updatedAt: appSettings.updatedAt })
      .from(appSettings)
      .where(eq(appSettings.key, "last_song_notifications"))
      .limit(1);

    return rows[0]?.updatedAt ?? null;
  }

  async function touchLastSongNotificationTimeDirect() {
    await db
      .insert(appSettings)
      .values({ key: "last_song_notifications", boolValue: true, updatedAt: new Date() })
      .onConflictDoUpdate({ target: appSettings.key, set: { updatedAt: new Date(), boolValue: true } });
  }

  async function getSubscribersDirect() {
    return db.select().from(subscribers).orderBy(desc(subscribers.createdAt));
  }

  async function getSongsAddedSinceDirect(since: Date) {
    const songRows = await db
      .select()
      .from(songs)
      .where(and(eq(songs.isPublished, true), gt(songs.createdAt, since)))
      .orderBy(asc(songs.createdAt));

    if (songRows.length === 0) return [];

    const songIds = songRows.map((s) => s.id);

    const translations = await db
      .select({ songId: songTranslations.songId, languageCode: songTranslations.languageCode, title: songTranslations.title, audioUrl: songTranslations.audioUrl, youtubeUrl: songTranslations.youtubeUrl })
      .from(songTranslations)
      .where(inArray(songTranslations.songId, songIds))
      .orderBy(asc(songTranslations.languageCode));

    const translationsBySongId = new Map<number, any[]>();
    for (const t of translations) {
      const arr = translationsBySongId.get(t.songId) ?? [];
      arr.push({ languageCode: t.languageCode, title: t.title, audioUrl: t.audioUrl, youtubeUrl: t.youtubeUrl });
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

  let since: Date;
  if (lastSent) {
    since = lastSent;
  } else {
    // If we've never sent, compute the previous day's scheduled time in the configured timezone
    const nowTz = DateTime.now().setZone(TZ);
    let scheduledToday = nowTz.set({ hour: HOUR, minute: MINUTE, second: 0, millisecond: 0 });
    if (nowTz < scheduledToday) {
      scheduledToday = scheduledToday.minus({ days: 1 });
    }
    const prevRun = scheduledToday.minus({ days: 1 });
    since = prevRun.toUTC().toJSDate();
  }

  console.log("Fetching songs added since:", since.toISOString());
  const songs = await getSongsAddedSinceDirect(since);

  if (!songs || songs.length === 0) {
    console.log("No new songs to notify.");
    // update last-sent marker so we don't re-run for the same window
    await touchLastSongNotificationTime();
    return;
  }

  console.log(`Found ${songs.length} new song(s). Preparing digest...`);

  const subscribers = await getSubscribersDirect();
  if (!subscribers || subscribers.length === 0) {
    console.log("No subscribers registered. Aborting.");
    // still touch marker to avoid repeating
    await touchLastSongNotificationTimeDirect();
    return;
  }

  // Build a simple array of songs for the digest
  const digestSongs = songs.map((s) => ({ title: s.title, slug: s.slug, language: s.translations?.[0]?.languageCode ?? null, category: s.category ?? null, album: null }));

  // Send in batches to avoid overwhelming SMTP
  const BATCH_SIZE = Number(process.env.SEND_BATCH_SIZE ?? "50");
  let sent = 0;
  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const batch = subscribers.slice(i, i + BATCH_SIZE);
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

  console.log(`Sent digest to ${sent} subscribers (attempted ${subscribers.length}).`);

  // update last-sent marker
  await touchLastSongNotificationTimeDirect();

  console.log("Completed send-song-notifications.");
}

run().catch((err) => {
  console.error("send-song-notifications failed:", err);
  process.exitCode = 1;
});
