import { FavoritesClient } from "./FavoritesClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Favorites",
  description: "Your saved favorite Christian songs.",
  // Personal, session-specific page — no value in indexing
  robots: { index: false, follow: false },
};

export default function FavoritesPage() {
  return <FavoritesClient />;
}
