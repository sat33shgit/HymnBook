import {
  Bookmark,
  Home,
  Languages,
  Search,
  Mail,
  type LucideIcon,
} from "lucide-react";

export interface PublicNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  matches: (pathname: string) => boolean;
}

export function getPublicNavItems(options?: {
  contactVisible?: boolean;
}): PublicNavItem[] {
  const contactVisible = options?.contactVisible ?? true;

  return [
    {
      href: "/",
      label: "Home",
      icon: Home,
      matches: (pathname) => pathname === "/",
    },
    {
      href: "/search",
      label: "Search",
      icon: Search,
      matches: (pathname) => pathname.startsWith("/search"),
    },
    {
      href: "/languages",
      label: "Languages",
      icon: Languages,
      matches: (pathname) => pathname.startsWith("/languages"),
    },
    {
      href: "/favorites",
      label: "Saved",
      icon: Bookmark,
      matches: (pathname) => pathname.startsWith("/favorites"),
    },
    ...(contactVisible
      ? [
          {
            href: "/contact",
            label: "Contact",
            icon: Mail,
            matches: (pathname: string) => pathname.startsWith("/contact"),
          },
        ]
      : []),
  ];
}
