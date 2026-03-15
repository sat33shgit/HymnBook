"use client";

import { X, Sun, Moon, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageTabs } from "./LanguageTabs";
import { LyricsText } from "./LyricsText";
import type { FontSize, SongTranslation } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState, useCallback } from "react";

const SIZES: FontSize[] = ["S", "M", "L", "XL"];

interface FullscreenReaderProps {
  isOpen: boolean;
  onClose: () => void;
  translations: SongTranslation[];
  languages: { code: string; nativeName: string }[];
  activeLanguage: string;
  onLanguageChange: (code: string) => void;
  title: string;
}

export function FullscreenReader({
  isOpen,
  onClose,
  translations,
  languages,
  activeLanguage,
  onLanguageChange,
  title,
}: FullscreenReaderProps) {
  const [bgMode, setBgMode] = useState<"white" | "black">("white");
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("hymnbook_fs_fontsize") as FontSize) || "M";
    }
    return "M";
  });
  const startXRef = useRef(0);

  const activeTranslation = translations.find(
    (t) => t.languageCode === activeLanguage
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("hymnbook_fs_fontsize", fontSize);
    }
  }, [fontSize]);

  const cycleFontSize = useCallback((direction: "up" | "down") => {
    setFontSize((prev) => {
      const idx = SIZES.indexOf(prev);
      if (direction === "up" && idx < SIZES.length - 1) return SIZES[idx + 1];
      if (direction === "down" && idx > 0) return SIZES[idx - 1];
      return prev;
    });
  }, []);

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

  const isDark = bgMode === "black";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setBgMode(isDark ? "white" : "black")}
              aria-label={`Switch to ${isDark ? "light" : "dark"} background`}
              style={{ color: isDark ? "#fff" : "#000" }}
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => cycleFontSize("down")}
                aria-label="Decrease font size"
                style={{ color: isDark ? "#fff" : "#000" }}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center text-sm font-medium">{fontSize}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => cycleFontSize("up")}
                aria-label="Increase font size"
                style={{ color: isDark ? "#fff" : "#000" }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Exit fullscreen"
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
                <LyricsText
                  lyrics={activeTranslation.lyrics}
                  fontSize={fontSize}
                  languageCode={activeLanguage}
                />
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
