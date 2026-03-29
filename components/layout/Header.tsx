"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useFavorites } from "@/hooks/useFavorites";

export function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { favorites } = useFavorites();

  const isAdmin = pathname.startsWith("/admin");
  if (isAdmin) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Music className="h-6 w-6 text-primary" />
          <span className="font-heading text-[1.1rem] font-semibold tracking-[-0.02em] md:text-[1.15rem]">
            Beautiful Songs
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex" role="navigation">
          <Link
            href="/"
            className={`text-[0.88rem] font-semibold transition-colors hover:text-primary ${
              pathname === "/" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Songs
          </Link>
          <Link
            href="/search"
            className={`text-[0.88rem] font-semibold transition-colors hover:text-primary ${
              pathname === "/search"
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            Search
          </Link>
          <Link
            href="/favorites"
            className={`relative text-[0.88rem] font-semibold transition-colors hover:text-primary ${
              pathname === "/favorites"
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            Favorites
            {favorites.length > 0 && (
              <span className="absolute -right-5 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--gold)] text-[0.76rem] font-semibold text-white">
                {favorites.length}
              </span>
            )}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-11 md:size-8"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
      </div>
    </header>
  );
}
