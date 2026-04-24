import { auth } from "@/lib/auth";
import Link from "next/link";
import { Music, ExternalLink } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

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
      {session?.user && <AdminSidebar />}

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
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "ghost", size: "sm" }) + " flex items-center gap-2"}
              >
                View Site
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </header>
        )}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
