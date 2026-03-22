"use client";

import { Search, Mic, MicOff, AudioLines } from "lucide-react";
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
  onVoiceResult,
  suggestedQuery,
  onSuggestedQuerySelect,
  placeholder = "Search songs, lyrics, titles...",
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

  return (
    <div className={className}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder={isListening ? "Listening…" : placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn("pl-10 bg-[var(--card-surface)]", isClient && isSupported ? "pr-12" : "pr-4")}
          autoFocus={autoFocus}
          aria-label="Search songs"
        />
        {isClient && isSupported && (
          <Tooltip>
            <TooltipTrigger
              onPointerDown={handlePointerDown}
              onClick={handleClick}
              className={cn(
                "absolute right-1 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                showVoicePrompt
                  ? "scale-105 bg-primary/10 text-primary shadow-sm ring-4 ring-primary/15"
                  : isError
                  ? "text-destructive"
                  : "text-muted-foreground hover:text-foreground active:text-foreground",
                isListening && "animate-pulse",
              )}
              aria-label={isListening ? "Stop voice input" : "Start voice search"}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </TooltipTrigger>
            <TooltipContent>
              {isError ? errorMessage : isListening ? "Listening… tap to stop" : "Search by voice"}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {(showVoicePrompt || suggestedQuery) && (
        <div className="mt-2 min-h-12 text-left text-sm">
          {showVoicePrompt && (
            <div
              className={cn(
                "flex items-start gap-3 rounded-lg border px-3 py-2",
                showSpeakNow
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-primary/20 bg-primary/5 text-foreground",
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
                <p className="font-semibold">
                  {showSpeakNow ? "Speak now" : "Listening..."}
                </p>
                <p className="text-xs text-muted-foreground">
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
              className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-muted-foreground transition-colors hover:text-primary"
            >
              Did you mean <span className="font-medium text-primary">{suggestedQuery}</span>?
            </button>
          )}
        </div>
      )}
    </div>
  );
}
