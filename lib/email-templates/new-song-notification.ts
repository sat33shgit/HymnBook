import { siteUrl } from "@/lib/site";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildNewSongNotificationEmail(input: { title: string; slug: string; unsubscribeUrl: string; language?: string; category?: string; album?: string }) {
  const { title, slug, unsubscribeUrl, language, category, album } = input;
  const songUrl = `${siteUrl.replace(/\/$/, "")}/songs/${encodeURIComponent(slug)}`;
  const subject = `🎵 New Song Added — ${title}`;
  const unsubscribeFull = /^https?:\/\//i.test(unsubscribeUrl)
    ? unsubscribeUrl
    : `${siteUrl.replace(/\/$/, "")}${unsubscribeUrl.startsWith("/") ? "" : "/"}${unsubscribeUrl}`;

  const safeLanguage = language && language.trim() ? escapeHtml(language) : null;
  const safeCategory = category && category.trim() ? escapeHtml(category) : null;
  const safeAlbum = album && album.trim() ? escapeHtml(album) : null;

  const metadataHtml = (safeLanguage || safeCategory || safeAlbum)
    ? `<div style="margin:8px 0 12px; color:#0b1220;">
                ${safeLanguage ? `<p style="margin:6px 0;"><strong>Language:</strong> ${safeLanguage}</p>` : ""}
                ${safeCategory ? `<p style="margin:6px 0;"><strong>Category:</strong> ${safeCategory}</p>` : ""}
                ${safeAlbum ? `<p style="margin:6px 0;"><strong>Album/Type:</strong> ${safeAlbum}</p>` : ""}
              </div>`
    : "";

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
              <div style="text-align:center; margin-bottom:20px;">
                <img src="cid:emailHeader" alt="Sing Unto The Lord" width="600" style="width:100%; max-width:600px; height:auto; display:block; margin:0 auto;" />
              </div>
              <hr style="border:none; border-top:2px solid #1a1a1a; margin:0 0 16px;" />

              <p style="margin:0 0 12px;">Dear Friend,</p>
              <p style="margin:0 0 12px; color:#0b1220;">🎶 A new song has been added to the library:</p>

              <hr style="border:none; border-top:1px solid #eef2f6; margin:12px 0;" />

              <h2 style="margin:8px 0 8px; font-size:20px;">${escapeHtml(title)}</h2>

              ${metadataHtml}

              <hr style="border:none; border-top:1px solid #eef2f6; margin:12px 0;" />

              <p style="margin:12px 0 18px;">Experience and sing along with this new addition to the collection.</p>

              <p style="margin:0 0 18px;">👉 <a href="${escapeHtml(songUrl)}" style="display:inline-block; white-space:nowrap; background:#0ea5e9; color:#fff; padding:8px 12px; border-radius:6px; text-decoration:none; font-weight:600; cursor:pointer;">View Song</a></p>

              <hr style="border:none; border-top:1px solid #eef2f6; margin:18px 0;" />

              <p style="margin:0 0 10px;">If you have any suggestions or would like to request a song, feel free to reach out through the <a href="${escapeHtml(siteUrl.replace(/\/$/, ""))}/contact" style="text-decoration:underline; color:inherit; cursor:pointer;">contact form</a> in the application—we'd love to hear from you.</p>

              <hr style="border:none; border-top:1px solid #eef2f6; margin:18px 0;" />

              <p style="margin:0 0 6px; font-size:13px; color:#6b7280;">You are receiving this email because you subscribed to song updates.</p>
              <p style="margin:0; font-size:13px; color:#6b7280;">🔔 You can <a href="${escapeHtml(unsubscribeFull)}" style="text-decoration:underline; color:inherit; cursor:pointer;">unsubscribe</a> anytime if you no longer wish to receive these notifications.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `.trim();

  const textLines: string[] = [];
  textLines.push(`New song added: ${title}`);
  if (language && language.trim()) textLines.push(`Language: ${language}`);
  if (category && category.trim()) textLines.push(`Category: ${category}`);
  if (album && album.trim()) textLines.push(`Album/Type: ${album}`);
  textLines.push("");
  textLines.push(`View: ${songUrl}`);
  textLines.push("");
  textLines.push(`If you have any suggestions or would like to request a song, please use the contact form: ${siteUrl.replace(/\/$/, "")}/contact`);
  textLines.push("");
  textLines.push("To unsubscribe: open the HTML version of this email and click the 'unsubscribe' link, or reply to this message to request removal.");

  const text = textLines.join("\n");

  return { subject, html, text };
}
