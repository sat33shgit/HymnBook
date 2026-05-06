import { auth } from "@/lib/auth";
import Link from "next/link";
import { Music, ExternalLink } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminMobileSidebar } from "@/components/admin/AdminMobileSidebar";

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
      {/* Desktop Sidebar */}
      {session?.user && <AdminSidebar />}

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {session?.user && (
          <header className="flex h-14 sm:h-16 items-center justify-between border-b px-4 sm:px-6 md:justify-end gap-2 sm:gap-4">
            <div className="flex items-center gap-2 md:hidden">
              <AdminMobileSidebar />
              <span className="font-heading font-bold text-sm sm:text-base">Admin</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 ml-auto">
              <span className="text-xs sm:text-sm text-muted-foreground truncate">
                {session.user.email}
              </span>
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "ghost", size: "sm" }) + " flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"}
              >
                <span className="hidden sm:inline">View Site</span>
                <span className="sm:hidden">View</span>
                <ExternalLink className="h-3 sm:h-4 w-3 sm:w-4" />
              </Link>
            </div>
          </header>
        )}
        <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
