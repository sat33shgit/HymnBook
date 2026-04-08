"use client";

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
      className="rounded-[1.65rem] border border-[var(--desktop-panel-border)] bg-[var(--desktop-panel)] p-4 shadow-[0_18px_38px_rgba(15,23,42,0.07)] dark:shadow-[0_18px_38px_rgba(2,6,23,0.28)] md:rounded-[2rem] md:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-[1.45rem] font-semibold leading-[1.05] tracking-[-0.04em] text-foreground md:text-[1.85rem]">
            {title}
          </h2>
          <p className="mt-1.5 text-[0.84rem] leading-6 text-[var(--desktop-nav-muted)] md:mt-2 md:text-[0.94rem] md:leading-7">
            {description}
          </p>
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
                "group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.82rem] font-semibold transition-all duration-200 md:gap-2 md:px-4 md:py-2 md:text-[0.95rem]",
                isSelected
                  ? "border-transparent bg-[var(--desktop-nav-active)] text-[var(--desktop-nav-active-foreground)] shadow-[0_14px_28px_rgba(15,23,42,0.14)]"
                  : "border-[var(--desktop-chip-border)] bg-[var(--desktop-chip)] text-[var(--desktop-chip-foreground)] hover:-translate-y-px hover:border-[var(--desktop-chip-hover-border)] hover:bg-[var(--desktop-chip-hover)] hover:text-[var(--desktop-chip-hover-foreground)] hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)] dark:hover:shadow-[0_12px_24px_rgba(2,6,23,0.32)]",
              )}
            >
              <span>{language.label}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[0.68rem] transition-colors duration-200 md:px-2 md:text-[0.78rem]",
                  isSelected
                    ? "bg-white/12 text-current"
                    : "bg-white/60 text-[var(--desktop-nav-muted)] group-hover:bg-[var(--desktop-chip-hover-count)] group-hover:text-[var(--desktop-chip-hover-foreground)] dark:bg-white/10 dark:text-[var(--desktop-chip-foreground)] dark:group-hover:bg-[var(--desktop-chip-hover-count)] dark:group-hover:text-[var(--desktop-chip-hover-foreground)]",
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
