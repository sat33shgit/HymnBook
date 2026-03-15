import { Music } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-4 px-4 py-8 text-center md:flex-row md:justify-between md:text-left">
        <div className="flex items-center gap-2">
          <Music className="h-5 w-5 text-primary" />
          <span className="font-heading text-lg font-semibold">HymnBook</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Sing praises to the Lord. Browse Christian song lyrics in multiple languages.
        </p>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <Link href="/search" className="hover:text-primary transition-colors">
            Search
          </Link>
          <Link href="/favorites" className="hover:text-primary transition-colors">
            Favorites
          </Link>
        </div>
      </div>
    </footer>
  );
}
