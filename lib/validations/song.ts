import { z } from "zod";

export const translationSchema = z.object({
  languageCode: z.string().min(2).max(10),
  title: z.string().min(1, "Title is required"),
  lyrics: z.string().min(1, "Lyrics are required"),
  englishMeaning: z.string().optional(),
  audioUrl: z.string().url().nullable().optional(),
  youtubeUrl: z.string().url().nullable().optional(),
});

export const createSongSchema = z.object({
  category: z.string().optional(),
  isPublished: z.boolean().optional().default(true),
  translations: z
    .array(translationSchema)
    .min(1, "At least one translation is required"),
});

export const updateSongSchema = z.object({
  category: z.string().nullable().optional(),
  isPublished: z.boolean().optional(),
  translations: z
    .array(translationSchema)
    .min(1)
    .optional(),
});

export const createLanguageSchema = z.object({
  code: z
    .string()
    .min(2, "Language code must be at least 2 characters")
    .max(10, "Language code must be at most 10 characters")
    .regex(/^[a-z]{2,10}$/, "Language code must be lowercase letters only"),
  name: z.string().min(1, "Name is required").max(50),
  nativeName: z.string().min(1, "Native name is required").max(50),
  fontStack: z.string().optional(),
  sortOrder: z.number().int().min(0).optional().default(0),
});

export const updateLanguageSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  nativeName: z.string().min(1).max(50).optional(),
  fontStack: z.string().nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const searchSchema = z.object({
  q: z.string().trim().min(1, "Search query is required").max(200),
  // Same shape as a language code in createLanguageSchema. Restricting the
  // character set means a malicious value can't break the SQL search by
  // shape (Drizzle parameterizes anyway, so this is defense-in-depth).
  lang: z
    .string()
    .trim()
    .regex(/^[a-z]{2,10}$/, "Invalid language code")
    .optional(),
  // Server-side only honors this when the caller is authenticated; a public
  // caller passing it is silently ignored. We accept "1" / "true" so the
  // existing admin client keeps working.
  includeUnpublished: z
    .union([z.literal("1"), z.literal("true"), z.literal("0"), z.literal("false")])
    .optional(),
});

export const songsListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(15),
  category: z.string().trim().min(1).max(50).optional(),
  language: z
    .string()
    .trim()
    .regex(/^[a-z]{2,10}$/, "Invalid language code")
    .optional(),
});

export const favoriteSchema = z.object({
  // Enforce UUID format so arbitrary strings can't be used as userId values.
  userId: z.string().uuid("userId must be a valid UUID"),
  songId: z.number().int().positive(),
});

export const syncFavoritesSchema = z.object({
  // Enforce UUID format so arbitrary strings can't be used as userId values.
  userId: z.string().uuid("userId must be a valid UUID"),
  // Cap the array so a single sync request can't flood the DB with rows.
  songIds: z.array(z.number().int().positive()).max(500, "Too many song IDs"),
});

export type CreateSongInput = z.infer<typeof createSongSchema>;
export type UpdateSongInput = z.infer<typeof updateSongSchema>;
export type CreateLanguageInput = z.infer<typeof createLanguageSchema>;
export type UpdateLanguageInput = z.infer<typeof updateLanguageSchema>;
