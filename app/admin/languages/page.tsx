import { getLanguages } from "@/lib/db/queries";
import { LanguagesClient } from "./LanguagesClient";

export const dynamic = "force-dynamic";

export default async function AdminLanguagesPage() {
  const languages = await getLanguages();
  return <LanguagesClient initialLanguages={languages} />;
}
