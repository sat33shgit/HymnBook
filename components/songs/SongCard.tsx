"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, Globe2, Heart, Star } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
        className="group h-full cursor-pointer rounded-[1.75rem] border border-[var(--desktop-panel-border)] bg-[var(--desktop-panel)] py-4 ring-0 shadow-[0_18px_36px_rgba(15,23,42,0.07)] transition-all hover:-translate-y-px hover:shadow-[0_20px_42px_rgba(15,23,42,0.1)] md:rounded-[2rem] md:py-5 dark:shadow-[0_20px_42px_rgba(2,6,23,0.3)] dark:hover:shadow-[0_22px_46px_rgba(2,6,23,0.34)]"
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
        <CardHeader className="px-4 pb-0 md:px-5">
          <div className="flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="block font-heading text-[1.2rem] font-semibold leading-[1.16] tracking-[-0.03em] text-foreground transition-colors group-hover:text-[var(--desktop-chip-hover-foreground)] md:text-[1.65rem] md:leading-[1.05] md:tracking-[-0.04em]">
                    {displayTitle}
                  </span>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {song.category && (
                      <Badge
                        variant="secondary"
                        className="rounded-full bg-[var(--desktop-panel-soft)] px-3 py-1 text-[0.76rem] font-semibold text-[var(--desktop-chip-foreground)] md:text-[0.78rem]"
                      >
                        {song.category}
                      </Badge>
                    )}
                    {song.languages.slice(0, 4).map((lang) => (
                      <Badge
                        key={lang}
                        variant="outline"
                        className="rounded-full border-[var(--desktop-chip-border)] bg-[var(--desktop-chip)] px-3 py-1 text-[0.76rem] font-semibold text-[var(--desktop-chip-foreground)]"
                      >
                        {LANGUAGE_NAMES[lang] ?? lang}
                      </Badge>
                    ))}
                    {song.languages.length > 4 && (
                      <Badge
                        variant="outline"
                        className="rounded-full border-[var(--desktop-chip-border)] bg-[var(--desktop-chip)] px-3 py-1 text-[0.76rem] font-semibold text-[var(--desktop-chip-foreground)]"
                      >
                        +{song.languages.length - 4}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="-mr-1 -mt-1 h-11 w-11 shrink-0 rounded-[1.15rem] bg-[var(--desktop-panel-soft)] hover:bg-[var(--desktop-chip)]"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(song.id);
                  }}
                  aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
                >
                  <Heart
                    className={`h-4 w-4 transition-colors ${
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
        <CardContent className="px-4 pt-4 md:px-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.9rem] text-[var(--desktop-nav-muted)] md:text-[0.92rem]">
              <span className="inline-flex items-center gap-2">
                <Globe2 className="h-4 w-4" />
                {song.languages.length} {song.languages.length === 1 ? "language" : "languages"}
              </span>
              <span className="inline-flex items-center gap-2">
                <Star className="h-4 w-4" />
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
