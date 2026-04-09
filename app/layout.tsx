import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/sonner";
import {
  defaultOgImagePath,
  publicSiteTitle,
  siteMetadataBase,
} from "@/lib/site";

const siteDescription =
  "Browse and read Christian song lyrics in multiple languages including English, Telugu, Hindi, Tamil and Malayalam.";
const defaultSiteTitle = `${publicSiteTitle} - Christian Song Lyrics`;

export const metadata: Metadata = {
  metadataBase: siteMetadataBase,
  title: {
    default: defaultSiteTitle,
    template: `%s | ${publicSiteTitle}`,
  },
  description: siteDescription,
  keywords: ["christian songs", "hymns", "lyrics", "worship", "praise"],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: publicSiteTitle,
    title: defaultSiteTitle,
    description: siteDescription,
    images: [
      {
        url: defaultOgImagePath,
        width: 1200,
        height: 630,
        alt: `${publicSiteTitle} preview image`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultSiteTitle,
    description: siteDescription,
    images: [defaultOgImagePath],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster richColors position="bottom-right" />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
