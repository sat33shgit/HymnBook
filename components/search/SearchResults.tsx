"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import type { SearchResultItem } from "@/types";

const LANG_NAMES: Record<string, string> = {
  en: "English",
  te: "Telugu",
  hi: "Hindi",
  ta: "Tamil",
  ml: "Malayalam",
  kn: "Kannada",
};

interface SearchResultsProps {
  results: SearchResultItem[];
  query: string;
}

function renderHighlightedText(text: string) {
  const segments = text.split(/(<mark>|<\/mark>)/g);
  const content: React.ReactNode[] = [];
  let isMarked = false;

  segments.forEach((segment, index) => {
    if (!segment) {
      return;
    }

    if (segment === "<mark>") {
      isMarked = true;
      return;
    }

    if (segment === "</mark>") {
      isMarked = false;
      return;
    }

    content.push(
      isMarked ? <mark key={index}>{segment}</mark> : <span key={index}>{segment}</span>
    );
  });

  return content;
}

export function SearchResults({ results, query }: SearchResultsProps) {
  if (results.length === 0 && query) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <p className="text-[1.12rem] font-semibold text-foreground">
          No results found for &ldquo;{query}&rdquo;
        </p>
        <p className="mt-2 text-[0.88rem] text-[var(--desktop-nav-muted)]">
          Try different keywords, check spelling, or search in a specific language.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-4 text-[0.88rem] text-[var(--desktop-nav-muted)]" aria-live="polite">
        {results.length} result{results.length !== 1 ? "s" : ""} found
      </p>
      <div className="space-y-3">
        {results.map((result, i) => (
          <motion.div
            key={`${result.song_id}-${result.matched_language}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, duration: 0.2 }}
          >
            <Link href={`/songs/${result.slug}?lang=${result.matched_language}`}>
              <Card className="rounded-[1.55rem] border border-[var(--desktop-panel-border)] bg-[var(--desktop-panel)] py-4 ring-0 shadow-[0_14px_30px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-px hover:bg-[var(--desktop-panel-soft)] hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)] md:rounded-[1.6rem] md:py-5 dark:shadow-[0_16px_34px_rgba(2,6,23,0.24)] dark:hover:shadow-[0_18px_36px_rgba(2,6,23,0.28)]">
                <CardContent className="px-4 md:px-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-heading text-[1.04rem] font-semibold leading-[1.18] tracking-[-0.02em] text-foreground md:text-[1.14rem]">
                      {result.title}
                    </h3>
                    <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                      <Badge
                        variant="outline"
                        className="border-[var(--desktop-chip-border)] bg-[var(--desktop-chip)] text-[var(--desktop-chip-foreground)]"
                      >
                        {LANG_NAMES[result.matched_language] ?? result.matched_language}
                      </Badge>
                      {result.category && (
                        <Badge
                          variant="secondary"
                          className="bg-[var(--desktop-panel-soft)] text-[var(--desktop-chip-foreground)]"
                        >
                          {result.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-2 text-[0.88rem] text-[var(--desktop-nav-muted)]">
                    {renderHighlightedText(result.matched_text)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
