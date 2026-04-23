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

export const publicNavItems: PublicNavItem[] = [
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
  {
    href: "/contact",
    label: "Contact",
    icon: Mail,
    matches: (pathname) => pathname.startsWith("/contact"),
  },
];
