export const CACHE_TTL = {
  songs: 300,
  song: 300,
  mostViewed: 300,
  languages: 300,
  categories: 300,
  slugs: 1800,
  search: 60,
  settings: 300,
} as const;

export const CACHE_TAGS = {
  songs: "songs",
  mostViewed: "most-viewed",
  languages: "languages",
  categories: "categories",
  slugs: "slugs",
  search: "search",
  settings: "settings",
} as const;

export function songIdTag(id: number) {
  return `song:id:${id}`;
}

export function songSlugTag(slug: string) {
  return `song:slug:${slug}`;
}
