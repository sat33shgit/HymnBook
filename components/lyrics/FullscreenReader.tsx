"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LanguageTabs } from "./LanguageTabs";
import { LyricsText } from "./LyricsText";
import type { FontSize, SongTranslation } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useCallback, useEffect } from "react";
import { useTheme } from "next-themes";


interface FullscreenReaderProps {
  isOpen: boolean;
  onClose: () => void;
  translations: SongTranslation[];
  languages: { code: string; nativeName: string }[];
  activeLanguage: string;
  onLanguageChange: (code: string) => void;
  title: string;
  showEnglishTranslation: boolean;
  onToggleEnglishTranslation: (value: boolean) => void;
  fontSize: FontSize;
}

export function FullscreenReader({
  isOpen,
  onClose,
  translations,
  languages,
  activeLanguage,
  onLanguageChange,
  title,
  showEnglishTranslation,
  onToggleEnglishTranslation,
  fontSize,
}: FullscreenReaderProps) {
  const { resolvedTheme } = useTheme();
  const startXRef = useRef(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const activeTranslation = translations.find(
    (t) => t.languageCode === activeLanguage
  );
  const englishMeaning = activeTranslation?.englishMeaning?.trim() ?? "";
  const canShowEnglishTranslation =
    activeLanguage !== "en" && englishMeaning.length > 0;
  const showEnglishInPlace = canShowEnglishTranslation && showEnglishTranslation;

  // Fullscreen uses the `fontSize` passed from normal mode; no local size controls.

  // Request native fullscreen when the reader opens. Exit on close or when
  // the user exits fullscreen (listen to fullscreenchange).
  useEffect(() => {
    if (!isOpen) return;

    const el = containerRef.current ?? document.documentElement;

    const request =
      (el as any).requestFullscreen ||
      (el as any).webkitRequestFullscreen ||
      (el as any).msRequestFullscreen;

    if (request) {
      try {
        // Try to enter native fullscreen; may fail if browser disallows.
        (request as Function).call(el);
      } catch (e) {
        // ignore errors (will remain in-app fullscreen)
      }
    }

    const onFsChange = () => {
      const fsElem = (document as any).fullscreenElement || (document as any).webkitFullscreenElement || (document as any).msFullscreenElement;
      if (!fsElem) {
        // If native fullscreen was exited by the user, close the reader.
        onClose();
      }
    };

    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange as EventListener);

    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange as EventListener);

      const exit = (document as any).exitFullscreen || (document as any).webkitExitFullscreen || (document as any).msExitFullscreen;
      if (exit && ((document as any).fullscreenElement || (document as any).webkitFullscreenElement || (document as any).msFullscreenElement)) {
        try {
          (exit as Function).call(document);
        } catch (e) {
          // ignore
        }
      }
    };
  }, [isOpen, onClose]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const diff = startXRef.current - endX;
      if (Math.abs(diff) > 50) {
        const currentIdx = languages.findIndex((l) => l.code === activeLanguage);
        if (diff > 0 && currentIdx < languages.length - 1) {
          onLanguageChange(languages[currentIdx + 1].code);
        } else if (diff < 0 && currentIdx > 0) {
          onLanguageChange(languages[currentIdx - 1].code);
        }
      }
    },
    [activeLanguage, languages, onLanguageChange]
  );

  if (!isOpen) return null;

  const isDark = resolvedTheme === "dark";
  const topControlButtonClass = isDark
    ? "bg-transparent hover:bg-white/10 active:bg-white/15"
    : "bg-transparent hover:bg-black/10 active:bg-black/15";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        ref={containerRef}
        className="fixed inset-0 z-[9999] flex flex-col"
        style={{
          backgroundColor: isDark ? "#000" : "#fff",
          color: isDark ? "#fff" : "#000",
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        role="dialog"
        aria-modal="true"
        aria-label={`Fullscreen reader: ${title}`}
      >
        {/* Top controls */}
        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: isDark ? "#333" : "#e5e5e5" }}>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium">{title}</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Exit fullscreen"
            className={topControlButtonClass}
            style={{ color: isDark ? "#fff" : "#000" }}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Language tabs */}
        <div className="border-b px-4 py-2" style={{ borderColor: isDark ? "#333" : "#e5e5e5" }}>
          <LanguageTabs
            languages={languages}
            activeLanguage={activeLanguage}
            onSelect={onLanguageChange}
          />

          {canShowEnglishTranslation && (
            <div className="mt-3 flex items-center gap-3">
              <Switch
                checked={showEnglishTranslation}
                onCheckedChange={onToggleEnglishTranslation}
                aria-label="Show English Text"
              />
              <span className="text-sm opacity-80">Show English Text</span>
            </div>
          )}
        </div>

        {/* Lyrics */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeLanguage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              role="tabpanel"
              id={`lyrics-panel-${activeLanguage}`}
              aria-labelledby={`lang-tab-${activeLanguage}`}
            >
              {activeTranslation ? (
                  <div className="space-y-3">
                    {showEnglishInPlace && (
                      <p className="text-xs font-medium uppercase tracking-wide opacity-70">
                        Text In English
                      </p>
                    )}
                  <LyricsText
                      lyrics={showEnglishInPlace ? englishMeaning : activeTranslation.lyrics}
                    fontSize={fontSize}
                      languageCode={showEnglishInPlace ? "en" : activeLanguage}
                  />
                </div>
              ) : (
                <p className="text-center opacity-50">
                  No lyrics available for this language.
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
