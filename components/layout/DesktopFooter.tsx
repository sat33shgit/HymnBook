import Image from "next/image";
import Link from "next/link";
import { publicSiteTitle, publicSiteSubtitle } from "@/lib/site";

export function DesktopFooter({
  contactVisible = true,
}: {
  contactVisible?: boolean;
}) {
  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/search", label: "Search" },
    { href: "/languages", label: "Languages" },
    { href: "/favorites", label: "Saved" },
    ...(contactVisible ? [{ href: "/contact", label: "Contact" }] : []),
  ];

  return (
    <footer className="hidden md:block mt-16 border-t border-[var(--desktop-divider)]">
      {/* Main footer body */}
      <div className="py-10 grid grid-cols-3 gap-10 items-start">
        {/* Brand column */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-12 overflow-hidden rounded-full shrink-0">
              <Image
                src="/logo.jpg"
                alt="Sing Unto The Lord logo"
                width={48}
                height={48}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <p className="font-cinzel text-[1.1rem] leading-tight text-foreground">
                {publicSiteTitle}
              </p>
              <p className="text-[0.82rem] text-muted-foreground">{publicSiteSubtitle}</p>
            </div>
          </div>
          <p className="text-[0.92rem] leading-relaxed text-muted-foreground">
            A free Christian worship song library with lyrics in multiple languages, for congregations and individuals around the world.
          </p>
        </div>

        {/* Nav column — centered, 2-column grid */}
        <div className="space-y-3">
          <p className="text-[0.78rem] font-semibold uppercase tracking-widest text-muted-foreground/60 text-center">
            Navigation
          </p>
          <ul className="grid grid-cols-2 gap-x-10 gap-y-2 justify-items-start">
            {navLinks.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-[0.95rem] text-muted-foreground hover:text-foreground transition-colors"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Spacer column */}
        <div aria-hidden="true" />
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[var(--desktop-divider)] py-4 flex items-center justify-between text-[0.82rem] text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} {publicSiteTitle}. All rights reserved.</p>
        <p>Made with ♥ for worshippers everywhere.</p>
      </div>
    </footer>
  );
}
