"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useFavorites } from "@/hooks/useFavorites";
import { publicSiteTitle } from "@/lib/site";
import { getPublicNavItems } from "./publicNavItems";

function normalizePathname(p: string | null | undefined): string {
  const raw = p ?? "/";
  const withoutQuery = raw.split("?")[0].split("#")[0];
  if (withoutQuery !== "/" && withoutQuery.endsWith("/")) {
    return withoutQuery.replace(/\/+$/, "");
  }
  return withoutQuery || "/";
}

export function DesktopSidebar({
  contactVisible = true,
}: {
  contactVisible?: boolean;
}) {
  const rawPathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { favorites } = useFavorites();
  const publicNavItems = getPublicNavItems({ contactVisible });

  // On first mount: if the Next.js router state diverges from the real browser
  // URL (can happen when Cloudflare caches stale hydration data), override with
  // window.location.pathname. On subsequent rawPathname changes (client-side
  // navigation), the router is always correct so clear the override.
  const [pathnameOverride, setPathnameOverride] = useState<string | null>(null);
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      if (rawPathname !== window.location.pathname) {
        setPathnameOverride(window.location.pathname);
      }
    } else {
      setPathnameOverride(null);
    }
  }, [rawPathname]);

  const pathname = normalizePathname(pathnameOverride ?? rawPathname);

  if (pathname.startsWith("/admin")) return null;

  return (
    <aside className="hidden h-screen flex-col border-r border-[var(--desktop-divider)] bg-[var(--desktop-sidebar)] px-4 py-6 backdrop-blur-xl md:sticky md:top-0 md:flex lg:px-5">
      <div className="rounded-[2rem] border border-[var(--desktop-panel-border)] bg-[var(--desktop-panel)] shadow-[0_20px_45px_rgba(15,23,42,0.08)] dark:shadow-[0_20px_45px_rgba(2,6,23,0.35)] overflow-hidden">
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-12 overflow-hidden rounded-full shrink-0">
                <Image
                  src="/logo.jpg"
                  alt="Sing Unto The Lord logo"
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <p className="font-cinzel text-[1.1rem] leading-[1.05] text-foreground">
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
              <Moon className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Sun className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </div>
          <p className="mt-4 text-[0.94rem] leading-6 text-[var(--desktop-nav-muted)]">
            Explore a rich collection of Christian songs from around the world, all in one place.
          </p>
        </div>
        
        {/* Separator line */}
        <div className="h-px bg-[var(--desktop-panel-border)] mx-5" />

        <nav
          className="p-3"
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
      </div>
    </aside>
  );
}
