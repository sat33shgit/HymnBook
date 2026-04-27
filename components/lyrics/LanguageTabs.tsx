"use client";

import { useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

interface LanguageTabsProps {
  languages: { code: string; nativeName: string }[];
  activeLanguage: string;
  onSelect: (code: string) => void;
}

export function LanguageTabs({
  languages,
  activeLanguage,
  onSelect,
}: LanguageTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const container = containerRef.current;
    const activeTab = tabRefs.current[activeLanguage];

    if (!container || !activeTab) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      const containerRect = container.getBoundingClientRect();
      const tabRect = activeTab.getBoundingClientRect();
      const scrollLeft =
        container.scrollLeft +
        tabRect.left -
        containerRect.left -
        containerRect.width / 2 +
        tabRect.width / 2;

      container.scrollTo({ left: scrollLeft, behavior: "auto" });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [activeLanguage, languages]);

  // If only one language is available, don't render the selector at all.
  if (!languages || languages.length <= 1) return null;

  return (
    <>
      {/* Desktop / tablet: scrollable tabs (md+) */}
      <div
        ref={containerRef}
        className="hidden md:scrollbar-hide md:flex md:gap-2 md:overflow-x-auto"
        role="tablist"
        aria-label="Language selection"
      >
        {languages.map((lang) => {
          const isActive = lang.code === activeLanguage;
          return (
            <button
              key={lang.code}
              ref={(node) => {
                tabRefs.current[lang.code] = node;
              }}
              role="tab"
              aria-selected={isActive}
              aria-controls={`lyrics-panel-${lang.code}`}
              id={`lang-tab-${lang.code}`}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-[0.8rem] font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                isActive
                  ? "border-transparent bg-[var(--desktop-nav-active)] text-[var(--desktop-nav-active-foreground)] shadow-[0_14px_28px_rgba(15,23,42,0.14)]"
                  : "border-[var(--desktop-chip-border)] bg-[var(--desktop-chip)] text-[var(--desktop-chip-foreground)] hover:-translate-y-px hover:border-[var(--desktop-chip-hover-border)] hover:bg-[var(--desktop-chip-hover)] hover:text-[var(--desktop-chip-hover-foreground)]"
              }`}
              style={{ minWidth: 48, minHeight: 36, maxWidth: 160 }}
              onClick={() => onSelect(lang.code)}
            >
              {lang.nativeName}
              {isActive && <span className="sr-only"> (selected)</span>}
            </button>
          );
        })}
      </div>

      {/* Mobile: native select for discoverability and accessibility */}
      <div className="md:hidden">
        <label htmlFor="language-select" className="sr-only">
          Select language
        </label>
        <div className="relative">
          <select
            id="language-select"
            value={activeLanguage}
            onChange={(e) => onSelect(e.target.value)}
            className="appearance-none w-full rounded-lg border border-input bg-transparent py-2 pr-10 pl-2.5 text-sm font-semibold text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            aria-label="Select language"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeName}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        </div>
      </div>
    </>
  );
}
