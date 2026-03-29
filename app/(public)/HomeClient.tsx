"use client";

import { useRouter } from "next/navigation";
import { BookOpenText, Heart, Languages, Shapes } from "lucide-react";
import {
  BrowseByLanguageSection,
  type LanguageOverviewItem,
} from "@/components/languages/BrowseByLanguageSection";
import { SongList } from "@/components/songs/SongList";
import { useFavorites } from "@/hooks/useFavorites";
import type { SongListItem } from "@/types";

interface HomeClientProps {
  mostViewedSongs: SongListItem[];
  totalSongs: number;
  totalLanguages: number;
  totalCategories: number;
  languageOverview: LanguageOverviewItem[];
}

function formatCompactNumber(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value);
}

export function HomeClient({
  mostViewedSongs,
  totalSongs,
  totalLanguages,
  totalCategories,
  languageOverview,
}: HomeClientProps) {
  const router = useRouter();
  const { favorites } = useFavorites();

  const stats = [
    { label: "Songs", value: formatCompactNumber(totalSongs), icon: BookOpenText },
    { label: "Languages", value: String(totalLanguages), icon: Languages },
    { label: "Categories", value: String(totalCategories), icon: Shapes },
    { label: "Favorites", value: String(favorites.length), icon: Heart },
  ];

  const openLanguagePage = (languageCode: string) => {
    router.push(`/languages?lang=${encodeURIComponent(languageCode)}`);
  };

  const openAllSongs = () => {
    router.push("/search");
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <section className="mx-auto max-w-[1200px] px-4 py-4 md:hidden">
        {mostViewedSongs.length > 0 && (
          <div className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-[1.7rem] font-semibold leading-[1.1] tracking-[-0.03em]">
                Most Viewed Songs
              </h2>
              <button
                type="button"
                onClick={openAllSongs}
                className="text-[0.88rem] font-semibold text-primary transition-colors hover:text-primary/80"
              >
                View all
              </button>
            </div>
            <SongList songs={mostViewedSongs} />
          </div>
        )}
      </section>

      <div className="hidden md:block">
        <section className="mt-6 grid gap-4 xl:grid-cols-4">
          {stats.map(({ label, value, icon: Icon }) => (
            <article
              key={label}
              className="rounded-[2rem] border border-[var(--desktop-panel-border)] bg-[var(--desktop-panel)] p-5 shadow-[0_18px_38px_rgba(15,23,42,0.07)] dark:shadow-[0_18px_38px_rgba(2,6,23,0.28)]"
            >
              <div className="flex items-center gap-3 text-[var(--desktop-nav-muted)]">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--desktop-panel-soft)]">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[0.82rem] font-semibold uppercase tracking-[0.16em]">
                  {label}
                </span>
              </div>
              <p className="mt-5 font-heading text-[2.1rem] font-semibold leading-none tracking-[-0.05em] text-foreground">
                {value}
              </p>
            </article>
          ))}
        </section>

        <div className="mt-6">
          <BrowseByLanguageSection
            id="browse-by-language"
            languages={languageOverview}
            onSelect={openLanguagePage}
          />
        </div>

        {mostViewedSongs.length > 0 && (
          <section className="mt-8">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="font-heading text-[1.85rem] font-semibold leading-[1.05] tracking-[-0.04em]">
                  Most viewed songs
                </h2>
                <p className="mt-2 text-[0.94rem] text-[var(--desktop-nav-muted)]">
                  The core song list from the current site, presented in a richer
                  desktop layout.
                </p>
              </div>
              <button
                type="button"
                onClick={openAllSongs}
                className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--desktop-panel-border)] bg-[var(--desktop-panel)] px-5 text-[0.9rem] font-semibold text-foreground shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition-all hover:-translate-y-px hover:border-[var(--desktop-chip-hover-border)] hover:bg-[var(--desktop-chip-hover)] hover:text-[var(--desktop-chip-hover-foreground)] hover:shadow-[0_16px_32px_rgba(15,23,42,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/35 dark:shadow-[0_12px_24px_rgba(2,6,23,0.28)] dark:hover:shadow-[0_16px_32px_rgba(2,6,23,0.36)]"
              >
                View all
              </button>
            </div>
            <SongList songs={mostViewedSongs} className="xl:grid-cols-3" />
          </section>
        )}
      </div>
    </div>
  );
}
