import { getSongs } from "@/lib/db/queries";
import { AdminSongsClient } from "./AdminSongsClient";

export const dynamic = "force-dynamic";

export default async function AdminSongsPage() {
  const result = await getSongs({ publishedOnly: false, limit: 100 });

  return <AdminSongsClient songs={result.data} totalSongs={result.total} />;
}
