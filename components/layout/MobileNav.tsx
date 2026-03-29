"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Home, Search as SearchIcon } from "lucide-react";

export function MobileNav() {
  const pathname = usePathname();
  const hideNav = pathname.startsWith("/admin");

  if (hideNav) return null;

  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/search", label: "Search", icon: SearchIcon },
    { href: "/favorites", label: "Saved", icon: Bookmark },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="mx-auto flex max-w-md items-center gap-2 rounded-[1.75rem] border border-[#eadfd5] bg-background/95 p-3 shadow-[0_16px_40px_rgba(15,23,42,0.14)] backdrop-blur-xl dark:border-border">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-16 flex-1 flex-col items-center justify-center gap-1.5 rounded-2xl px-3 text-center transition-colors ${
                isActive
                  ? "bg-[#fff1e9] text-[#e06a3d] shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] dark:bg-[#2d231d] dark:text-[#f2b08f]"
                  : "text-[#5f5a54] hover:bg-[#f7f2ed] dark:text-muted-foreground dark:hover:bg-muted/70"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={1.9} />
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
