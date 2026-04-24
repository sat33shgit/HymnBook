import { SubscribersList } from "@/components/admin/SubscribersList";

export default function AdminSubscribersPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold">Subscribers</h1>
      </div>

      <section className="rounded-[1.25rem] border bg-card p-5">
        <SubscribersList />
      </section>
    </div>
  );
}
