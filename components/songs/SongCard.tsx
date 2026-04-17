"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, Globe2, Heart, Star } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/useFavorites";
import type { SongListItem } from "@/types";
import { motion } from "framer-motion";

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  te: "Telugu",
  hi: "Hindi",
  ta: "Tamil",
  ml: "Malayalam",
  kn: "Kannada",
};

function formatCompactNumber(value: number | null) {
  if (!value) {
    return "0";
  }

  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value);
}

interface SongCardProps {
  song: SongListItem;
  index?: number;
  preferredLanguage?: string;
  titleVariant?: "common" | "localized";
}

export function SongCard({
  song,
  index = 0,
  preferredLanguage,
  titleVariant = "common",
}: SongCardProps) {
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(song.id);
  const displayTitle =
    titleVariant === "localized" ? song.localizedTitle ?? song.title : song.title;
  const songHref = preferredLanguage
    ? `/songs/${song.slug}?lang=${encodeURIComponent(preferredLanguage)}`
    : `/songs/${song.slug}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Card
        className="group h-full cursor-pointer rounded-[1.45rem] border border-[var(--desktop-panel-border)] bg-[var(--desktop-panel)] py-3 ring-0 shadow-[0_18px_36px_rgba(15,23,42,0.07)] transition-all hover:-translate-y-px hover:shadow-[0_20px_42px_rgba(15,23,42,0.1)] md:rounded-[2rem] md:py-5 dark:shadow-[0_20px_42px_rgba(2,6,23,0.3)] dark:hover:shadow-[0_22px_46px_rgba(2,6,23,0.34)]"
        onClick={() => router.push(songHref)}
        role="link"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            router.push(songHref);
          }
        }}
      >
        <CardHeader className="px-3.5 pb-0 md:px-5">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="block font-heading text-[1rem] font-semibold leading-[1.14] tracking-[-0.03em] text-foreground transition-colors group-hover:text-[var(--desktop-chip-hover-foreground)] md:text-[1.65rem] md:leading-[1.05] md:tracking-[-0.04em]">
                    {displayTitle}
                  </span>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 md:mt-3 md:gap-2">
                    {song.category && (
                      <span className="inline-flex items-center rounded-md bg-[var(--desktop-panel-soft)] px-2 py-0.5 text-[0.68rem] font-semibold text-[var(--desktop-nav-muted)] md:px-3 md:py-1 md:text-[0.78rem]">
                        {song.category}
                      </span>
                    )}
                    {/* Desktop / tablet: show up to 4 chips and +N */}
                    <div className="hidden md:flex items-center gap-1.5 flex-wrap">
                      {song.languages.slice(0, 4).map((lang) => (
                        <span
                          key={lang}
                          className="inline-flex items-center rounded-md bg-[var(--desktop-panel-soft)] px-2 py-0.5 text-[0.68rem] font-semibold text-[var(--desktop-nav-muted)] md:px-3 md:py-1 md:text-[0.76rem]"
                        >
                          {LANGUAGE_NAMES[lang] ?? lang}
                        </span>
                      ))}
                      {song.languages.length > 4 && (
                        <span className="inline-flex items-center rounded-md bg-[var(--desktop-panel-soft)] px-2 py-0.5 text-[0.68rem] font-semibold text-[var(--desktop-nav-muted)] md:px-3 md:py-1 md:text-[0.76rem]">
                          +{song.languages.length - 4}
                        </span>
                      )}
                    </div>

                    {/* Mobile: single-line compact chips with +N overflow */}
                    <div className="flex md:hidden items-center gap-1.5 overflow-hidden whitespace-nowrap">
                      {song.languages.slice(0, 3).map((lang) => (
                        <span
                          key={lang}
                          className="inline-flex items-center rounded-md bg-[var(--desktop-panel-soft)] px-2 py-0.5 text-[0.64rem] font-semibold text-[var(--desktop-nav-muted)]"
                        >
                          {LANGUAGE_NAMES[lang] ?? lang}
                        </span>
                      ))}
                      {song.languages.length > 3 && (
                        <span className="inline-flex items-center rounded-md bg-[var(--desktop-panel-soft)] px-2 py-0.5 text-[0.64rem] font-semibold text-[var(--desktop-nav-muted)]">
                          +{song.languages.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="-mr-1 -mt-1 h-9 w-9 shrink-0 rounded-[1rem] bg-[var(--desktop-panel-soft)] hover:bg-[var(--desktop-chip)] md:h-11 md:w-11 md:rounded-[1.15rem]"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(song.id);
                  }}
                  aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
                >
                  <Heart
                    className={`h-3.5 w-3.5 transition-colors md:h-4 md:w-4 ${
                      favorited
                        ? "fill-[var(--gold)] text-[var(--gold)]"
                        : "text-[var(--desktop-nav-muted)]"
                    }`}
                  />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-3.5 pt-2 md:px-5 md:pt-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[0.8rem] text-[var(--desktop-nav-muted)] md:gap-x-4 md:gap-y-2 md:text-[0.92rem]">
              <span className="inline-flex items-center gap-2">
                <Globe2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                {song.languages.length} {song.languages.length === 1 ? "language" : "languages"}
              </span>
              <span className="inline-flex items-center gap-2">
                <Star className="h-3.5 w-3.5 md:h-4 md:w-4" />
                {formatCompactNumber(song.viewCount)} views
              </span>
            </div>

            <Button
              type="button"
              className="hidden h-11 rounded-full bg-[var(--desktop-nav-active)] px-5 text-[0.94rem] font-semibold text-[var(--desktop-nav-active-foreground)] shadow-[0_14px_28px_rgba(15,23,42,0.16)] hover:bg-[var(--desktop-nav-active)]/95 md:inline-flex"
              onClick={(e) => {
                e.stopPropagation();
                router.push(songHref);
              }}
            >
              Open lyrics
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
