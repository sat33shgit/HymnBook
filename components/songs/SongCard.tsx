"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/useFavorites";
import type { SongListItem } from "@/types";
import { motion } from "framer-motion";

const LANGUAGE_NAMES: Record<string, string> = {
  en: "EN",
  te: "తె",
  hi: "हि",
  ta: "த",
  ml: "മ",
};

interface SongCardProps {
  song: SongListItem;
  index?: number;
}

export function SongCard({ song, index = 0 }: SongCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(song.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Card className="group h-full transition-shadow hover:shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/songs/${song.slug}`}
              className="flex-1 font-heading text-lg font-semibold leading-tight text-foreground transition-colors group-hover:text-primary"
            >
              {song.title}
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => toggleFavorite(song.id)}
              aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart
                className={`h-4 w-4 transition-colors ${
                  favorited
                    ? "fill-[var(--gold)] text-[var(--gold)]"
                    : "text-muted-foreground"
                }`}
              />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap items-center gap-2">
            {song.category && (
              <Badge variant="secondary" className="text-xs">
                {song.category}
              </Badge>
            )}
            <div className="flex gap-1">
              {song.languages.map((lang) => (
                <Badge
                  key={lang}
                  variant="outline"
                  className="px-1.5 py-0 text-[10px] font-medium"
                >
                  {LANGUAGE_NAMES[lang] ?? lang}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
