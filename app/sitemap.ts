import type { MetadataRoute } from "next";
import { getAllSlugs } from "@/lib/db/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yourdomain.com";

  let songEntries: MetadataRoute.Sitemap = [];
  try {
    const slugs = await getAllSlugs();
    songEntries = slugs.map((s) => ({
      url: `${baseUrl}/songs/${s.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // DB not available at build time
  }

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/favorites`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
    },
    ...songEntries,
  ];
}
