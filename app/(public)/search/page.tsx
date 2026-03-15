import { SearchPageClient } from "./SearchClient";

export const metadata = {
  title: "Search Songs",
  description: "Search for Christian song lyrics across multiple languages.",
};

export default function SearchPage() {
  return <SearchPageClient />;
}
