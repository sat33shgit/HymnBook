import type { CreateContactMessageInput } from "@/lib/validations/contact";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatConsent(consent: boolean) {
  return consent ? "Yes" : "No";
}

function formatSubmittedAt(submittedAt: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(submittedAt);
}

export function buildContactConfirmationEmail(input: {
  form: CreateContactMessageInput;
  submittedAt: Date;
}) {
  const { form, submittedAt } = input;
  const submittedLabel = formatSubmittedAt(submittedAt);

  const subject = `Sing unto the Lord! We received your message - ${form.type}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Email</title>
    </head>
    <body style="margin:0; padding:0; background-color:#f4f6f7; font-family:Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f6f7;">
        <tr>
          <td align="center">
            <table width="760" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff; border-radius:10px; overflow:hidden;">
              <tr>
                <td bgcolor="#1f6f52" style="padding:34px 32px 30px; background-color:#1f6f52; color:#ffffff;">
                  <p style="margin:0 0 18px; font-size:14px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase;">
                    SING UNTO THE LORD!
                  </p>
                  <h1 style="margin:0 0 18px; font-size:30px; line-height:1.2; font-weight:700; color:#ffffff;">
                    Your message has been received
                  </h1>
                  <p style="margin:0; font-size:14px; line-height:1.8; color:#f2f7f5;">
                    Hello ${escapeHtml(
                      form.name
                    )}, thank you for contacting us. This email confirms that we received your request and shared it with our team.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:30px 30px 42px; color:#333333;">
                  <p style="margin:0 0 16px; font-size:14px; line-height:1.7;">
                    A summary of your submission is below for your reference.
                  </p>
                  <table width="100%" cellpadding="10" cellspacing="0" style="border-collapse:collapse; font-size:14px;">
                    <tr style="background:#f1f3f4;">
                      <td style="width:180px; white-space:nowrap;"><strong>Name</strong></td>
                      <td>${escapeHtml(form.name)}</td>
                    </tr>
                    <tr>
                      <td style="width:180px; white-space:nowrap;"><strong>Email</strong></td>
                      <td>${escapeHtml(form.email)}</td>
                    </tr>
                    <tr style="background:#f1f3f4;">
                      <td style="width:180px; white-space:nowrap;"><strong>Request type</strong></td>
                      <td>${escapeHtml(form.type)}</td>
                    </tr>
                    <tr>
                      <td style="width:180px; white-space:nowrap;"><strong>Consent to contact</strong></td>
                      <td>${escapeHtml(formatConsent(form.consent))}</td>
                    </tr>
                    <tr style="background:#f1f3f4;">
                      <td style="width:180px; white-space:nowrap;"><strong>Submitted at</strong></td>
                      <td>${escapeHtml(submittedLabel)}</td>
                    </tr>
                    <tr>
                      <td style="width:180px; white-space:nowrap;"><strong>Message</strong></td>
                      <td style="white-space:pre-wrap;">${escapeHtml(
                        form.message
                      )}</td>
                    </tr>
                  </table>
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:22px;">
                    <tr>
                      <td style="padding:18px 20px; background:#effaf3; border:1px solid #cde9d5; border-radius:16px; font-size:14px; line-height:1.7; color:#234338;">
                        We usually respond within a few days. If you need to add more details, reply to this email and include the same email address used in the form.
                      </td>
                    </tr>
                  </table>
                  <p style="margin:24px 0 0; font-size:13px; line-height:1.7; color:#5b746b;">
                    This is an automated confirmation from Sing unto the Lord.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `.trim();

  const text = [
    "HymnBook",
    "",
    `Hello ${form.name},`,
    "",
    "We received your message. Here is a copy of your submission:",
    "",
    `Name: ${form.name}`,
    `Email: ${form.email}`,
    `Request type: ${form.type}`,
    `Consent to contact: ${formatConsent(form.consent)}`,
    `Submitted at: ${submittedLabel}`,
    "",
    "Message:",
    form.message,
    "",
    "We usually respond within a few days.",
    "",
    "Sing unto the Lord!",
  ].join("\n");

  return { subject, html, text };
}
