import { Header } from "@/components/layout/Header";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { isPublicContactVisible } from "@/lib/db/queries";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const contactVisible = await isPublicContactVisible();

  return (
    <div className="theme-c-public min-h-screen max-w-[100vw] overflow-x-hidden bg-[var(--desktop-shell)] text-foreground font-sans">
      <Header />
      <div className="md:grid md:min-h-screen md:grid-cols-[292px_minmax(0,1fr)]">
        <DesktopSidebar contactVisible={contactVisible} />
        <main className="flex-1 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:min-w-0 md:px-8 md:py-7 md:pb-10 lg:px-10">
          {children}
        </main>
      </div>
      <MobileNav contactVisible={contactVisible} />
    </div>
  );
}
