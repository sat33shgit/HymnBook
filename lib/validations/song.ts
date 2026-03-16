import { z } from "zod";

export const translationSchema = z.object({
  languageCode: z.string().min(2).max(10),
  title: z.string().min(1, "Title is required"),
  lyrics: z.string().min(1, "Lyrics are required"),
  englishMeaning: z.string().optional(),
});

export const createSongSchema = z.object({
  title: z.string().min(1, "English title is required"),
  defaultLang: z.string().min(2).max(10).optional(),
  category: z.string().optional(),
  isPublished: z.boolean().optional().default(true),
  translations: z
    .array(translationSchema)
    .min(1, "At least one translation is required"),
});

export const updateSongSchema = z.object({
  title: z.string().min(1, "English title is required").optional(),
  slug: z.string().optional(),
  defaultLang: z.string().min(2).max(10).optional(),
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
  q: z.string().min(1, "Search query is required").max(200),
  lang: z.string().optional(),
});

export const favoriteSchema = z.object({
  userId: z.string().min(1),
  songId: z.number().int().positive(),
});

export const syncFavoritesSchema = z.object({
  userId: z.string().min(1),
  songIds: z.array(z.number().int().positive()),
});

export type CreateSongInput = z.infer<typeof createSongSchema>;
export type UpdateSongInput = z.infer<typeof updateSongSchema>;
export type CreateLanguageInput = z.infer<typeof createLanguageSchema>;
export type UpdateLanguageInput = z.infer<typeof updateLanguageSchema>;
