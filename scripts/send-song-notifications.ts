import "dotenv/config";
import { DateTime } from "luxon";
import { getLastSongNotificationTime, getSongsAddedSince, getSubscribers, touchLastSongNotificationTime, isSongNotificationsEnabled } from "../lib/db/queries";
import { buildNewSongsDigestEmail } from "../lib/email-templates/new-songs-digest";
import { sendEmail } from "../lib/email";
import { siteUrl } from "../lib/site";

async function run() {
  console.log("Starting send-song-notifications script...");

  const lastSentRaw = await getLastSongNotificationTime();
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
    const enabled = await isSongNotificationsEnabled();
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
  const songs = await getSongsAddedSince(since);

  if (!songs || songs.length === 0) {
    console.log("No new songs to notify.");
    // update last-sent marker so we don't re-run for the same window
    await touchLastSongNotificationTime();
    return;
  }

  console.log(`Found ${songs.length} new song(s). Preparing digest...`);

  const subscribers = await getSubscribers();
  if (!subscribers || subscribers.length === 0) {
    console.log("No subscribers registered. Aborting.");
    // still touch marker to avoid repeating
    await touchLastSongNotificationTime();
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
  await touchLastSongNotificationTime();

  console.log("Completed send-song-notifications.");
}

run().catch((err) => {
  console.error("send-song-notifications failed:", err);
  process.exitCode = 1;
});
