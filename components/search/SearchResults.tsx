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
        <p className="text-[1.12rem] font-semibold text-muted-foreground">
          No results found for &ldquo;{query}&rdquo;
        </p>
        <p className="mt-2 text-[0.88rem] text-muted-foreground">
          Try different keywords, check spelling, or search in a specific language.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-4 text-[0.88rem] text-muted-foreground" aria-live="polite">
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
              <Card className="bg-card transition-colors transition-shadow hover:bg-accent/40 hover:shadow-md md:rounded-[1.6rem] md:border md:border-[var(--desktop-panel-border)] md:bg-[var(--desktop-panel)] md:py-5 md:shadow-[0_16px_34px_rgba(15,23,42,0.06)] dark:md:shadow-[0_16px_34px_rgba(2,6,23,0.26)]">
                <CardContent className="px-4 md:px-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-heading text-[1rem] font-semibold leading-[1.2] md:text-[1.14rem] md:tracking-[-0.02em]">
                      {result.title}
                    </h3>
                    <div className="flex shrink-0 gap-1.5">
                      <Badge variant="outline">
                        {LANG_NAMES[result.matched_language] ?? result.matched_language}
                      </Badge>
                      {result.category && (
                        <Badge variant="secondary">
                          {result.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-2 text-[0.88rem] text-muted-foreground">
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
