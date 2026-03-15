"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
      <h2 className="font-heading text-2xl font-bold">Something went wrong</h2>
      <p className="mt-2 text-muted-foreground">
        {error.message || "An unexpected error occurred."}
      </p>
      <Button onClick={reset} className="mt-6">
        Try again
      </Button>
    </div>
  );
}
