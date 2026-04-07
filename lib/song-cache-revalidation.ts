import { revalidatePath, revalidateTag } from "next/cache";
import { CACHE_TAGS, songIdTag, songSlugTag } from "@/lib/cache";

type SongCacheTarget = {
  id?: number | null;
  slug?: string | null;
};

export function revalidateSongMutationCaches(
  target: SongCacheTarget,
  paths: string[] = []
) {
  const tags = new Set<string>([
    CACHE_TAGS.songs,
    CACHE_TAGS.mostViewed,
    CACHE_TAGS.categories,
    CACHE_TAGS.slugs,
    CACHE_TAGS.search,
  ]);

  if (typeof target.id === "number") {
    tags.add(songIdTag(target.id));
  }

  if (target.slug?.trim()) {
    tags.add(songSlugTag(target.slug));
  }

  for (const tag of tags) {
    try {
      revalidateTag(tag, "max");
    } catch (error) {
      console.error(`Failed to revalidate cache tag "${tag}":`, error);
    }
  }

  for (const path of paths) {
    try {
      revalidatePath(path);
    } catch (error) {
      console.error(`Failed to revalidate path "${path}":`, error);
    }
  }
}
