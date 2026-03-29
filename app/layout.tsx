import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
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
