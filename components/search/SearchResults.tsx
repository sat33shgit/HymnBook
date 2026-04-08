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
      <div className="flex flex-col items-center py-12 text-center md:py-16">
        <p className="text-[1rem] font-semibold text-foreground md:text-[1.12rem]">
          No results found for &ldquo;{query}&rdquo;
        </p>
        <p className="mt-2 text-[0.82rem] leading-6 text-[var(--desktop-nav-muted)] md:text-[0.88rem] md:leading-7">
          Try different keywords, check spelling, or search in a specific language.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 text-[0.8rem] text-[var(--desktop-nav-muted)] md:mb-4 md:text-[0.88rem]" aria-live="polite">
        {results.length} result{results.length !== 1 ? "s" : ""} found
      </p>
      <div className="space-y-2.5 md:space-y-3">
        {results.map((result, i) => (
          <motion.div
            key={`${result.song_id}-${result.matched_language}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, duration: 0.2 }}
          >
            <Link href={`/songs/${result.slug}?lang=${result.matched_language}`}>
              <Card className="rounded-[1.3rem] border border-[var(--desktop-panel-border)] bg-[var(--desktop-panel)] py-3 ring-0 shadow-[0_14px_30px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-px hover:bg-[var(--desktop-panel-soft)] hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)] md:rounded-[1.6rem] md:py-5 dark:shadow-[0_16px_34px_rgba(2,6,23,0.24)] dark:hover:shadow-[0_18px_36px_rgba(2,6,23,0.28)]">
                <CardContent className="px-3.5 md:px-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-heading text-[0.96rem] font-semibold leading-[1.16] tracking-[-0.02em] text-foreground md:text-[1.14rem]">
                      {result.title}
                    </h3>
                    <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                      <Badge
                        variant="outline"
                        className="border-[var(--desktop-chip-border)] bg-[var(--desktop-chip)] px-2 py-0.5 text-[0.68rem] text-[var(--desktop-chip-foreground)] md:px-2.5 md:text-[0.78rem]"
                      >
                        {LANG_NAMES[result.matched_language] ?? result.matched_language}
                      </Badge>
                      {result.category && (
                        <Badge
                          variant="secondary"
                          className="bg-[var(--desktop-panel-soft)] px-2 py-0.5 text-[0.68rem] text-[var(--desktop-chip-foreground)] md:px-2.5 md:text-[0.78rem]"
                        >
                          {result.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-[0.8rem] leading-6 text-[var(--desktop-nav-muted)] md:mt-2 md:text-[0.88rem] md:leading-7">
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
