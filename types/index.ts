export interface Language {
  code: string;
  name: string;
  nativeName: string;
  fontStack: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
}

export interface Song {
  id: number;
  slug: string;
  category: string | null;
  defaultLang: string;
  viewCount: number | null;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SongTranslation {
  id: number;
  songId: number;
  languageCode: string;
  title: string;
  lyrics: string;
  searchVector?: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface SongWithTranslations extends Song {
  translations: SongTranslation[];
}

export interface SongListItem {
  id: number;
  slug: string;
  category: string | null;
  defaultLang: string | null;
  viewCount: number | null;
  isPublished: boolean | null;
  title: string;
  languages: string[];
}

export type FontSize = "S" | "M" | "L" | "XL";

export const FONT_SIZE_MAP: Record<FontSize, number> = {
  S: 16,
  M: 20,
  L: 24,
  XL: 30,
};
