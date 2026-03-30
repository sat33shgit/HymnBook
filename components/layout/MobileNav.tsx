"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFavorites } from "@/hooks/useFavorites";
import { publicNavItems } from "./publicNavItems";

export function MobileNav() {
  const pathname = usePathname();
  const { favorites } = useFavorites();
  const hideNav = pathname.startsWith("/admin");

  if (hideNav) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="mx-auto flex max-w-lg items-center gap-2 rounded-[1.85rem] border border-[var(--desktop-panel-border)] bg-[var(--desktop-sidebar)] p-2.5 shadow-[0_20px_48px_rgba(15,23,42,0.16)] backdrop-blur-xl dark:shadow-[0_20px_48px_rgba(2,6,23,0.4)]">
        {publicNavItems.map(({ href, label, icon: Icon, matches }) => {
          const isActive = matches(pathname);
          const badge = href === "/favorites" && favorites.length > 0 ? favorites.length : null;

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-16 flex-1 flex-col items-center justify-center gap-1.5 rounded-[1.35rem] px-3 text-center transition-all ${
                isActive
                  ? "bg-[var(--desktop-nav-active)] text-[var(--desktop-nav-active-foreground)] shadow-[0_16px_30px_rgba(15,23,42,0.18)]"
                  : "text-[var(--desktop-nav-muted)] hover:bg-[var(--desktop-panel-soft)] hover:text-foreground"
              }`}
            >
              <div className="relative">
                <Icon className="h-5 w-5" strokeWidth={1.9} />
                {badge && (
                  <span
                    className={`absolute -right-3 -top-2 min-w-5 rounded-full px-1.5 py-0.5 text-[0.65rem] font-semibold leading-none ${
                      isActive
                        ? "bg-white/14 text-current"
                        : "bg-[var(--desktop-nav-active)] text-[var(--desktop-nav-active-foreground)]"
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </div>
              <span className="text-[0.78rem] font-semibold leading-none">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
