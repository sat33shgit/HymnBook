"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search as SearchIcon, Heart, Menu, Moon, Sun, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useFavorites } from "@/hooks/useFavorites";
import { MobileNav } from "./MobileNav";
import { useState } from "react";

export function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { favorites } = useFavorites();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isAdmin = pathname.startsWith("/admin");
  if (isAdmin) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Music className="h-6 w-6 text-primary" />
          <span className="font-heading text-xl font-bold tracking-tight">
            Hymn Book
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex" role="navigation">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              pathname === "/" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Songs
          </Link>
          <Link
            href="/search"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              pathname === "/search"
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            Search
          </Link>
          <Link
            href="/favorites"
            className={`relative text-sm font-medium transition-colors hover:text-primary ${
              pathname === "/favorites"
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            Favorites
            {favorites.length > 0 && (
              <span className="absolute -right-5 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--gold)] text-[10px] font-bold text-white">
                {favorites.length}
              </span>
            )}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/search" aria-label="Search songs">
            <Button variant="ghost" size="icon" className="md:hidden">
              <SearchIcon className="h-5 w-5" />
            </Button>
          </Link>

          <Link href="/favorites" className="relative md:hidden" aria-label="Favorites">
            <Button variant="ghost" size="icon">
              <Heart className="h-5 w-5" />
              {favorites.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--gold)] text-[9px] font-bold text-white">
                  {favorites.length}
                </span>
              )}
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
    </header>
  );
}
