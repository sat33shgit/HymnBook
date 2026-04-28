"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Search as SearchIcon, Mic as MicIcon } from "lucide-react";
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
  const [isListening, setIsListening] = React.useState(false);
  const recognitionRef = React.useRef<SpeechRecognition | null>(null);

  // Keep unused prop referenced to avoid linter warnings for props we may not
  // always use in some environments.
  void voiceLang;

  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (!autoFocus) return;
    try {
      const mql = window.matchMedia('(min-width: 768px)');
      if (mql.matches) {
        inputRef.current?.focus();
      }
    } catch (e) {
      // matchMedia may not be available in some environments; if so, don't focus
    }
  }, [autoFocus]);

  React.useEffect(() => {
    return () => {
      try {
        if (recognitionRef.current) {
          recognitionRef.current.onresult = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.stop();
          recognitionRef.current = null;
        }
      } catch (e) {
        // ignore cleanup errors
      }
    };
  }, []);

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
          ref={inputRef}
          className={cn(
            "h-11 rounded-[1.2rem] border-[var(--desktop-panel-border)] bg-[var(--desktop-panel)] pl-10 text-[0.95rem] text-foreground shadow-[0_14px_30px_rgba(15,23,42,0.08)] placeholder:text-[0.84rem] placeholder:text-[var(--desktop-nav-muted)] md:h-14 md:rounded-[1.45rem] md:pl-11 md:text-base md:placeholder:text-[0.95rem] dark:shadow-[0_14px_30px_rgba(2,6,23,0.24)]",
            // add right padding so the microphone button doesn't overlap text
            "pr-12 md:pr-14"
          )}
          aria-label="Search songs"
        />
        {/* Microphone button: toggles SpeechRecognition and reports candidates */}
        <button
          type="button"
          data-slot="tooltip-trigger"
          aria-pressed={isListening}
          aria-label={isListening ? "Stop voice search" : "Start voice search"}
            onClick={() => {
            if (isListening) {
              try {
                recognitionRef.current?.stop();
              } catch (e) {
                // ignore
              }
              setIsListening(false);
              return;
            }
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (!SpeechRecognition) {
              // Not supported in this browser
              return;
            }

            try {
              const rec = new SpeechRecognition();
              rec.lang = voiceLang ?? (navigator.language || "en-US");
              rec.interimResults = false;
              rec.continuous = false;
              // request some alternatives where supported
              try {
                rec.maxAlternatives = 5;
              } catch {
                // some implementations may not allow setting this
              }

              rec.onstart = () => {
                setIsListening(true);
              };

              rec.onend = () => {
                setIsListening(false);
              };

              rec.onerror = (ev: any) => {
                setIsListening(false);
              };

              rec.onresult = (ev: any) => {
                const candidates: string[] = [];
                try {
                  for (let i = 0; i < ev.results.length; i++) {
                    const result = ev.results[i];
                    for (let j = 0; j < result.length; j++) {
                      const t = (result[j]?.transcript || "").trim();
                      if (t) candidates.push(t);
                    }
                  }
                } catch {
                  // fallback to first transcript
                  const first = ev.results?.[0]?.[0]?.transcript;
                  if (first) candidates.push(first.trim());
                }

                const unique = Array.from(new Set(candidates)).filter(Boolean);
                if (unique.length === 0) {
                  const first = ev.results?.[0]?.[0]?.transcript;
                  if (first) unique.push(first.trim());
                }

                if (unique.length > 0) {
                  onVoiceResult?.(unique);
                }
              };

              recognitionRef.current = rec;
              rec.start();
            } catch (err) {
              // Failed to start speech recognition
              setIsListening(false);
            }
            }}
          className={"absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-full text-[var(--desktop-nav-muted)] hover:text-foreground"}
        >
          <span className={cn(isListening ? "text-rose-600" : "text-[var(--desktop-nav-muted)]")}>
            <MicIcon className="h-4 w-4 md:h-5 md:w-5" />
          </span>
          {isListening ? <span className="sr-only">Listening</span> : null}
        </button>
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
