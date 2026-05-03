import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Allow social crawlers full access so OG previews work
      {
        userAgent: [
          "facebookexternalhit",
          "Twitterbot",
          "WhatsApp",
          "LinkedInBot",
          "Slackbot",
          "TelegramBot",
        ],
        allow: "/",
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
