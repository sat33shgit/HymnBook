import { auth } from "@/lib/auth";
import Link from "next/link";
import { Music, LayoutDashboard, Music2, Globe } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { AdminSignOut } from "@/components/admin/AdminSignOut";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Login page is rendered separately
  // For all other admin pages, require auth
  // (middleware handles the redirect, but this is defense-in-depth)

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      {session?.user && (
        <aside className="hidden w-64 shrink-0 border-r bg-muted/30 md:block">
          <div className="flex h-16 items-center gap-2 border-b px-6">
            <Music className="h-6 w-6 text-primary" />
            <span className="font-heading text-lg font-bold">HymnBook</span>
          </div>
          <nav className="flex flex-col gap-1 p-4" role="navigation">
            <Link
              href="/admin"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/admin/songs"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              <Music2 className="h-4 w-4" />
              Songs
            </Link>
            <Link
              href="/admin/languages"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              <Globe className="h-4 w-4" />
              Languages
            </Link>
          </nav>
          <div className="mt-auto border-t p-4">
            <AdminSignOut />
          </div>
        </aside>
      )}

      {/* Main content */}
      <div className="flex-1">
        {session?.user && (
          <header className="flex h-16 items-center justify-between border-b px-6 md:justify-end">
            <div className="flex items-center gap-2 md:hidden">
              <Music className="h-5 w-5 text-primary" />
              <span className="font-heading font-bold">Admin</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {session.user.email}
              </span>
              <Link href="/" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                View Site
              </Link>
            </div>
          </header>
        )}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
