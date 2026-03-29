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
        className="group h-full cursor-pointer bg-[var(--card-surface)] transition-colors transition-shadow hover:shadow-lg md:rounded-[2rem] md:border md:border-[var(--desktop-panel-border)] md:bg-[var(--desktop-panel)] md:py-5 md:shadow-[0_20px_42px_rgba(15,23,42,0.07)] dark:md:shadow-[0_20px_42px_rgba(2,6,23,0.3)]"
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
        <CardHeader className="pb-0 md:px-5">
          <div className="flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="block font-heading text-[1.12rem] font-semibold leading-[1.2] text-foreground transition-colors group-hover:text-primary md:text-[1.65rem] md:leading-[1.05] md:tracking-[-0.04em]">
                    {displayTitle}
                  </span>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {song.category && (
                      <Badge
                        variant="secondary"
                        className="rounded-full px-3 py-1 text-[0.76rem] font-semibold md:bg-[var(--desktop-panel-soft)] md:text-[0.78rem] md:text-[var(--desktop-chip-foreground)]"
                      >
                        {song.category}
                      </Badge>
                    )}
                    {song.languages.slice(0, 4).map((lang) => (
                      <Badge
                        key={lang}
                        variant="outline"
                        className="rounded-full px-3 py-1 text-[0.76rem] font-semibold md:border-[var(--desktop-chip-border)] md:bg-[var(--desktop-chip)] md:text-[var(--desktop-chip-foreground)]"
                      >
                        {LANGUAGE_NAMES[lang] ?? lang}
                      </Badge>
                    ))}
                    {song.languages.length > 4 && (
                      <Badge
                        variant="outline"
                        className="rounded-full px-3 py-1 text-[0.76rem] font-semibold md:border-[var(--desktop-chip-border)] md:bg-[var(--desktop-chip)] md:text-[var(--desktop-chip-foreground)]"
                      >
                        +{song.languages.length - 4}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="-mr-2 -mt-2 h-11 w-11 shrink-0 rounded-full md:-mr-1 md:-mt-1 md:rounded-[1.15rem] md:bg-[var(--desktop-panel-soft)] md:hover:bg-[var(--desktop-chip)]"
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
                        : "text-muted-foreground md:text-[var(--desktop-nav-muted)]"
                    }`}
                  />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 md:px-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.88rem] text-muted-foreground md:text-[0.92rem] md:text-[var(--desktop-nav-muted)]">
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
