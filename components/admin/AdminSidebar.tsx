"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Music2, Globe, Mail, Users } from "lucide-react";
import { AdminSignOut } from "@/components/admin/AdminSignOut";

export function AdminSidebar() {
  const rawPathname = usePathname();

  const clientPathname =
    rawPathname ?? (typeof window !== "undefined" ? window.location.pathname : "/");

  const pathname = (() => {
    const p = clientPathname ?? "/";
    const withoutQuery = p.split("?")[0].split("#")[0];
    if (withoutQuery !== "/" && withoutQuery.endsWith("/")) {
      return withoutQuery.replace(/\/+$/, "");
    }
    return withoutQuery || "/";
  })();

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard, matches: (p: string) => p === "/admin" },
    { href: "/admin/songs", label: "Songs", icon: Music2, matches: (p: string) => p.startsWith("/admin/songs") },
    { href: "/admin/languages", label: "Languages", icon: Globe, matches: (p: string) => p.startsWith("/admin/languages") },
    { href: "/admin/messages", label: "Messages", icon: Mail, matches: (p: string) => p.startsWith("/admin/messages") },
    { href: "/admin/subscribers", label: "Subscribers", icon: Users, matches: (p: string) => p.startsWith("/admin/subscribers") },
  ];

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-muted/30 md:block">
      <div className="flex h-16 items-center gap-2 border-b px-4">
        <Image
          src="/logo.jpg"
          alt="Sing Unto The Lord"
          width={36}
          height={36}
          className="rounded-full shrink-0"
        />
        <span
          className="whitespace-nowrap text-base font-bold leading-tight"
          style={{ fontFamily: "var(--font-cinzel)" }}
        >
          Sing Unto The Lord
        </span>
      </div>

      <nav className="flex flex-col gap-1 p-4" role="navigation">
        {navItems.map(({ href, label, icon: Icon, matches }) => {
          const isActive = matches(pathname);

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? "bg-muted text-muted-foreground" : "hover:bg-muted"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t p-4">
        <AdminSignOut />
      </div>
    </aside>
  );
}
