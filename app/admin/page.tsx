import {
  BookHeart,
  BookOpenText,
  Languages,
  Mail,
  Plus,
  Shapes,
} from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  let totalSongs = 0;
  let totalLanguages = 0;
  let totalCategories = 0;
  let totalFavorites = 0;
  let totalMessages = 0;

  try {
    const {
      getCategories,
      getContactMessagesCount,
      getFavoritesCount,
      getPublishedSongTranslationCount,
      getLanguages,
    } = await import("@/lib/db/queries");
    const [publishedSongCount, languages, categories, favoritesCount, messagesCount] = await Promise.all([
      getPublishedSongTranslationCount(),
      getLanguages(),
      getCategories(),
      getFavoritesCount(),
      getContactMessagesCount(),
    ]);
    totalSongs = publishedSongCount;
    totalLanguages = languages.length;
    totalCategories = categories.length;
    totalFavorites = favoritesCount;
    totalMessages = messagesCount;
  } catch {
    // DB not available
  }

  const summaryCards = [
    {
      label: "Songs",
      value: totalSongs,
      icon: BookOpenText,
    },
    {
      label: "Languages",
      value: totalLanguages,
      icon: Languages,
    },
    {
      label: "Categories",
      value: totalCategories,
      icon: Shapes,
    },
    {
      label: "Favorites",
      value: totalFavorites,
      icon: BookHeart,
    },
    {
      label: "Messages",
      value: totalMessages,
      icon: Mail,
    },
  ];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold">Dashboard</h1>
        <Link
          href="/admin/songs/new"
          className={buttonVariants({
            className:
              "h-9 rounded-[0.95rem] bg-indigo-600 px-3.5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(79,70,229,0.24)] hover:bg-indigo-700",
          })}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Song
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(({ label, value, icon: Icon }) => (
          <section
            key={label}
            className="rounded-[2rem] border bg-card px-5 py-5 shadow-[0_18px_38px_rgba(15,23,42,0.06)]"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-[1.1rem] bg-muted text-muted-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-[0.82rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {label}
              </p>
            </div>
            <p className="mt-7 font-heading text-[2.4rem] font-semibold leading-none tracking-[-0.05em] text-foreground">
              {value}
            </p>
          </section>
        ))}
      </div>

      <section className="mt-8 rounded-[2rem] border bg-card p-5 shadow-[0_18px_38px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-heading text-xl font-semibold">Quick Actions</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Jump directly into song and language management.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/songs" className={buttonVariants({ variant: "outline" })}>
              Manage Songs
            </Link>
            <Link href="/admin/languages" className={buttonVariants({ variant: "outline" })}>
              Manage Languages
            </Link>
            <Link href="/admin/messages" className={buttonVariants({ variant: "outline" })}>
              View Messages
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
