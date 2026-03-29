"use client";

import { Search as SearchIcon, Mic, MicOff, AudioLines } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";

function subscribeToClientRender() {
  return () => {};
}

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
  const [showSpeakNow, setShowSpeakNow] = useState(false);
  const pointerStartedRef = useRef(false);
  const speakNowTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isClient = useSyncExternalStore(subscribeToClientRender, () => true, () => false);

  useEffect(() => {
    return () => {
      if (speakNowTimerRef.current) {
        clearTimeout(speakNowTimerRef.current);
      }
    };
  }, []);

  const { state, isSupported, errorMessage, start, stop } = useVoiceSearch({
    onResult: (candidates) => {
      if (candidates[0]) {
        onChange(candidates[0]);
      }

      onVoiceResult?.(candidates);
    },
    lang: voiceLang,
  });

  const isListening = state === "listening";
  const isError = state === "error";

  const showVoicePrompt = showSpeakNow || isListening;

  const showSpeakNowPrompt = () => {
    setShowSpeakNow(true);

    if (speakNowTimerRef.current) {
      clearTimeout(speakNowTimerRef.current);
    }

    speakNowTimerRef.current = setTimeout(() => {
      setShowSpeakNow(false);
    }, 300);
  };

  const handlePointerDown = () => {
    if (isListening) {
      return;
    }

    pointerStartedRef.current = true;
    showSpeakNowPrompt();
    start();
  };

  const handleClick = () => {
    if (pointerStartedRef.current) {
      pointerStartedRef.current = false;
      return;
    }

    if (isListening) {
      stop();
      return;
    }

    showSpeakNowPrompt();
    start();
  };

  const handleSubmit = () => {
    const trimmedValue = value.trim();
    if (!trimmedValue) return;
    onSubmit?.(trimmedValue);
  };

  return (
    <div className={className}>
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--desktop-nav-muted)]" />
        <Input
          type="search"
          placeholder={isListening ? "Listening..." : placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            }
          }}
          className={cn(
            "h-14 rounded-[1.45rem] border-[var(--desktop-panel-border)] bg-[var(--desktop-panel)] pl-11 text-base text-foreground shadow-[0_14px_30px_rgba(15,23,42,0.08)] placeholder:text-[0.95rem] placeholder:text-[var(--desktop-nav-muted)] dark:shadow-[0_14px_30px_rgba(2,6,23,0.24)]",
            isClient && isSupported ? "pr-14" : "pr-4"
          )}
          autoFocus={autoFocus}
          aria-label="Search songs"
        />
        {isClient && isSupported && (
          <Tooltip>
            <TooltipTrigger
              onPointerDown={handlePointerDown}
              onClick={handleClick}
              data-slot="tooltip-trigger"
              className={cn(
                "absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-[1rem] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                showVoicePrompt
                  ? "scale-105 bg-[var(--desktop-panel-soft)] text-[var(--desktop-chip-hover-foreground)] shadow-[0_10px_22px_rgba(15,23,42,0.12)] ring-4 ring-[var(--desktop-chip-hover-border)]/35"
                  : isError
                  ? "text-destructive"
                  : "text-[var(--desktop-nav-muted)] hover:bg-[var(--desktop-chip)] hover:text-foreground active:text-foreground",
                isListening && "animate-pulse",
              )}
              aria-label={isListening ? "Stop voice input" : "Start voice search"}
            >
              {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </TooltipTrigger>
            <TooltipContent>
              {isError ? errorMessage : isListening ? "Listening... tap to stop" : "Search by voice"}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {(showVoicePrompt || suggestedQuery) && (
        <div className="mt-2 min-h-12 text-left text-[0.88rem]">
          {showVoicePrompt && (
            <div
              className={cn(
                "flex items-start gap-3 rounded-[1.2rem] border px-3 py-3",
                showSpeakNow
                  ? "border-[var(--desktop-chip-hover-border)] bg-[var(--desktop-panel-soft)] text-[var(--desktop-chip-hover-foreground)]"
                  : "border-[var(--desktop-panel-border)] bg-[var(--desktop-panel)] text-foreground",
              )}
              aria-live="polite"
            >
              <div className="relative mt-0.5 flex h-5 w-5 items-center justify-center">
                <span
                  className={cn(
                    "absolute inline-flex h-4 w-4 rounded-full",
                    showSpeakNow ? "animate-ping bg-primary/25" : "bg-primary/15",
                  )}
                />
                <AudioLines className="relative h-4 w-4" />
              </div>
              <div className="leading-tight">
                <p className="text-[0.95rem] font-semibold">
                  {showSpeakNow ? "Speak now" : "Listening..."}
                </p>
                <p className="text-[0.78rem] text-[var(--desktop-nav-muted)]">
                  {showSpeakNow
                    ? "Say the song title, a lyric line, or the language."
                    : "Keep speaking naturally. Tap the mic again to stop."}
                </p>
              </div>
            </div>
          )}
          {!showVoicePrompt && suggestedQuery && (
            <button
              type="button"
              onClick={() => onSuggestedQuerySelect?.(suggestedQuery)}
              className="rounded-[1.2rem] border border-[var(--desktop-panel-border)] bg-[var(--desktop-panel)] px-3 py-2 text-[0.88rem] text-[var(--desktop-nav-muted)] transition-colors hover:border-[var(--desktop-chip-hover-border)] hover:text-[var(--desktop-chip-hover-foreground)]"
            >
              Did you mean{" "}
              <span className="font-medium text-[var(--desktop-chip-hover-foreground)]">
                {suggestedQuery}
              </span>
              ?
            </button>
          )}
        </div>
      )}
    </div>
  );
}
