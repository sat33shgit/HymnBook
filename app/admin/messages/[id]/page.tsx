import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { Badge } from "@/components/ui/badge";
import {
  getContactMessageById,
  getContactMessageNavigation,
} from "@/lib/db/queries";
import { MessageDetailActions } from "./MessageDetailActions";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminMessageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const messageId = parseInt(id, 10);
  if (isNaN(messageId)) notFound();

  const [message, navigation] = await Promise.all([
    getContactMessageById(messageId),
    getContactMessageNavigation(messageId),
  ]);
  if (!message) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/messages"
            className={buttonVariants({ variant: "ghost", size: "sm", className: "mb-3" })}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Messages
          </Link>
          <h1 className="font-heading text-3xl font-bold">Message Details</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={
                navigation.previousId
                  ? `/admin/messages/${navigation.previousId}`
                  : "#"
              }
              aria-disabled={!navigation.previousId}
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: navigation.previousId
                  ? ""
                  : "pointer-events-none opacity-50",
              })}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Link>
            <Link
              href={
                navigation.nextId ? `/admin/messages/${navigation.nextId}` : "#"
              }
              aria-disabled={!navigation.nextId}
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: navigation.nextId
                  ? ""
                  : "pointer-events-none opacity-50",
              })}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
        <MessageDetailActions
          id={message.id}
          name={message.name}
          email={message.email}
          requestType={message.requestType}
        />
      </div>

      <section className="rounded-[1.5rem] border bg-card p-6 shadow-[0_18px_38px_rgba(15,23,42,0.06)]">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Name</p>
            <p className="mt-1 text-base font-semibold">{message.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <a
              href={`mailto:${message.email}`}
              className="mt-1 inline-block text-base font-semibold text-primary underline-offset-4 hover:underline"
            >
              {message.email}
            </a>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Request Type
            </p>
            <div className="mt-2">
              <Badge variant="outline">{message.requestType}</Badge>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Consent</p>
            <div className="mt-2">
              <Badge
                variant={message.consentToContact ? "secondary" : "outline"}
              >
                {message.consentToContact
                  ? "Can be contacted"
                  : "No contact consent"}
              </Badge>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Received</p>
            <p className="mt-1 text-base">{formatDate(message.createdAt)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Country</p>
            <p className="mt-1 text-base">{message.country || "-"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Device Type
            </p>
            <p className="mt-1 text-base capitalize">
              {message.deviceType || "-"}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-sm font-medium text-muted-foreground">Message</p>
          <div className="mt-3 rounded-2xl bg-muted/40 p-5">
            <p className="whitespace-pre-wrap leading-7 text-foreground">
              {message.message}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
