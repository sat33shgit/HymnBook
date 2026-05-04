"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useFavorites } from "@/hooks/useFavorites";
import { getPublicNavItems } from "./publicNavItems";

function normalizePathname(p: string | null | undefined): string {
  const raw = p ?? "/";
  const withoutQuery = raw.split("?")[0].split("#")[0];
  if (withoutQuery !== "/" && withoutQuery.endsWith("/")) {
    return withoutQuery.replace(/\/+$/, "");
  }
  return withoutQuery || "/";
}

export function MobileNav({
  contactVisible = true,
}: {
  contactVisible?: boolean;
}) {
  const rawPathname = usePathname();
  const { favorites } = useFavorites();
  const publicNavItems = getPublicNavItems({ contactVisible });

  // After hydration, sync the active state with the actual browser URL.
  // This guards against cases where the Next.js router state diverges from
  // window.location (e.g. when Cloudflare serves a cached response that
  // embeds stale flight/hydration data for a different path).
  const [clientPathname, setClientPathname] = useState<string | null>(null);
  useEffect(() => {
    setClientPathname(window.location.pathname);
  }, []);

  const pathname = normalizePathname(clientPathname ?? rawPathname);

  const hideNav = pathname.startsWith("/admin");

  if (hideNav) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 px-0 pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="flex w-full items-center gap-1.5 rounded-[1.5rem] border border-[var(--desktop-panel-border)] bg-[var(--desktop-sidebar)] p-2 shadow-[0_20px_48px_rgba(15,23,42,0.16)] backdrop-blur-xl dark:shadow-[0_20px_48px_rgba(2,6,23,0.4)]">
        {publicNavItems.map(({ href, label, icon: Icon, matches }) => {
          const isActive = matches(pathname);
          const badge = href === "/favorites" && favorites.length > 0 ? favorites.length : null;

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-12 flex-1 flex-col items-center justify-center gap-1 rounded-[1.1rem] px-2.5 text-center transition-all ${
                isActive
                  ? "bg-[var(--desktop-nav-active)] text-[var(--desktop-nav-active-foreground)] shadow-[0_16px_30px_rgba(15,23,42,0.18)]"
                  : "text-[var(--desktop-nav-muted)] hover:bg-[var(--desktop-panel-soft)] hover:text-foreground"
              }`}
            >
              <div className="relative">
                <Icon className="h-4 w-4" strokeWidth={1.9} />
                {badge && (
                  <span
                    className={`absolute -right-2 -top-1 min-w-4 rounded-full px-1 py-0.5 text-[0.6rem] font-semibold leading-none ${
                      isActive
                        ? "bg-white/14 text-current"
                        : "bg-[var(--desktop-nav-active)] text-[var(--desktop-nav-active-foreground)]"
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </div>
              <span className="text-[0.7rem] font-semibold leading-none">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
