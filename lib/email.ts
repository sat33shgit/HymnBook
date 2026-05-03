import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import { readFile } from "fs/promises";
import { join } from "path";

let transporter: nodemailer.Transporter | null = null;

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required email configuration: ${name}`);
  }
  return value;
}

function createEmailTransport() {
  if (transporter) {
    return transporter;
  }

  const user = getRequiredEnv("GMAIL_SMTP_USER");
  const pass = getRequiredEnv("GMAIL_SMTP_APP_PASSWORD");

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });

  return transporter;
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  attachments?: Mail.Attachment[];
}) {
  const user = getRequiredEnv("GMAIL_SMTP_USER");
  const fromName =
    process.env.CONTACT_EMAIL_FROM_NAME?.trim() || "HymnBook";
  const fromAddress =
    process.env.CONTACT_EMAIL_FROM_ADDRESS?.trim() || user;

  const transporter = createEmailTransport();

  await transporter.sendMail({
    from: `"${fromName}" <${fromAddress}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
    replyTo: options.replyTo,
    attachments: options.attachments,
  });
}

export async function getEmailHeaderAttachment(isDark = false): Promise<Mail.Attachment> {
  const filename = isDark ? "email-header-dark.png" : "email-header.png";
  const cid = isDark ? "emailHeaderDark" : "emailHeader";
  const filePath = join(process.cwd(), "public", filename);
  
  const imageData = await readFile(filePath);
  
  return {
    filename,
    content: imageData,
    cid,
    contentDisposition: "inline",
  };
}
