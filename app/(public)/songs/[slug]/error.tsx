"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default function SongError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
      <h2 className="font-heading text-2xl font-bold">Could not load song</h2>
      <p className="mt-2 text-muted-foreground">
        Something went wrong while loading this song.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Go home
        </Link>
      </div>
    </div>
  );
}
