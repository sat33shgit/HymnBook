"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { BookOpenText, Heart, Languages, Shapes } from "lucide-react";
import {
  BrowseByLanguageSection,
  type LanguageOverviewItem,
} from "@/components/languages/BrowseByLanguageSection";
import { useFavorites } from "@/hooks/useFavorites";

interface HomeClientProps {
  totalSongs: number;
  totalLanguages: number;
  totalCategories: number;
  languageOverview: LanguageOverviewItem[];
  mobileMostViewedSongsSection: ReactNode;
  desktopMostViewedSongsSection: ReactNode;
}

const HOME_HERO_KICKER = "Hymn Book";
const HOME_HERO_TITLE = "Explore a multilingual library of Christian songs";
const HOME_HERO_SUPPORTING_TEXT =
  "Search by title or lyrics, switch languages, and keep your favorite songs close.";
const HERO_GRADIENT_STYLE = {
  backgroundImage:
    "linear-gradient(135deg, var(--desktop-hero-start), var(--desktop-hero-end))",
};

function formatCompactNumber(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value);
}

export function HomeClient({
  totalSongs,
  totalLanguages,
  totalCategories,
  languageOverview,
  mobileMostViewedSongsSection,
  desktopMostViewedSongsSection,
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

  return (
    <div className="space-y-6 md:space-y-8">
      <section className="mx-auto max-w-[1200px] px-4 pt-2 md:hidden">
        <div
          className="rounded-[2.15rem] px-5 py-6 text-[var(--desktop-hero-foreground)] shadow-[0_28px_60px_rgba(6,78,59,0.22)]"
          style={HERO_GRADIENT_STYLE}
        >
          <p className="text-[0.74rem] font-semibold uppercase tracking-[0.22em] text-[var(--desktop-hero-muted)]">
            {HOME_HERO_KICKER}
          </p>
          <h1 className="mt-3 max-w-sm font-heading text-[2.35rem] font-semibold leading-[0.96] tracking-[-0.05em]">
            {HOME_HERO_TITLE}
          </h1>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {stats.map(({ label, value, icon: Icon }) => (
            <article
              key={label}
              className="min-h-[9.5rem] rounded-[1.7rem] border border-[var(--desktop-panel-border)] bg-[var(--desktop-panel)] p-4 shadow-[0_18px_38px_rgba(15,23,42,0.08)] dark:shadow-[0_18px_38px_rgba(2,6,23,0.28)]"
            >
              <div className="flex items-center gap-3 text-[var(--desktop-nav-muted)]">
                <div className="flex size-11 items-center justify-center rounded-[1.1rem] bg-[var(--desktop-panel-soft)]">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[0.78rem] font-semibold uppercase tracking-[0.16em]">
                  {label}
                </span>
              </div>
              <p className="mt-4 font-heading text-[1.95rem] font-semibold leading-none tracking-[-0.05em] text-foreground">
                {value}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-4">
          <BrowseByLanguageSection
            id="browse-by-language-mobile"
            languages={languageOverview}
            onSelect={openLanguagePage}
          />
        </div>

        {mobileMostViewedSongsSection}
      </section>

      <div className="hidden md:block">
        <section
          className="rounded-[2.35rem] px-8 py-9 text-[var(--desktop-hero-foreground)] shadow-[0_28px_60px_rgba(6,78,59,0.22)]"
          style={HERO_GRADIENT_STYLE}
        >
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.3fr)_360px] xl:items-center">
            <div>
              <p className="text-[0.8rem] font-semibold uppercase tracking-[0.24em] text-[var(--desktop-hero-muted)]">
                {HOME_HERO_KICKER}
              </p>
              <h1 className="mt-4 max-w-3xl font-heading text-[clamp(3rem,5vw,4.4rem)] font-semibold leading-[0.94] tracking-[-0.06em]">
                {HOME_HERO_TITLE}
              </h1>
            </div>

            <div className="rounded-[1.9rem] border border-white/10 bg-white/8 p-6 backdrop-blur-sm">
              <p className="text-[0.76rem] font-semibold uppercase tracking-[0.22em] text-[var(--desktop-hero-muted)]">
                Everything In One Place
              </p>
              <p className="mt-4 text-[1rem] leading-8 text-[var(--desktop-hero-muted)]">
                {HOME_HERO_SUPPORTING_TEXT}
              </p>
            </div>
          </div>
        </section>

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

        {desktopMostViewedSongsSection}
      </div>
    </div>
  );
}
