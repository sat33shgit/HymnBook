import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Allow social crawlers full access so OG previews work.
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
      // Block known AI training crawlers that ignore content licensing.
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "OAI-SearchBot",
          "Claude-Web",
          "ClaudeBot",
          "anthropic-ai",
          "CCBot",
          "Omgilibot",
          "Diffbot",
          "FacebookBot",
          "Google-Extended",
          "cohere-ai",
          "PerplexityBot",
        ],
        disallow: "/",
      },
      // Block aggressive SEO and commercial scrapers.
      {
        userAgent: [
          "AhrefsBot",
          "SemrushBot",
          "MJ12bot",
          "DotBot",
          "BLEXBot",
          "DataForSeoBot",
          "PetalBot",
        ],
        disallow: "/",
      },
      // Default: allow public content, block admin and API routes.
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
