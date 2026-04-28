"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
  BookOpenText,
  Globe,
  Heart,
  Languages,
  Music4,
  Shapes,
} from "lucide-react";
import {
  BrowseByLanguageSection,
  type LanguageOverviewItem,
} from "@/components/languages/BrowseByLanguageSection";
import { useFavorites } from "@/hooks/useFavorites";
import { publicSiteTitle } from "@/lib/site";

interface HomeClientProps {
  totalSongs: number;
  totalLanguages: number;
  totalCategories: number;
  languageOverview: LanguageOverviewItem[];
  mobileMostViewedSongsSection: ReactNode;
  desktopMostViewedSongsSection: ReactNode;
  mobileRecentlyAddedSongsSection?: ReactNode;
  desktopRecentlyAddedSongsSection?: ReactNode;
}

const HOME_HERO_KICKER = publicSiteTitle;
const HOME_HERO_TITLE = "Explore a multilingual library of Christian songs";
const HOME_HERO_SUPPORTING_TEXT =
  "Discover and worship with a rich collection of songs from around the world, all in one place.";
const HOME_HERO_FEATURES = [
  {
    title: "Worship Together",
    description: "Songs that unite hearts",
    icon: Music4,
  },
  {
    title: "Many Languages",
    description: "Worship in your heart language",
    icon: Globe,
  },
];
const HERO_GRADIENT_STYLE = {
  backgroundImage:
    "linear-gradient(135deg, var(--desktop-hero-start), var(--desktop-hero-end))",
};
const HERO_CARD_STYLE = {
  backgroundColor: "#07473d",
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
  mobileRecentlyAddedSongsSection,
  desktopRecentlyAddedSongsSection,
}: HomeClientProps) {
  const router = useRouter();
  const { favorites } = useFavorites();

  const stats = [
    {
      label: "Songs",
      value: formatCompactNumber(totalSongs),
      icon: BookOpenText,
      supportingText: "Worship songs",
    },
    {
      label: "Languages",
      value: String(totalLanguages),
      icon: Languages,
      supportingText: "Available",
    },
    {
      label: "Categories",
      value: String(totalCategories),
      icon: Shapes,
      supportingText: "Organized collection",
    },
    {
      label: "Favorites",
      value: String(favorites.length),
      icon: Heart,
      supportingText: "Saved songs",
    },
  ];

  const openLanguagePage = (languageCode: string) => {
    router.push(`/languages?lang=${encodeURIComponent(languageCode)}`);
  };

  return (
    <div className="space-y-5 md:space-y-8">
      <section className="mx-auto max-w-[1200px] px-4 pt-2 md:hidden">
        <div
          className="relative overflow-hidden rounded-[1.8rem] px-4 py-5 text-[var(--desktop-hero-foreground)] shadow-[0_28px_60px_rgba(6,78,59,0.22)]"
          style={HERO_CARD_STYLE}
        >
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 82% 28%, rgba(255,255,255,0.18), transparent 22%), radial-gradient(circle at 80% 72%, rgba(255,243,176,0.18), transparent 20%), linear-gradient(180deg, rgba(255,255,255,0.05), transparent 55%)",
            }}
          />

          <div className="relative max-w-none pr-2">
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-[var(--desktop-hero-muted)]">
              {HOME_HERO_KICKER}
            </p>
            <div className="mt-2 h-px w-10 bg-[var(--desktop-hero-muted)]/55" />
            <h1 className="mt-2 text-left font-heading text-[1.65rem] font-semibold leading-[1.02] tracking-[-0.045em] md:mt-3">
              {HOME_HERO_TITLE}
            </h1>
            <p className="mt-1 text-left text-[0.92rem] leading-[1.05] md:mt-3 md:leading-8 text-[var(--desktop-hero-muted)]">
              {HOME_HERO_SUPPORTING_TEXT}
            </p>

            <div className="mt-4 space-y-2 md:mt-5 md:space-y-3">
              {HOME_HERO_FEATURES.map(({ title, description, icon: Icon }) => (
                <div key={title} className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/12 text-[var(--desktop-hero-foreground)]">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-[0.92rem] font-semibold leading-none text-[var(--desktop-hero-foreground)]">
                      {title}
                    </p>
                    <p className="mt-1 text-[0.82rem] text-[var(--desktop-hero-muted)]">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3.5 grid grid-cols-4 gap-2">
          {stats.map(({ label, value, icon: Icon }) => (
            <article
              key={label}
              className="rounded-[1.1rem] border border-white/10 p-2 text-[var(--desktop-hero-foreground)] shadow-[0_12px_24px_rgba(6,78,59,0.14)] flex flex-col items-center"
              style={HERO_GRADIENT_STYLE}
            >
              <div className="flex flex-col items-center">
                <div className="flex size-8 items-center justify-center rounded-[0.8rem] bg-white/10 text-[var(--desktop-hero-muted)] mb-1">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="font-heading text-[1.1rem] font-semibold leading-none tracking-[-0.05em] text-[var(--desktop-hero-foreground)]">
                  {value}
                </p>
                <p className="truncate text-[0.60rem] font-semibold uppercase tracking-[0.14em] text-[var(--desktop-hero-muted)] mt-0.5">
                  {label}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-3.5">
          <BrowseByLanguageSection
            id="browse-by-language-mobile"
            languages={languageOverview}
            onSelect={openLanguagePage}
          />
        </div>

        {mobileRecentlyAddedSongsSection}
        {mobileMostViewedSongsSection}
      </section>

      <div className="hidden md:block">
        <section
          className="relative overflow-hidden rounded-[2.35rem] px-8 py-9 text-[var(--desktop-hero-foreground)] shadow-[0_28px_60px_rgba(6,78,59,0.22)]"
          style={HERO_CARD_STYLE}
        >
          <div
            className="absolute inset-0 opacity-32"
            style={{
              backgroundImage:
                "radial-gradient(circle at 77% 24%, rgba(255,255,255,0.2), transparent 16%), radial-gradient(circle at 75% 78%, rgba(255,240,165,0.2), transparent 24%), linear-gradient(135deg, rgba(255,255,255,0.03), transparent 48%)",
            }}
          />
          <div className="absolute -right-10 top-0 h-full w-[48%] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1),transparent_62%)]" />

          <div className="relative grid gap-10 lg:grid-cols-1 lg:items-start">
            <div className="w-full max-w-none">
              <p className="text-[0.8rem] font-semibold uppercase tracking-[0.24em] text-[var(--desktop-hero-muted)]">
                {HOME_HERO_KICKER}
              </p>
              <div className="mt-4 h-px w-12 bg-[var(--desktop-hero-muted)]/55" />
              <h1 className="mt-5 font-heading text-[clamp(3rem,5vw,4.4rem)] font-semibold leading-[0.94] tracking-[-0.06em]">
                {HOME_HERO_TITLE}
              </h1>
              <p className="mt-6 text-[1.15rem] leading-9 text-[var(--desktop-hero-muted)]">
                {HOME_HERO_SUPPORTING_TEXT}
              </p>

              <div className="mt-8 flex flex-wrap gap-8">
                {HOME_HERO_FEATURES.map(({ title, description, icon: Icon }) => (
                  <div key={title} className="flex min-w-[220px] items-center gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/12 text-[var(--desktop-hero-foreground)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[1.05rem] font-semibold leading-none text-[var(--desktop-hero-foreground)]">
                        {title}
                      </p>
                      <p className="mt-1.5 text-[0.96rem] text-[var(--desktop-hero-muted)]">
                        {description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-4">
          {stats.map(({ label, value, icon: Icon, supportingText }) => (
            <article
              key={label}
              className="rounded-[2rem] border border-white/10 p-6 text-[var(--desktop-hero-foreground)] shadow-[0_28px_60px_rgba(6,78,59,0.18)]"
              style={HERO_GRADIENT_STYLE}
            >
              <div className="flex items-center gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-[1.2rem] bg-white/10 text-[var(--desktop-hero-muted)]">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-3">
                    <p className="font-heading text-[2.35rem] font-semibold leading-none tracking-[-0.05em] text-[var(--desktop-hero-foreground)]">
                      {value}
                    </p>
                    <span className="text-[0.95rem] font-semibold text-[var(--desktop-hero-foreground)]">
                      {label}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[0.95rem] text-[var(--desktop-hero-muted)]">
                    {supportingText}
                  </p>
                </div>
              </div>
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

        {desktopRecentlyAddedSongsSection}
        {desktopMostViewedSongsSection}
      </div>
    </div>
  );
}
