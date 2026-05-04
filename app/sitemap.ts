import type { MetadataRoute } from "next";
import { getAllSlugsWithDates, isPublicContactVisible } from "@/lib/db/queries";
import { siteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  let songEntries: MetadataRoute.Sitemap = [];
  let contactVisible = false;

  try {
    const [slugs, contactIsVisible] = await Promise.all([
      getAllSlugsWithDates(),
      isPublicContactVisible(),
    ]);
    contactVisible = contactIsVisible;
    songEntries = slugs.map((s) => ({
      url: `${siteUrl}/songs/${s.slug}`,
      lastModified: s.updatedAt ?? now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // DB not available at build time
  }

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/search`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/languages`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  if (contactVisible) {
    staticEntries.push({
      url: `${siteUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }

  return [...staticEntries, ...songEntries];
}
