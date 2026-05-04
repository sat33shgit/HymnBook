import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { Music } from "lucide-react";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Music className="mb-6 h-16 w-16 text-primary/30" />
      <h1 className="font-heading text-[clamp(2.2rem,5vw,4rem)] font-semibold leading-none tracking-[-0.04em]">
        404
      </h1>
      <p className="mt-4 text-[1.12rem] font-semibold text-muted-foreground">
        Page not found
      </p>
      <p className="mt-2 text-[0.88rem] text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/" className={buttonVariants({ className: "mt-8" })}>
        Go Home
      </Link>
    </div>
  );
}
