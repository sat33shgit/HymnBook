import { FavoritesClient } from "./FavoritesClient";

export const metadata = {
  title: "Favorites",
  description: "Your saved favorite Christian songs.",
};

export default function FavoritesPage() {
  return <FavoritesClient />;
}
