import { notFound } from "next/navigation";
import ContactPage from "../contact";
import { isPublicContactVisible } from "@/lib/db/queries";

export default async function ContactPageRoute() {
  const contactVisible = await isPublicContactVisible();

  if (!contactVisible) {
    notFound();
  }

  return <ContactPage />;
}
