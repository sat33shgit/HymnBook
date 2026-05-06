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

export function SubscribersListClient() {
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

  if (loading) return <div className="text-xs sm:text-sm text-muted-foreground">Loading subscribers…</div>;
  if (error) return <div className="text-xs sm:text-sm text-rose-600">Error: {error}</div>;

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-xs sm:text-sm text-muted-foreground">
              <th className="px-2 sm:px-4 py-2 sm:py-3 font-medium">Email</th>
              <th className="hidden sm:table-cell px-4 py-3 font-medium">Location</th>
              <th className="hidden md:table-cell px-4 py-3 font-medium">Subscribed</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm truncate max-w-[150px] sm:max-w-none">{s.email}</td>
                <td className="hidden sm:table-cell px-4 py-3 text-sm text-muted-foreground">{s.location ?? "—"}</td>
                <td className="hidden md:table-cell px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{new Date(s.createdAt).toLocaleString()}</td>
                <td className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                  <button
                    className={buttonVariants({ variant: 'outline', size: 'sm' }) + " text-xs sm:text-sm h-8 sm:h-9"}
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
