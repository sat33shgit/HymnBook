"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenText,
  Moon,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useFavorites } from "@/hooks/useFavorites";
import { publicSiteTitle } from "@/lib/site";
import { publicNavItems } from "./publicNavItems";

export function DesktopSidebar() {
  const rawPathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { favorites } = useFavorites();

  const clientPathname = rawPathname ?? (typeof window !== "undefined" ? window.location.pathname : "/");

  const pathname = (() => {
    const p = clientPathname ?? "/";
    const withoutQuery = p.split("?")[0].split("#")[0];
    if (withoutQuery !== "/" && withoutQuery.endsWith("/")) {
      return withoutQuery.replace(/\/+$/, "");
    }
    return withoutQuery || "/";
  })();

  if (pathname.startsWith("/admin")) return null;

  return (
    <aside className="hidden h-screen flex-col border-r border-[var(--desktop-divider)] bg-[var(--desktop-sidebar)] px-4 py-6 backdrop-blur-xl md:sticky md:top-0 md:flex lg:px-5">
      <div className="rounded-[2rem] border border-[var(--desktop-panel-border)] bg-[var(--desktop-panel)] p-5 shadow-[0_20px_45px_rgba(15,23,42,0.08)] dark:shadow-[0_20px_45px_rgba(2,6,23,0.35)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="flex size-12 items-center justify-center rounded-full text-[var(--desktop-hero-foreground)] shadow-[0_18px_32px_rgba(6,78,59,0.24)]"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, var(--desktop-hero-start), var(--desktop-hero-end))",
              }}
            >
              <BookOpenText className="h-5 w-5" />
            </div>
            <div>
              <p className="font-heading text-[1.15rem] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground">
                {publicSiteTitle}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-10 rounded-2xl bg-[var(--desktop-panel-soft)] text-[var(--desktop-nav-muted)] hover:bg-[var(--desktop-chip)] hover:text-foreground"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
        <p className="mt-5 text-[0.94rem] leading-8 text-[var(--desktop-nav-muted)]">
          Explore a rich collection of Christian songs from around the world, all in one place.
        </p>
      </div>

      <nav
        className="mt-5 rounded-[2rem] border border-[var(--desktop-panel-border)] bg-[var(--desktop-panel)] p-3 shadow-[0_18px_40px_rgba(15,23,42,0.06)] dark:shadow-[0_18px_40px_rgba(2,6,23,0.3)]"
        aria-label="Desktop navigation"
      >
        <div className="space-y-1.5">
          {publicNavItems.map(({ href, label, icon: Icon, matches }) => {
            const isActive = matches(pathname);

            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-[1.25rem] px-4 py-3 text-[1rem] font-semibold transition-all ${
                  isActive
                    ? "bg-[var(--desktop-nav-active)] text-[var(--desktop-nav-active-foreground)] shadow-[0_18px_34px_rgba(15,23,42,0.16)]"
                    : "text-[var(--desktop-nav-muted)] hover:bg-[var(--desktop-panel-soft)] hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={1.9} />
                <span>{label}</span>
                {href === "/favorites" && favorites.length > 0 && (
                  <span className="ml-auto rounded-full bg-white/12 px-2 py-0.5 text-[0.72rem] font-semibold text-current">
                    {favorites.length}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
