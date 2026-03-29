"use client";

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
  return (
    <div
      className="scrollbar-hide flex gap-2.5 overflow-x-auto"
      role="tablist"
      aria-label="Language selection"
    >
      {languages.map((lang) => {
        const isActive = lang.code === activeLanguage;
        return (
          <button
            key={lang.code}
            role="tab"
            aria-selected={isActive}
            aria-controls={`lyrics-panel-${lang.code}`}
            id={`lang-tab-${lang.code}`}
            className={`shrink-0 rounded-full border px-4 py-2 text-[0.88rem] font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
              isActive
                ? "border-transparent bg-[var(--desktop-nav-active)] text-[var(--desktop-nav-active-foreground)] shadow-[0_14px_28px_rgba(15,23,42,0.14)]"
                : "border-[var(--desktop-chip-border)] bg-[var(--desktop-chip)] text-[var(--desktop-chip-foreground)] hover:-translate-y-px hover:border-[var(--desktop-chip-hover-border)] hover:bg-[var(--desktop-chip-hover)] hover:text-[var(--desktop-chip-hover-foreground)]"
            }`}
            style={{ minWidth: 60, minHeight: 42 }}
            onClick={() => onSelect(lang.code)}
          >
            {lang.nativeName}
            {isActive && (
              <span className="sr-only"> (selected)</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
