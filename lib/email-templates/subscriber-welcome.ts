import { siteUrl } from "@/lib/site";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildSubscriberWelcomeEmail(input: { email: string; unsubscribeUrl: string }) {
  const { email, unsubscribeUrl } = input;
  const unsubscribeFull = /^https?:\/\//i.test(unsubscribeUrl)
    ? unsubscribeUrl
    : `${siteUrl.replace(/\/$/, "")}${unsubscribeUrl.startsWith("/") ? "" : "/"}${unsubscribeUrl}`;
  const safeUnsubscribe = escapeHtml(unsubscribeFull);
  const safeSite = escapeHtml(siteUrl.replace(/\/$/, ""));

  const subject = `Welcome to "Sing Unto The Lord" 🎵`;

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
            <div style="padding:14px 12px;">
              <div style="text-align:center; margin-bottom:20px;">
                <img src="cid:emailHeader" alt="Sing Unto The Lord" width="600" style="width:100%; max-width:600px; height:auto; display:block; margin:0 auto;" />
              </div>
              <hr style="border:none; border-top:2px solid #1a1a1a; margin:0 0 16px;" />
              <p style="margin:0 0 12px;">Hello,</p>
              <h1 style="margin:0 0 12px; font-size:20px;">Thank you for subscribing. You're now part of <em>Sing Unto The Lord</em> 🙏</h1>

              <p style="margin:12px 0 18px;">You’ll now receive updates about:</p>
              <ul style="margin:0 0 16px 20px; padding:0; color:#0b1220;">
                <li>New songs added to our library</li>
              </ul>

              <p style="margin:0 0 18px;">We’re glad to have you as part of this growing worship community.</p>

              <hr style="border:none; border-top:1px solid #eef2f6; margin:18px 0;" />

              <h3 style="margin:0 0 10px; font-size:16px;">🎵 What you can do next</h3>
              <ul style="margin:8px 0 16px 20px; padding:0; color:#0b1220;">
                <li>Explore songs in your preferred language</li>
                <li>Save your favorite songs</li>
                <li>Request new songs anytime</li>
              </ul>

              <p style="margin:0 0 18px;">👉 Visit the library: <a href="${safeSite}" style="display:inline-block; white-space:nowrap; background:#0ea5e9; color:#fff; padding:8px 10px; border-radius:6px; text-decoration:none; font-weight:600; cursor:pointer;">Explore Songs</a></p>

              <p style="margin:16px 0 0;">If you have any suggestions or song requests, please reach out through the <a href="${safeSite}/contact" style="text-decoration:underline; color:inherit; cursor:pointer;">contact form</a> in the application — we’d love to hear from you.</p>

              <p style="margin:12px 0 0;">May your worship be filled with joy and peace.</p>

              <p style="margin:12px 0 0;">God bless you,<br/><strong>Sing Unto The Lord Team</strong></p>
            </div>

            <div style="padding:14px 18px; background:#fbfbfb; font-size:13px; color:#6b7280;">
              <p style="margin:0;">This email is automatically generated, please do not reply. If you no longer wish to receive these emails, you can <a href="${safeUnsubscribe}" style="text-decoration:underline; color:inherit; cursor:pointer;">unsubscribe</a> anytime.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `.trim();

  const text = [
    `Hi ${email},`,
    "",
    "Welcome to Sing Unto The Lord 🎵",
    "",
    "You’ll now receive updates about:",
    "- New songs added to our library",
    "- Song corrections and improvements",
    "- New languages and collections",
    "- Special updates and features",
    "",
    "What you can do next:",
    "- Explore songs in your preferred language",
    "- Save your favorite hymns",
    "- Request new songs anytime",
    "",
    `Visit the library: ${siteUrl.replace(/\/$/, "")}/songs`,
    "",
    `If you have any suggestions or song requests, please use the contact form: ${siteUrl.replace(/\/$/, "")}/contact — we'd love to hear from you.`,
    "",
    "May your worship be filled with joy and peace.",
    "",
    "God bless you,",
    "Sing Unto The Lord Team",
    "",
    "To unsubscribe: open the HTML version of this email and click the 'unsubscribe' link, or reply to this message to request removal.",
  ].join("\n");

  return { subject, html, text };
}
