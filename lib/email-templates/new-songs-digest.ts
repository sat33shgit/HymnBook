import { siteUrl } from "@/lib/site";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildNewSongsDigestEmail(input: { songs: { title: string; slug: string; language?: string | null; category?: string | null; album?: string | null; snippet?: string | null }[]; unsubscribeUrl: string; }) {
  const { songs, unsubscribeUrl } = input;
  const safeUnsubscribe = escapeHtml(/^https?:\/\//i.test(unsubscribeUrl) ? unsubscribeUrl : `${siteUrl.replace(/\/$/, "")}${unsubscribeUrl.startsWith("/") ? "" : "/"}${unsubscribeUrl}`);

  const subject = songs.length === 1
    ? `${songs.length} new song has been added to the library`
    : `${songs.length} new songs have been added to the library`;

  const songsHtml = songs
    .map((s) => {
      const safeTitle = escapeHtml(s.title || s.slug);
      const safeLang = s.language ? escapeHtml(s.language) : null;
      const safeCategory = s.category ? escapeHtml(s.category) : null;
      const safeSnippet = s.snippet ? escapeHtml(String(s.snippet)) : null;
      const songUrl = `${siteUrl.replace(/\/$/, "")}/songs/${encodeURIComponent(s.slug)}`;

      const langPill = safeLang ? `<span style="display:inline-block; margin-right:8px; padding:2px 8px; font-size:12px; border-radius:6px; background:#eef2ff; color:#0b3a8a;">[${safeLang}]</span>` : "";
      const categoryPill = safeCategory ? `<span style="display:inline-block; margin-right:8px; padding:2px 8px; font-size:12px; border-radius:6px; background:#f0fdf4; color:#065f46;">[${safeCategory}]</span>` : "";

      return `
        <div style="padding:18px 0; border-bottom:1px solid #eef2f6;">
          <h2 style="margin:0 0 8px; font-size:18px; color:#071033;">🎵 ${safeTitle}</h2>
          <div style="margin:0 0 10px;">${langPill}${categoryPill}</div>
          ${safeSnippet ? `<p style="margin:0 0 12px; font-style:italic; color:#0b1220;">${safeSnippet}</p>` : ""}
          <p style="margin:0;"><a href="${escapeHtml(songUrl)}" style="display:inline-block; white-space:nowrap; background:#0ea5e9; color:#fff; padding:10px 12px; border-radius:8px; text-decoration:none; font-weight:600;">👉 View Song</a></p>
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
              <p style="margin:0 0 12px; color:#0b1220; font-size:20px;">${songs.length} new ${songs.length === 1 ? "song has" : "songs have"} been added to your library</p>
              <p style="margin:8px 0 18px; color:#475569;">Explore the latest additions below:</p>

              ${songsHtml}

              <div style="padding-top:14px;">
                <p style="margin:0 0 10px; font-size:13px; color:#6b7280;">You are receiving this email because you subscribed to song updates.</p>
                <p style="margin:0; font-size:13px; color:#6b7280; display:flex; align-items:center; gap:8px;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2z" fill="#6b7280"/><path d="M18 16v-5c0-3.07-1.63-5.64-4.5-6.32V4a1.5 1.5 0 10-3 0v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" stroke="#6b7280" stroke-width="0.5" fill="none"/><path d="M20 4L4 20" stroke="#6b7280" stroke-width="1.2"/></svg>
                  <span>To unsubscribe, <a href="${safeUnsubscribe}" style="text-decoration:underline; color:inherit;">click here</a>.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `.trim();

  const textLines: string[] = [];
  textLines.push(`${songs.length} new ${songs.length === 1 ? "song has" : "songs have"} been added to the library`);
  textLines.push("");
  for (const s of songs) {
    textLines.push(`- ${s.title} ${s.language ? `[${s.language}]` : ""}`);
    if (s.snippet) textLines.push(`  "${s.snippet.replace(/\n/g, ' ')}"`);
    textLines.push(`  ${siteUrl.replace(/\/$/, "")}/songs/${encodeURIComponent(s.slug)}`);
    textLines.push("");
  }
  textLines.push(`To unsubscribe: ${safeUnsubscribe}`);

  const text = textLines.join("\n");

  return { subject, html, text };
}
