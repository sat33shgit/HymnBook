import { notFound } from "next/navigation";
import ContactPage from "../contact";
import { isPublicContactVisible } from "@/lib/db/queries";
import type { Metadata } from "next";
import { publicSiteTitle } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Us",
  description: `Get in touch with the ${publicSiteTitle} team. Request new songs, suggest corrections, share feedback, or subscribe to updates about new additions to our Christian song library.`,
  keywords: [
    "contact christian song library",
    "request christian song",
    "suggest hymn correction",
    "christian song feedback",
  ],
  alternates: { canonical: "/contact" },
};

export default async function ContactPageRoute() {
  const contactVisible = await isPublicContactVisible();

  if (!contactVisible) {
    notFound();
  }

  return <ContactPage />;
}
