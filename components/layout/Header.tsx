"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

export function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const isAdmin = pathname.startsWith("/admin");
  if (isAdmin) return null;

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between rounded-[1.75rem] border border-[var(--desktop-panel-border)] bg-[var(--desktop-sidebar)] px-4 py-3.5 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:shadow-[0_18px_40px_rgba(2,6,23,0.36)]">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-[1.1rem] text-[var(--desktop-hero-foreground)] shadow-[0_18px_32px_rgba(6,78,59,0.24)]"
            style={{
              backgroundImage:
                "linear-gradient(135deg, var(--desktop-hero-start), var(--desktop-hero-end))",
            }}
          >
            <BookOpenText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--desktop-nav-muted)]">
              Hymn Book
            </p>
            <p className="truncate text-[0.95rem] font-semibold text-foreground">
              Worship songs library
            </p>
          </div>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="size-11 rounded-[1.1rem] bg-[var(--desktop-panel)] text-[var(--desktop-nav-muted)] shadow-[0_12px_24px_rgba(15,23,42,0.08)] hover:bg-[var(--desktop-chip)] hover:text-foreground dark:shadow-[0_12px_24px_rgba(2,6,23,0.24)]"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </div>
    </header>
  );
}
