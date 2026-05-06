"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUp, ArrowUpDown, Eye, Mail, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ContactMessage } from "@/types";

interface AdminMessagesClientProps {
  initialMessages: ContactMessage[];
}

type SortKey = "sender" | "requestType" | "received" | "consent";
type SortDirection = "asc" | "desc";

function formatDate(value: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function buildReplyHref(message: ContactMessage) {
  const subject = encodeURIComponent(
    `Re: ${message.requestType} - HymnBook contact request`
  );
  return `mailto:${message.email}?subject=${subject}`;
}

export function AdminMessagesClient({
  initialMessages,
}: AdminMessagesClientProps) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("received");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const selectedMessage =
    messages.find((message) => message.id === deleteId) ?? null;

  const getPreview = (message: string) =>
    message.length > 140 ? `${message.slice(0, 140).trimEnd()}...` : message;

  const collator = new Intl.Collator(undefined, { sensitivity: "base" });

  const sortedMessages = [...messages].sort((left, right) => {
    const direction = sortDirection === "asc" ? 1 : -1;

    if (sortKey === "sender") {
      return (
        direction *
        (collator.compare(left.name, right.name) ||
          collator.compare(left.email, right.email))
      );
    }

    if (sortKey === "requestType") {
      return direction * collator.compare(left.requestType, right.requestType);
    }

    if (sortKey === "consent") {
      if (left.consentToContact === right.consentToContact) {
        return 0;
      }

      return direction * (left.consentToContact ? 1 : -1);
    }

    const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;

    return direction * (leftTime - rightTime || left.id - right.id);
  });

  const handleSort = (nextKey: SortKey) => {
    if (sortKey === nextKey) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection(nextKey === "received" ? "desc" : "asc");
  };

  const getSortIndicator = (columnKey: SortKey) => {
    if (sortKey !== columnKey) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />;
    }

    return (
      <ArrowUp
        className={`h-3.5 w-3.5 transition-transform ${
          sortDirection === "desc" ? "rotate-180" : ""
        }`}
      />
    );
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/contact-messages/${deleteId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete message");
      }

      setMessages((prev) => prev.filter((message) => message.id !== deleteId));
      setDeleteId(null);
      toast.success("Message deleted");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete message"
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="mb-4 sm:mb-6 flex flex-col">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold">
            Messages ({messages.length})
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Review contact requests, reply by email, or remove messages.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium">
                <button
                  type="button"
                  onClick={() => handleSort("sender")}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  <span>Sender</span>
                  {getSortIndicator("sender")}
                </button>
              </th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium">
                <button
                  type="button"
                  onClick={() => handleSort("requestType")}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  <span>Request</span>
                  {getSortIndicator("requestType")}
                </button>
              </th>
              <th className="hidden sm:table-cell px-4 py-3 text-left font-medium">Preview</th>
              <th className="hidden md:table-cell px-4 py-3 text-left font-medium">
                <button
                  type="button"
                  onClick={() => handleSort("received")}
                  className="inline-flex items-center gap-1.5 hover:text-foreground"
                >
                  <span>Received</span>
                  {getSortIndicator("received")}
                </button>
              </th>
              <th className="hidden lg:table-cell px-4 py-3 text-center font-medium">
                <button
                  type="button"
                  onClick={() => handleSort("consent")}
                  className="inline-flex items-center gap-1.5 hover:text-foreground"
                >
                  <span>Consent</span>
                  {getSortIndicator("consent")}
                </button>
              </th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedMessages.map((message) => (
              <tr key={message.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-2 sm:px-4 py-2 sm:py-3 align-top text-xs sm:text-sm">
                  <div className="font-medium line-clamp-1">{message.name}</div>
                  <div className="text-muted-foreground text-[10px] sm:text-xs truncate">{message.email}</div>
                </td>
                <td className="px-2 sm:px-4 py-2 sm:py-3 align-top">
                  <Badge variant="outline" className="text-[10px] sm:text-xs whitespace-nowrap">{message.requestType}</Badge>
                </td>
                <td className="hidden sm:table-cell max-w-xs lg:max-w-md px-4 py-3 align-top text-muted-foreground text-sm">
                  <p className="whitespace-pre-wrap line-clamp-3">{getPreview(message.message)}</p>
                </td>
                <td className="hidden md:table-cell px-4 py-3 align-top text-muted-foreground text-sm whitespace-nowrap">
                  {formatDate(message.createdAt)}
                </td>
                <td className="hidden lg:table-cell px-4 py-3 text-center align-top">
                  <Badge
                    variant={message.consentToContact ? "secondary" : "outline"}
                    className="text-xs"
                  >
                    {message.consentToContact ? "Yes" : "No"}
                  </Badge>
                </td>
                <td className="px-2 sm:px-4 py-2 sm:py-3 text-right align-top">
                  <div className="flex justify-end gap-0.5 sm:gap-1">
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Link
                            href={`/admin/messages/${message.id}`}
                            className={buttonVariants({
                              variant: "ghost",
                              size: "icon",
                            }) + " h-7 w-7 sm:h-9 sm:w-9"}
                            title="View message"
                          />
                        }
                      >
                        <Eye className="h-3 sm:h-4 w-3 sm:w-4" />
                        <span className="sr-only">
                          View message from {message.name}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>View</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <a
                            href={buildReplyHref(message)}
                            className={buttonVariants({
                              variant: "ghost",
                              size: "icon",
                            }) + " h-7 w-7 sm:h-9 sm:w-9"}
                            title="Reply to sender"
                          />
                        }
                      >
                        <Mail className="h-3 sm:h-4 w-3 sm:w-4" />
                        <span className="sr-only">Reply to {message.name}</span>
                      </TooltipTrigger>
                      <TooltipContent>Reply</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(message.id)}
                            className="text-destructive hover:text-destructive h-7 w-7 sm:h-9 sm:w-9"
                            title="Delete message"
                          />
                        }
                      >
                        <Trash2 className="h-3 sm:h-4 w-3 sm:w-4" />
                        <span className="sr-only">
                          Delete message from {message.name}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>Delete</TooltipContent>
                    </Tooltip>
                  </div>
                </td>
              </tr>
            ))}
            {sortedMessages.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-xs sm:text-sm text-muted-foreground"
                >
                  No contact messages yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Message</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete the message from {selectedMessage?.name ?? "this sender"}?
            This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
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
    </div>
  );
}
