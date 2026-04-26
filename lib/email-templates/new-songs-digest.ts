import { siteUrl } from "@/lib/site";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildNewSongsDigestEmail(input: { songs: { title: string; slug: string; language?: string | null; category?: string | null; album?: string | null }[]; unsubscribeUrl: string; }) {
  const { songs, unsubscribeUrl } = input;
  const safeUnsubscribe = escapeHtml(/^https?:\/\//i.test(unsubscribeUrl) ? unsubscribeUrl : `${siteUrl.replace(/\/$/, "")}${unsubscribeUrl.startsWith("/") ? "" : "/"}${unsubscribeUrl}`);

  const subject = `🎵 ${songs.length} New ${songs.length === 1 ? "Song" : "Songs"} Added`;

  const songsHtml = songs
    .map((s) => {
      const safeTitle = escapeHtml(s.title || s.slug);
      const safeLang = s.language ? escapeHtml(s.language) : null;
      const safeCategory = s.category ? escapeHtml(s.category) : null;
      const songUrl = `${siteUrl.replace(/\/$/, "")}/songs/${encodeURIComponent(s.slug)}`;

      const meta = [
        safeLang ? `<strong>Language:</strong> ${safeLang}` : null,
        safeCategory ? `<strong>Category:</strong> ${safeCategory}` : null,
      ]
        .filter(Boolean)
        .map((m) => `<p style="margin:6px 0;">${m}</p>`)
        .join("");

      return `
        <div style="margin:10px 0; padding:10px 12px; border-radius:6px; background:#fbfbfb;">
          <h3 style="margin:0 0 6px; font-size:16px;">${safeTitle}</h3>
          ${meta}
          <p style="margin:8px 0 0;"><a href="${escapeHtml(songUrl)}" style="display:inline-block; white-space:nowrap; background:#0ea5e9; color:#fff; padding:8px 10px; border-radius:6px; text-decoration:none; font-weight:600; cursor:pointer;">View Song</a></p>
        </div>
      `;
    })
    .join("\n");

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background:#f7fafc; margin:0; padding:12px 8px; color:#0f172a;">
        <div style="max-width:720px; width:100%; margin:0 auto; padding:0 4px;">
          <div style="background:#ffffff; border-radius:8px; overflow:hidden; border:1px solid #e6edf3;">
            <div style="padding:18px 14px;">
              <p style="margin:0 0 12px;">Hi there,</p>
              <p style="margin:0 0 12px; color:#0b1220;">🎶 ${songs.length} new ${songs.length === 1 ? "song has" : "songs have"} been added to your library:</p>

              ${songsHtml}

              <hr style="border:none; border-top:1px solid #eef2f6; margin:18px 0;" />

              <p style="margin:0 0 10px; font-size:13px; color:#6b7280;">You are receiving this email because you subscribed to song updates.</p>
              <p style="margin:0; font-size:13px; color:#6b7280;">🔔 You can <a href="${safeUnsubscribe}" style="text-decoration:underline; color:inherit; cursor:pointer;">unsubscribe</a> anytime if you no longer wish to receive these notifications.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `.trim();

  const textLines: string[] = [];
  textLines.push(`${songs.length} new ${songs.length === 1 ? "song" : "songs"} added:`);
  for (const s of songs) {
    textLines.push(`- ${s.title} (${s.language ?? "-"})`);
    textLines.push(`  ${siteUrl.replace(/\/$/, "")}/songs/${encodeURIComponent(s.slug)}`);
  }
  textLines.push("");
  textLines.push(`To unsubscribe: open the HTML version of this email and click the 'unsubscribe' link, or reply to this message to request removal.`);

  const text = textLines.join("\n");

  return { subject, html, text };
}
