"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Music } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Music className="mb-6 h-16 w-16 text-primary/30" />
      <h1 className="font-heading text-5xl font-bold">404</h1>
      <p className="mt-4 text-xl text-muted-foreground">
        Page not found
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/" className={buttonVariants({ className: "mt-8" })}>
        Go Home
      </Link>
    </div>
  );
}
