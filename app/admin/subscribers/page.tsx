import { getSubscribersCount } from "@/lib/db/queries";
import { SubscribersListClient } from "@/components/admin/SubscribersList";

export const dynamic = "force-dynamic";

export default async function AdminSubscribersPage() {
  let totalSubscribers = 0;

  try {
    totalSubscribers = await getSubscribersCount();
  } catch {
    // DB not available
  }

  return (
    <div>
      <div className="mb-4 sm:mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold">Subscribers ({totalSubscribers})</h1>
      </div>

      <SubscribersListClient />
    </div>
  );
}
