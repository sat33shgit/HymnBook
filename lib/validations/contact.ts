import { z } from "zod";

export const CONTACT_REQUEST_TYPES = [
  "Song request",
  "Correction",
  "General feedback",
] as const;

export const CONTACT_NAME_MAX = 40;
export const CONTACT_EMAIL_MAX = 60;
export const CONTACT_MESSAGE_MAX = 1000;

export const createContactMessageSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(CONTACT_NAME_MAX, `Name must be at most ${CONTACT_NAME_MAX} characters`)
    .refine((value) => !/\d/.test(value), "Name cannot contain numbers."),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .max(CONTACT_EMAIL_MAX, `Email must be at most ${CONTACT_EMAIL_MAX} characters`)
    .email("Enter a valid email address."),
  type: z.enum(CONTACT_REQUEST_TYPES),
  message: z
    .string()
    .trim()
    .min(1, "Message is required.")
    .max(
      CONTACT_MESSAGE_MAX,
      `Message must be at most ${CONTACT_MESSAGE_MAX} characters.`
    ),
  consent: z.boolean().default(true),
});

export type CreateContactMessageInput = z.infer<
  typeof createContactMessageSchema
>;
