const DEFAULT_SITE_URL = "https://www.singuntothelord.net";

export const siteUrl =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || DEFAULT_SITE_URL;

export const siteMetadataBase = new URL(siteUrl);

export const defaultOgImagePath = "/opengraph-image?v=2";

export const publicSiteTitle = "Sing Unto The Lord";
export const publicSiteSubtitle = "Worship songs library";
