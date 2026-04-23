import { getContactMessages } from "@/lib/db/queries";
import { AdminMessagesClient } from "./AdminMessagesClient";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const messages = await getContactMessages();

  return <AdminMessagesClient initialMessages={messages} />;
}
