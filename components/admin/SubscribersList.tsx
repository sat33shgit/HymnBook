"use client";

import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button-variants";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Subscriber {
  id: number;
  email: string;
  location?: string | null;
  createdAt: string;
}

export function SubscribersList() {
  const [subs, setSubs] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedSubscriber, setSelectedSubscriber] = useState<Subscriber | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/subscribers');
        if (!res.ok) throw new Error('Failed to load subscribers');
        const data = await res.json();
        if (mounted) setSubs(data.subscribers ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false };
  }, []);

  function handleDeleteEmail(email: string, id: number) {
    setSelectedSubscriber({ id, email, createdAt: new Date().toISOString() });
    setConfirmOpen(true);
  }

  async function performDelete() {
    if (!selectedSubscriber) return;
    setRemoving(true);
    setDeletingId(selectedSubscriber.id);
    try {
      const res = await fetch('/api/subscribers', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: selectedSubscriber.email }) });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete');
      }
      setSubs((s) => s.filter((x) => x.id !== selectedSubscriber.id));
      toast.success('Subscriber removed');
      setConfirmOpen(false);
      setSelectedSubscriber(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete subscriber');
    } finally {
      setRemoving(false);
      setDeletingId(null);
    }
  }

  if (loading) return <div>Loading subscribers…</div>;
  if (error) return <div className="text-rose-600">Error: {error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Subscribers</h2>
        <div className="text-sm text-muted-foreground">{subs.length} total</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-sm text-muted-foreground">
              <th className="py-2">Email</th>
              <th className="py-2">Location</th>
              <th className="py-2">Subscribed</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="py-3 text-sm">{s.email}</td>
                <td className="py-3 text-sm">{s.location ?? "—"}</td>
                <td className="py-3 text-sm">{new Date(s.createdAt).toLocaleString()}</td>
                <td className="py-3">
                  <button
                    className={buttonVariants({ variant: 'outline', size: 'sm' })}
                    onClick={() => handleDeleteEmail(s.email, s.id)}
                    disabled={deletingId === s.id}
                  >
                    {deletingId === s.id ? 'Removing…' : 'Remove'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={(open) => { setConfirmOpen(open); if (!open) setSelectedSubscriber(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove subscriber</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Are you sure you want to remove subscriber <strong>{selectedSubscriber?.email}</strong>?
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={performDelete} disabled={removing} className="ml-2">{removing ? 'Removing…' : 'Remove'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
