const DEFAULT_SITE_URL = "https://www.singuntothelord.net";

const rawSiteUrl =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || DEFAULT_SITE_URL;

// In production, refuse to boot with an http:// base URL. Loading the site over
// http would defeat HSTS and cause mixed-content issues for any absolute links
// rendered into pages or emails. Localhost http URLs are allowed for dev.
if (
  process.env.NODE_ENV === "production" &&
  rawSiteUrl.startsWith("http://") &&
  !/^http:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(rawSiteUrl)
) {
  throw new Error(
    `NEXT_PUBLIC_BASE_URL must use https:// in production (got "${rawSiteUrl}").`
  );
}

export const siteUrl = rawSiteUrl;

export const siteMetadataBase = new URL(siteUrl);

export const defaultOgImagePath = "/opengraph-image?v=2";

export const publicSiteTitle = "Sing Unto The Lord";
export const publicSiteSubtitle = "Worship songs library";
