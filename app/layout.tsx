import type { Metadata } from "next";
import { Cinzel_Decorative } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/sonner";
import {
  defaultOgImagePath,
  publicSiteTitle,
  siteMetadataBase,
} from "@/lib/site";

const cinzelDecorative = Cinzel_Decorative({
  weight: "900",
  subsets: ["latin"],
  variable: "--font-cinzel-src",
  display: "swap",
});

const siteDescription =
  "Browse and read Christian song lyrics in English, Telugu, Hindi, Tamil, Malayalam, and more.";
const defaultSiteTitle = `${publicSiteTitle} | Christian Songs Library`;

export const metadata: Metadata = {
  metadataBase: siteMetadataBase,
  title: {
    default: defaultSiteTitle,
    template: `%s | ${publicSiteTitle}`,
  },
  description: siteDescription,
  keywords: ["christian songs", "hymns", "lyrics", "worship", "praise"],
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
    apple: "/logo.jpg",
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
      <body className={`font-sans antialiased ${cinzelDecorative.variable}`} suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster richColors position="bottom-right" />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
