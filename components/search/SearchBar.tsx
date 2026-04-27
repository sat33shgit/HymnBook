"use client";

import { Search as SearchIcon } from "lucide-react";
import React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  onVoiceResult?: (candidates: string[]) => void;
  suggestedQuery?: string | null;
  onSuggestedQuerySelect?: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  voiceLang?: string;
}

export function SearchBar({
  value,
  onChange,
  onSubmit,
  onVoiceResult,
  suggestedQuery,
  onSuggestedQuerySelect,
  placeholder = "Search songs, titles, language...",
  className = "",
  autoFocus = false,
  voiceLang,
}: SearchBarProps) {
  // Voice/microphone support removed from SearchBar to avoid platform-specific
  // issues. The input remains text-only and suggested-query selection is kept.
  // Keep unused props referenced to avoid linter warnings and preserve
  // public component API.
  void onVoiceResult;
  void voiceLang;

  const handleSubmit = () => {
    const trimmedValue = value.trim();
    if (!trimmedValue) return;
    onSubmit?.(trimmedValue);
  };

  return (
    <div className={className}>
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--desktop-nav-muted)] md:left-4 md:h-5 md:w-5" />
        <Input
          type="search"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            }
          }}
          className={cn(
            "h-11 rounded-[1.2rem] border-[var(--desktop-panel-border)] bg-[var(--desktop-panel)] pl-10 text-[0.95rem] text-foreground shadow-[0_14px_30px_rgba(15,23,42,0.08)] placeholder:text-[0.84rem] placeholder:text-[var(--desktop-nav-muted)] md:h-14 md:rounded-[1.45rem] md:pl-11 md:text-base md:placeholder:text-[0.95rem] dark:shadow-[0_14px_30px_rgba(2,6,23,0.24)]",
            "pr-3.5 md:pr-4"
          )}
          autoFocus={autoFocus}
          aria-label="Search songs"
        />
        {/* Microphone UI removed */}
      </div>
      {suggestedQuery && (
        <div className="mt-2 min-h-10 text-left text-[0.82rem] md:min-h-12 md:text-[0.88rem]">
          <button
            type="button"
            onClick={() => onSuggestedQuerySelect?.(suggestedQuery)}
            className="rounded-[1rem] border border-[var(--desktop-panel-border)] bg-[var(--desktop-panel)] px-2.5 py-1.5 text-[0.8rem] text-[var(--desktop-nav-muted)] transition-colors hover:border-[var(--desktop-chip-hover-border)] hover:text-[var(--desktop-chip-hover-foreground)] md:rounded-[1.2rem] md:px-3 md:py-2 md:text-[0.88rem]"
          >
            Did you mean{" "}
            <span className="font-medium text-[var(--desktop-chip-hover-foreground)]">
              {suggestedQuery}
            </span>
            ?
          </button>
        </div>
      )}
    </div>
  );
}
