"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MessageDetailActionsProps {
  id: number;
  name: string;
  email: string;
  requestType: string;
}

export function MessageDetailActions({
  id,
  name,
  email,
  requestType,
}: MessageDetailActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const subject = encodeURIComponent(
    `Re: ${requestType} - HymnBook contact request`
  );

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/contact-messages/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete message");
      }

      toast.success("Message deleted");
      router.push("/admin/messages");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete message"
      );
    } finally {
      setDeleting(false);
      setOpen(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <a
          href={`mailto:${email}?subject=${subject}`}
          className={buttonVariants({ variant: "outline" })}
        >
          <Mail className="mr-2 h-4 w-4" />
          Reply
        </a>
        <Button
          variant="destructive"
          onClick={() => setOpen(true)}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Message</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete the message from {name}? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
