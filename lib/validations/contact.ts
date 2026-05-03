import { z } from "zod";
import { containsHeaderInjection } from "@/lib/request-security";

export const CONTACT_REQUEST_TYPES = [
  "Song request",
  "Correction",
  "General feedback",
] as const;

export const CONTACT_NAME_MAX = 40;
export const CONTACT_EMAIL_MAX = 60;
export const CONTACT_MESSAGE_MAX = 1000;

const noLineBreaksMessage = "This field cannot contain line breaks.";

// Disallow ASCII control characters except tab (0x09) and the standard
// newline range (0x0A, 0x0D), plus DEL (0x7F). Used to filter junk that's
// often present in spam (BOMs, bidi overrides, embedded NULs).
function containsControlCharacters(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code === 0x09 || code === 0x0a || code === 0x0d) {
      continue;
    }
    if (code < 0x20 || code === 0x7f) {
      return true;
    }
  }
  return false;
}

export const createContactMessageSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(
      CONTACT_NAME_MAX,
      `Name must be at most ${CONTACT_NAME_MAX} characters`
    )
    .refine((value) => !/\d/.test(value), "Name cannot contain numbers.")
    .refine((value) => !containsHeaderInjection(value), noLineBreaksMessage),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .max(
      CONTACT_EMAIL_MAX,
      `Email must be at most ${CONTACT_EMAIL_MAX} characters`
    )
    .email("Enter a valid email address.")
    .refine((value) => !containsHeaderInjection(value), noLineBreaksMessage),
  type: z.enum(CONTACT_REQUEST_TYPES),
  message: z
    .string()
    .trim()
    .min(1, "Message is required.")
    .max(
      CONTACT_MESSAGE_MAX,
      `Message must be at most ${CONTACT_MESSAGE_MAX} characters.`
    )
    .refine(
      (value) => !containsControlCharacters(value),
      "Message contains unsupported characters."
    ),
  consent: z.boolean().default(true),
  // Honeypot: a hidden field a real user can't see and won't fill in.
  // Any non-empty value is treated as bot traffic.
  website: z.string().max(0, "Spam detected").optional().default(""),
  // Cloudflare Turnstile token from the client widget. Verified server-side
  // before processing the message.
  turnstileToken: z.string().min(1).max(4096).optional(),
});

export type CreateContactMessageInput = z.infer<
  typeof createContactMessageSchema
>;
