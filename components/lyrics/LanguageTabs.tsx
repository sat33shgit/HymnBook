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
      className="scrollbar-hide flex gap-2 overflow-x-auto"
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
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            style={{ minWidth: 44, minHeight: 44 }}
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
