import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/sonner";
import { defaultOgImagePath, siteMetadataBase } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: siteMetadataBase,
  title: {
    default: "HymnBook - Christian Song Lyrics",
    template: "%s | HymnBook",
  },
  description:
    "Browse and read Christian song lyrics in multiple languages including English, Telugu, Hindi, Tamil and Malayalam.",
  keywords: ["christian songs", "hymns", "lyrics", "worship", "praise"],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "HymnBook",
    title: "HymnBook - Christian Song Lyrics",
    description:
      "Browse and read Christian song lyrics in multiple languages including English, Telugu, Hindi, Tamil and Malayalam.",
    images: [
      {
        url: defaultOgImagePath,
        width: 1200,
        height: 630,
        alt: "HymnBook preview image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HymnBook - Christian Song Lyrics",
    description:
      "Browse and read Christian song lyrics in multiple languages including English, Telugu, Hindi, Tamil and Malayalam.",
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
        <Analytics debug={false} />
      </body>
    </html>
  );
}
