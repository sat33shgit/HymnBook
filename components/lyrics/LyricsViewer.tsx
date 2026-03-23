"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Heart, Share2, Maximize2, Copy, Mail } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LanguageTabs } from "./LanguageTabs";
import { LyricsText } from "./LyricsText";
import { FullscreenReader } from "./FullscreenReader";
import { useFavorites } from "@/hooks/useFavorites";
import type { SongTranslation, FontSize } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

const SIZES: FontSize[] = ["S", "M", "L", "XL"];

interface LyricsViewerProps {
  songId: number;
  songSlug: string;
  translations: SongTranslation[];
  languages: { code: string; nativeName: string }[];
  defaultLang?: string;
  initialLang?: string;
  showAudio?: boolean;
}

export function LyricsViewer({
  songId,
  songSlug,
  translations,
  languages,
  defaultLang = "en",
  initialLang,
  showAudio = true,
}: LyricsViewerProps) {
  const [activeLanguage, setActiveLanguage] = useState(
    initialLang ?? defaultLang
  );
  const [fontSize, setFontSize] = useState<FontSize>("M");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [showEnglishTranslation, setShowEnglishTranslation] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(songId);
  const audioRef = useRef<HTMLAudioElement>(null);

  const activeTranslation = translations.find(
    (t) => t.languageCode === activeLanguage
  );
  const activeAudioUrl = activeTranslation?.audioUrl ?? null;
  const streamAudioUrl = activeAudioUrl
    ? `/api/songs/audio/stream?url=${encodeURIComponent(activeAudioUrl)}`
    : null;
  const englishMeaning = activeTranslation?.englishMeaning?.trim() ?? "";
  const canShowEnglishTranslation =
    activeLanguage !== "en" && englishMeaning.length > 0;
  const showEnglishInPlace = canShowEnglishTranslation && showEnglishTranslation;

  const currentTitle = activeTranslation?.title ?? translations[0]?.title ?? "";

  useEffect(() => {
    const viewKey = `song-viewed:${songId}`;
    if (sessionStorage.getItem(viewKey) === "1") return;

    fetch(`/api/songs/${songId}/view`, {
      method: "POST",
      cache: "no-store",
      keepalive: true,
    }).catch(() => {
      // Ignore view-tracking failures
    });

    sessionStorage.setItem(viewKey, "1");
  }, [songId]);

  // Ensure the page is scrolled to the top when a song page mounts
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        window.scrollTo({ top: 0, left: 0 });
      } catch {
        // ignore
      }
    }
  }, []);

  // Update URL when language changes
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("lang", activeLanguage);
    window.history.replaceState({}, "", url.toString());
  }, [activeLanguage]);

  const stopAudio = useCallback(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;
    audioElement.pause();
    audioElement.currentTime = 0;
  }, []);

  const handleLanguageChange = useCallback((code: string) => {
    stopAudio();
    setActiveLanguage(code);
    if (code === "en") {
      setShowEnglishTranslation(false);
    }
  }, [stopAudio]);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/songs/${songSlug}?lang=${activeLanguage}`
      : "";

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: currentTitle,
          text: "Check out this song on HymnBook",
          url: shareUrl,
        });
      } catch {
        // user cancelled
      }
    } else {
      setShareOpen(true);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard!");
    setShareOpen(false);
  };

  return (
    <div>
      {showAudio && activeAudioUrl && (
        <div className="mb-4 rounded-md border bg-muted/20 p-3">
          <audio
            ref={audioRef}
            controls
            preload="none"
            src={streamAudioUrl ?? undefined}
            controlsList="nodownload noplaybackrate noremoteplayback"
            className="song-audio-player w-full"
          />
        </div>
      )}

      {/* Language tabs */}
      <LanguageTabs
        languages={languages}
        activeLanguage={activeLanguage}
        onSelect={handleLanguageChange}
      />

      {/* Font size controls */}
      <div className="mt-4 flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Size:</span>
        {SIZES.map((s) => (
          <Button
            key={s}
            variant={fontSize === s ? "default" : "outline"}
            size="sm"
            className="h-7 w-7 p-0 text-xs"
            onClick={() => setFontSize(s)}
            aria-label={`Font size ${s}`}
          >
            {s}
          </Button>
        ))}
      </div>

      {canShowEnglishTranslation && (
        <div className="mt-4 flex items-center gap-3 rounded-md border bg-muted/20 px-3 py-2">
          <Switch
            checked={showEnglishTranslation}
            onCheckedChange={setShowEnglishTranslation}
            aria-label="Show English Text"
          />
          <span className="text-sm text-foreground">Show English Text</span>
        </div>
      )}

      {/* Lyrics content */}
      <div className="mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeLanguage}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            role="tabpanel"
            id={`lyrics-panel-${activeLanguage}`}
            aria-labelledby={`lang-tab-${activeLanguage}`}
          >
            {activeTranslation ? (
              <div className="space-y-3">
                {showEnglishInPlace && (
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
              <p className="py-12 text-center text-muted-foreground">
                No lyrics available for this language.
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action bar - desktop */}
      <div className="mt-8 hidden items-center gap-3 border-t pt-4 md:flex">
        <Button
          variant="ghost"
          onClick={() => toggleFavorite(songId)}
          aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
          className="gap-2"
        >
          <Heart
            className={`h-5 w-5 ${
              favorited ? "fill-[var(--gold)] text-[var(--gold)]" : ""
            }`}
          />
          <span className="text-base font-medium">{favorited ? "Saved" : "Favorite"}</span>
        </Button>
        <Button variant="ghost" onClick={handleShare} className="gap-2">
          <Share2 className="h-5 w-5" />
          <span className="text-base font-medium">Share</span>
        </Button>
        <Button
          variant="ghost"
          onClick={() => setIsFullscreen(true)}
          className="gap-2"
        >
          <Maximize2 className="h-5 w-5" />
          <span className="text-base font-medium">Fullscreen</span>
        </Button>
      </div>

      {/* Action bar - mobile (bottom fixed) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t bg-background py-2 md:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleFavorite(songId)}
          className="flex-col gap-0.5 h-auto py-1.5"
          aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart
            className={`h-5 w-5 ${
              favorited ? "fill-[var(--gold)] text-[var(--gold)]" : ""
            }`}
          />
          <span className="text-xs font-medium">{favorited ? "Saved" : "Favorite"}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleShare}
          className="flex-col gap-0.5 h-auto py-1.5"
        >
          <Share2 className="h-5 w-5" />
          <span className="text-xs font-medium">Share</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsFullscreen(true)}
          className="flex-col gap-0.5 h-auto py-1.5"
        >
          <Maximize2 className="h-5 w-5" />
          <span className="text-xs font-medium">Fullscreen</span>
        </Button>
      </div>

      {/* Fullscreen reader */}
      <FullscreenReader
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        translations={translations}
        activeLanguage={activeLanguage}
        showEnglishTranslation={showEnglishTranslation}
        fontSize={fontSize}
      />

      {/* Share dialog (fallback) */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share this song</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-2">
            <Button variant="outline" onClick={copyLink} className="justify-start gap-2">
              <Copy className="h-4 w-4" />
              Copy link
            </Button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `${currentTitle} - ${shareUrl}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline", className: "justify-start gap-2" })}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </a>
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(currentTitle)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline", className: "justify-start gap-2" })}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              Telegram
            </a>
            <a
              href={`mailto:?subject=${encodeURIComponent(
                `${currentTitle} | HymnBook`
              )}&body=${encodeURIComponent(
                `Check out this song: ${shareUrl}`
              )}`}
              className={buttonVariants({ variant: "outline", className: "justify-start gap-2" })}
            >
              <Mail className="h-4 w-4" />
              Email
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
