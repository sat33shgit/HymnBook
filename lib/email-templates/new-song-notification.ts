import { siteUrl } from "@/lib/site";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildNewSongNotificationEmail(input: { title: string; slug: string; unsubscribeUrl: string }) {
  const { title, slug, unsubscribeUrl } = input;
  const songUrl = `${siteUrl.replace(/\/$/, "")}/songs/${encodeURIComponent(slug)}`;
  const subject = `New song added: ${title}`;
  const unsubscribeFull = /^https?:\/\//i.test(unsubscribeUrl)
    ? unsubscribeUrl
    : `${siteUrl.replace(/\/$/, "")}${unsubscribeUrl.startsWith("/") ? "" : "/"}${unsubscribeUrl}`;

  const html = `
    <!doctype html>
    <html>
      <body style="font-family: Arial, Helvetica, sans-serif; background:#f7fafc; margin:0; padding:12px 8px;">
        <div style="max-width:720px; width:100%; margin:0 auto; padding:0 4px;">
          <div style="background:#fff; padding:16px; border-radius:8px;">
          <h1 style="margin-top:0;">New song added</h1>
          <p style="font-size:18px; margin:8px 0 16px;">${escapeHtml(title)}</p>
          <p>View the song here: <a href="${escapeHtml(songUrl)}" style="text-decoration:underline; color:inherit; cursor:pointer;">View song</a></p>
          <p style="margin-top:18px;">If you do not want to receive these notifications, you can <a href="${escapeHtml(unsubscribeFull)}" style="text-decoration:underline; color:inherit; cursor:pointer;">unsubscribe</a>.</p>
          <p style="color:#666; font-size:13px; margin-top:20px;">Sent from <a href="${escapeHtml(siteUrl)}">${escapeHtml(siteUrl)}</a></p>
        </div>
      </body>
    </html>
  `.trim();

  const text = [
    `New song added: ${title}`,
    `View: ${songUrl}`,
    "",
    "To unsubscribe: open the HTML version of this email and click the 'unsubscribe' link, or reply to this message to request removal.",
  ].join("\n");

  return { subject, html, text };
}
