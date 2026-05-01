"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { publicSiteSubtitle, publicSiteTitle } from "@/lib/site";

export function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const isAdmin = pathname.startsWith("/admin");
  if (isAdmin) return null;

  return (
    <header className="sticky top-0 z-50 px-4 pt-3 md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between rounded-[1.45rem] border border-[var(--desktop-panel-border)] bg-[var(--desktop-sidebar)] px-3.5 py-2.5 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:shadow-[0_18px_40px_rgba(2,6,23,0.36)]">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="size-9 shrink-0 overflow-hidden rounded-full">
            <Image
              src="/logo.jpg"
              alt="Sing Unto The Lord logo"
              width={36}
              height={36}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate font-cinzel text-[1rem] leading-[1.25] text-foreground">
              {publicSiteTitle}
            </p>
            <p className="mt-0.5 truncate text-[0.74rem] font-medium text-[var(--desktop-nav-muted)]">
              {publicSiteSubtitle}
            </p>
          </div>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-[0.95rem] bg-[var(--desktop-panel)] text-[var(--desktop-nav-muted)] shadow-[0_12px_24px_rgba(15,23,42,0.08)] hover:bg-[var(--desktop-chip)] hover:text-foreground dark:shadow-[0_12px_24px_rgba(2,6,23,0.24)]"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </div>
    </header>
  );
}
