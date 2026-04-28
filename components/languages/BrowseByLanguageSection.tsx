"use client";

import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LanguageOverviewItem {
  code: string;
  label: string;
  count: number;
}

interface BrowseByLanguageSectionProps {
  languages: LanguageOverviewItem[];
  title?: string;
  description?: string;
  id?: string;
  selectedCode?: string;
  onSelect?: (languageCode: string) => void;
}

const HERO_HEADER_STYLE = {
  backgroundColor: "var(--desktop-hero-start)",
};

export function BrowseByLanguageSection({
  languages,
  title = "Browse by language",
  description = "Quick access to the most common language groups in the library.",
  id,
  selectedCode,
  onSelect,
}: BrowseByLanguageSectionProps) {
  if (languages.length === 0) {
    return null;
  }

  return (
    <section
      id={id}
      className="relative rounded-[1.65rem] p-4 text-[var(--desktop-hero-foreground)] shadow-[0_28px_60px_rgba(6,78,59,0.22)] md:rounded-[2rem] md:p-6"
      style={HERO_HEADER_STYLE}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-[1.45rem] font-semibold leading-[1.05] tracking-[-0.04em] md:text-[1.85rem]">
            {title}
          </h2>
          <p className="mt-1.5 max-w-3xl text-[0.84rem] leading-6 text-[var(--desktop-hero-muted)] md:mt-2 md:text-[0.94rem] md:leading-7">
            {description}
          </p>
        </div>
        <div className="absolute right-3 top-3 md:static md:ml-0 flex size-10 shrink-0 items-center justify-center rounded-[1rem] bg-white/10 md:size-14 md:rounded-[1.5rem]">
          <Languages className="h-5 w-5 md:h-6 md:w-6" />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 md:mt-6 md:gap-3">
        {languages.map((language) => {
          const isSelected = selectedCode === language.code;

          return (
            <button
              key={language.code}
              type="button"
              onClick={() => onSelect?.(language.code)}
              className={cn(
                "group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.82rem] font-semibold transition-all duration-200 md:gap-2 md:px-4 md:py-2 md:text-[0.95rem] cursor-pointer",
                isSelected
                  ? "border-white/80 bg-white text-[var(--desktop-hero-start)] shadow-[0_14px_28px_rgba(15,23,42,0.14)]"
                  : "border-white/10 bg-white/10 text-[var(--desktop-hero-foreground)] hover:-translate-y-px hover:border-white/20 hover:bg-white/16 hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)] dark:hover:shadow-[0_12px_24px_rgba(2,6,23,0.32)]",
              )}
            >
              <span>{language.label}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[0.68rem] transition-colors duration-200 md:px-2 md:text-[0.78rem]",
                  isSelected
                    ? "bg-[rgba(7,79,60,0.12)] text-current"
                    : "bg-white/10 text-[var(--desktop-hero-muted)] group-hover:bg-white/15 group-hover:text-[var(--desktop-hero-foreground)]",
                )}
              >
                {language.count}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
