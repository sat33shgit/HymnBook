"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LyricsText } from "./LyricsText";
import type { FontSize, SongTranslation } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useCallback, useEffect } from "react";
import { useTheme } from "next-themes";


interface FullscreenReaderProps {
  isOpen: boolean;
  onClose: () => void;
  translations: SongTranslation[];
  activeLanguage: string;
  showEnglishTranslation: boolean;
  fontSize: FontSize;
}

export function FullscreenReader({
  isOpen,
  onClose,
  translations,
  activeLanguage,
  showEnglishTranslation,
  fontSize,
}: FullscreenReaderProps) {
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const activeTranslation = translations.find((t) => t.languageCode === activeLanguage);
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
        // Native fullscreen was exited by the user — close the reader.
        onCloseRef.current();
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
  }, [isOpen]);

  const handleClose = useCallback(() => {
    const exit =
      (document as any).exitFullscreen ||
      (document as any).webkitExitFullscreen ||
      (document as any).msExitFullscreen;
    const fsElem =
      (document as any).fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).msFullscreenElement;

    if (exit && fsElem) {
      // Exiting native fullscreen will fire fullscreenchange → onCloseRef
      try {
        (exit as Function).call(document);
      } catch {
        onClose();
      }
    } else {
      onClose();
    }
  }, [onClose]);

  // Swipe-to-change-language removed for fullscreen mode.

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
        
        role="dialog"
        aria-modal="true"
        aria-label={`Fullscreen reader`}
      >
        {/* Compact overlay close button (no top bar) */}
        <div className="pointer-events-none">
          <div className="absolute top-3 right-3 z-20 pointer-events-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              aria-label="Exit fullscreen"
              className={`${topControlButtonClass} rounded-full p-1 shadow-sm ${isDark ? "bg-black/60" : "bg-white/90"}`}
              style={{ color: isDark ? "#fff" : "#000" }}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>


        {/* Lyrics */}
        <div className="flex-1 overflow-y-auto px-6 pt-0 pb-6">
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
