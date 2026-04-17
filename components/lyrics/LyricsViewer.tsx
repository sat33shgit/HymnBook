"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Heart,
  Mail,
  Maximize2,
  Share2,
  Volume2,
  Youtube,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { publicSiteTitle } from "@/lib/site";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/useFavorites";
import type { FontSize, SongTranslation } from "@/types";
import { FullscreenReader } from "./FullscreenReader";
import { LanguageTabs } from "./LanguageTabs";
import { LyricsText } from "./LyricsText";

const SIZES: FontSize[] = ["S", "M", "L", "XL"];

function formatViewCount(value: number | null | undefined) {
  return new Intl.NumberFormat("en-US").format(value ?? 0);
}

function getCompactLanguageBadge(language: {
  code: string;
  nativeName: string;
}) {
  const trimmedName = language.nativeName.trim();

  if (trimmedName.length > 0 && trimmedName.length <= 4) {
    return trimmedName;
  }

  return language.code.toUpperCase();
}

interface LyricsViewerProps {
  songId: number;
  songSlug: string;
  translations: SongTranslation[];
  languages: { code: string; nativeName: string }[];
  defaultLang?: string;
  initialLang?: string;
  showAudio?: boolean;
  songCategory?: string | null;
  songViewCount?: number | null;
}

export function LyricsViewer({
  songId,
  songSlug,
  translations,
  languages,
  defaultLang = "en",
  initialLang,
  showAudio = true,
  songCategory,
  songViewCount,
}: LyricsViewerProps) {
  const router = useRouter();
  const [activeLanguage, setActiveLanguage] = useState(initialLang ?? defaultLang);
  const [fontSize, setFontSize] = useState<FontSize>("M");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [showEnglishTranslation, setShowEnglishTranslation] = useState(false);
  const [youtubeVisible, setYoutubeVisible] = useState<boolean | null>(null);
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(songId);
  const mobileAudioRef = useRef<HTMLAudioElement>(null);
  const desktopAudioRef = useRef<HTMLAudioElement>(null);

  const fallbackLanguage =
    translations.find((translation) => translation.languageCode === defaultLang)?.languageCode ??
    translations[0]?.languageCode ??
    "en";

  const resolvedActiveLanguage = translations.some(
    (translation) => translation.languageCode === activeLanguage
  )
    ? activeLanguage
    : fallbackLanguage;

  const activeTranslation = translations.find(
    (translation) => translation.languageCode === resolvedActiveLanguage
  );
  const activeAudioUrl = activeTranslation?.audioUrl ?? null;
  const streamAudioUrl = activeAudioUrl
    ? `/api/songs/audio/stream?url=${encodeURIComponent(activeAudioUrl)}`
    : null;
  const englishMeaning = activeTranslation?.englishMeaning?.trim() ?? "";
  const canShowEnglishTranslation =
    resolvedActiveLanguage !== "en" && englishMeaning.length > 0;
  const showEnglishInPlace = canShowEnglishTranslation && showEnglishTranslation;
  const currentTitle = activeTranslation?.title ?? translations[0]?.title ?? "";
  const activeLanguageLabel =
    languages.find((language) => language.code === resolvedActiveLanguage)?.nativeName ??
    resolvedActiveLanguage.toUpperCase();
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/songs/${songSlug}?lang=${resolvedActiveLanguage}`
      : "";

  useEffect(() => {
    if (typeof document === "undefined") return;

    try {
      if (currentTitle) {
        document.title = `${currentTitle} | ${publicSiteTitle}`;
      }

      const headerEl = document.getElementById(`song-title-${songId}`);
      if (headerEl && currentTitle) {
        headerEl.textContent = currentTitle;
      }
    } catch {
      // Ignore DOM update failures.
    }
  }, [currentTitle, songId]);

  useEffect(() => {
    const viewKey = `song-viewed:${songId}`;
    if (sessionStorage.getItem(viewKey) === "1") return;

    fetch(`/api/songs/${songId}/view`, {
      method: "POST",
      cache: "no-store",
      keepalive: true,
    }).catch(() => {
      // Ignore view-tracking failures.
    });

    sessionStorage.setItem(viewKey, "1");
  }, [songId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      window.scrollTo({ top: 0, left: 0 });
    } catch {
      // Ignore scroll failures.
    }
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("lang", resolvedActiveLanguage);
    window.history.replaceState({}, "", url.toString());
  }, [resolvedActiveLanguage]);

  useEffect(() => {
    let mounted = true;

    fetch("/api/admin/site-settings/youtube-visibility")
      .then((response) => response.json())
      .then((data) => {
        if (!mounted) return;

        if (data && typeof data.visible === "boolean") {
          setYoutubeVisible(data.visible);
          return;
        }

        setYoutubeVisible(false);
      })
      .catch(() => {
        if (mounted) {
          setYoutubeVisible(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const stopAudio = useCallback(() => {
    [mobileAudioRef.current, desktopAudioRef.current].forEach((audioElement) => {
      if (!audioElement) return;
      audioElement.pause();
      audioElement.currentTime = 0;
    });
  }, []);

  const handleLanguageChange = useCallback(
    (code: string) => {
      stopAudio();
      setActiveLanguage(code);

      if (code === "en") {
        setShowEnglishTranslation(false);
      }
    },
    [stopAudio]
  );

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: currentTitle,
          text: `Check out this song on ${publicSiteTitle}`,
          url: shareUrl,
        });
      } catch {
        // User cancelled native share.
      }
    } else {
      setShareOpen(true);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/search");
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard!");
    setShareOpen(false);
  };

  return (
    <div>
      <div className="space-y-4 overflow-x-hidden max-w-full md:hidden">
        <section className="rounded-[1.7rem] border border-[var(--desktop-panel-border)] bg-[var(--desktop-panel)] p-3.5 shadow-[0_18px_38px_rgba(15,23,42,0.08)] dark:shadow-[0_18px_38px_rgba(2,6,23,0.28)]">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="h-9 rounded-full border border-[var(--desktop-chip-border)] bg-[var(--desktop-panel-soft)] px-3 text-[0.8rem] font-semibold text-[var(--desktop-chip-foreground)] hover:bg-[var(--desktop-chip)]"
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Back
            </Button>
            <span className="rounded-full bg-[var(--desktop-chip)] px-2.5 py-1 text-[0.74rem] font-semibold text-[var(--desktop-chip-foreground)]">
              {activeLanguageLabel}
            </span>
          </div>

          {showAudio && activeAudioUrl && (
            <div className="mt-3.5 rounded-[1.2rem] border border-[var(--desktop-panel-border)] bg-[var(--desktop-panel-soft)] p-2.5">
              <div className="mb-2.5 flex items-center gap-2 text-[0.76rem] font-semibold text-[var(--desktop-chip-foreground)]">
                <Volume2 className="h-3.5 w-3.5" />
                Audio
              </div>
              <audio
                ref={mobileAudioRef}
                controls
                preload="none"
                src={streamAudioUrl ?? undefined}
                controlsList="nodownload noplaybackrate noremoteplayback"
                className="song-audio-player w-full"
              />
            </div>
          )}

          {youtubeVisible === true && activeTranslation?.youtubeUrl && (
            <a
              href={activeTranslation.youtubeUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3.5 inline-flex h-9 items-center rounded-full border border-[var(--desktop-chip-border)] bg-[var(--desktop-chip)] px-3.5 text-[0.8rem] font-semibold text-[var(--desktop-chip-foreground)] transition-all hover:border-[var(--desktop-chip-hover-border)] hover:bg-[var(--desktop-chip-hover)] hover:text-[var(--desktop-chip-hover-foreground)]"
            >
              <Youtube className="mr-1.5 h-3.5 w-3.5" />
              Watch on YouTube
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </a>
          )}

          <div className="mt-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--desktop-nav-muted)]">
              Select language
            </p>
            <div className="mt-2.5">
              <LanguageTabs
                languages={languages}
                activeLanguage={resolvedActiveLanguage}
                onSelect={handleLanguageChange}
              />
            </div>
          </div>

          <div className="mt-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--desktop-nav-muted)]">
              Reader tools
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="text-[0.74rem] text-[var(--desktop-nav-muted)]">
                Size:
              </span>
              {SIZES.map((size) => (
                <Button
                  key={size}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 min-w-8 rounded-full border px-2.5 text-[0.74rem] font-semibold",
                    fontSize === size
                      ? "border-transparent bg-[var(--desktop-nav-active)] text-[var(--desktop-nav-active-foreground)]"
                      : "border-[var(--desktop-chip-border)] bg-[var(--desktop-panel)] text-[var(--desktop-chip-foreground)] hover:bg-[var(--desktop-chip)]",
                  )}
                  onClick={() => setFontSize(size)}
                  aria-label={`Font size ${size}`}
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>

          {canShowEnglishTranslation && (
            <div className="mt-4 flex items-center gap-2.5 rounded-[1rem] border border-[var(--desktop-panel-border)] bg-[var(--desktop-panel-soft)] px-3 py-2.5">
              <Switch
                checked={showEnglishTranslation}
                onCheckedChange={setShowEnglishTranslation}
                aria-label="Show English Text"
              />
              <span className="text-[0.8rem] font-medium text-foreground">
                Show English Text
              </span>
            </div>
          )}
        </section>

        <section className="overflow-x-hidden max-w-full rounded-[1.7rem] border border-[var(--desktop-panel-border)] bg-[var(--desktop-panel-soft)] p-4 shadow-[0_18px_38px_rgba(15,23,42,0.08)] dark:shadow-[0_18px_38px_rgba(2,6,23,0.28)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--desktop-nav-muted)]">
                Lyrics
              </p>
              <h2 className="mt-1.5 font-heading text-[1.3rem] font-semibold leading-[1.04] tracking-[-0.04em] text-foreground">
                Focused reader
              </h2>
              <p className="mt-2 text-[0.82rem] leading-6 text-[var(--desktop-nav-muted)]">
                Use the toolbar below to save, share, or go fullscreen.
              </p>
            </div>
            <span className="rounded-full bg-[var(--desktop-panel)] px-2.5 py-1 text-[0.74rem] font-semibold text-foreground shadow-[0_10px_20px_rgba(15,23,42,0.06)] dark:shadow-[0_10px_20px_rgba(2,6,23,0.18)]">
              {activeLanguageLabel}
            </span>
          </div>

          <div className="mt-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={resolvedActiveLanguage}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                role="tabpanel"
                id={`lyrics-panel-${resolvedActiveLanguage}`}
                aria-labelledby={`lang-tab-${resolvedActiveLanguage}`}
              >
                {activeTranslation ? (
                  <div className="space-y-3">
                    {showEnglishInPlace && (
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--desktop-nav-muted)]">
                        Text In English
                      </p>
                    )}
                    <LyricsText
                      lyrics={showEnglishInPlace ? englishMeaning : activeTranslation.lyrics}
                      fontSize={fontSize}
                      languageCode={showEnglishInPlace ? "en" : resolvedActiveLanguage}
                    />
                  </div>
                ) : (
                  <p className="py-10 text-center text-[0.82rem] text-[var(--desktop-nav-muted)]">
                    No lyrics available for this language.
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
      </div>

      <div className="hidden space-y-6 md:block">
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="h-11 rounded-full border border-[var(--desktop-panel-border)] bg-[var(--desktop-panel)] px-4 text-[0.94rem] font-semibold text-foreground shadow-[0_10px_24px_rgba(15,23,42,0.08)] hover:bg-[var(--desktop-chip)]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <Button
            variant="ghost"
            onClick={() => toggleFavorite(songId)}
            aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
            className={cn(
              "h-11 rounded-full px-5 text-[0.94rem] font-semibold shadow-[0_12px_24px_rgba(15,23,42,0.12)]",
              favorited
                ? "bg-[var(--desktop-nav-active)] text-[var(--desktop-nav-active-foreground)] hover:bg-[var(--desktop-nav-active)]/95"
                : "border border-[var(--desktop-panel-border)] bg-[var(--desktop-panel)] text-foreground hover:bg-[var(--desktop-chip)]",
            )}
          >
            <Heart
              className={cn(
                "mr-2 h-4 w-4",
                favorited &&
                  "fill-[var(--desktop-nav-active-foreground)] text-[var(--desktop-nav-active-foreground)]",
              )}
            />
            {favorited ? "Saved" : "Save"}
          </Button>
        </div>

        <section className="rounded-[2.25rem] border border-[var(--desktop-panel-border)] bg-[var(--desktop-panel)] p-7 shadow-[0_20px_42px_rgba(15,23,42,0.07)] dark:shadow-[0_20px_42px_rgba(2,6,23,0.28)]">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
            <div>
              <div className="flex flex-wrap gap-2">
                {songCategory && (
                  <span className="rounded-full bg-[var(--desktop-nav-active)] px-3 py-1 text-[0.78rem] font-semibold text-[var(--desktop-nav-active-foreground)]">
                    {songCategory}
                  </span>
                )}

                {languages.map((language) => (
                  <span
                    key={language.code}
                    className="rounded-full border border-[var(--desktop-chip-border)] bg-[var(--desktop-chip)] px-3 py-1 text-[0.78rem] font-semibold text-[var(--desktop-chip-foreground)]"
                  >
                    {language.nativeName}
                  </span>
                ))}
              </div>

              <h2 className="mt-5 max-w-4xl font-heading text-[clamp(2.5rem,5vw,4.3rem)] font-semibold leading-[0.96] tracking-[-0.06em] text-foreground">
                {currentTitle}
              </h2>

              <p className="mt-5 text-[1rem] text-[var(--desktop-nav-muted)]">
                View count: {formatViewCount(songViewCount)} / Available in{" "}
                {languages.length} {languages.length === 1 ? "language" : "languages"}
              </p>
            </div>

            <div className="rounded-[1.85rem] bg-[var(--desktop-panel-soft)] p-5">
              <p className="text-[0.98rem] font-semibold text-foreground">
                Available language codes
              </p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {languages.map((language) => (
                  <span
                    key={language.code}
                    className={cn(
                      "inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border px-3 text-[0.82rem] font-semibold",
                      language.code === resolvedActiveLanguage
                        ? "border-transparent bg-[var(--desktop-nav-active)] text-[var(--desktop-nav-active-foreground)]"
                        : "border-[var(--desktop-chip-border)] bg-[var(--desktop-panel)] text-[var(--desktop-chip-foreground)]",
                    )}
                  >
                    {getCompactLanguageBadge(language)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2.25rem] border border-[var(--desktop-panel-border)] bg-[var(--desktop-panel)] p-7 shadow-[0_20px_42px_rgba(15,23,42,0.07)] dark:shadow-[0_20px_42px_rgba(2,6,23,0.28)]">
          <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="space-y-5">
              <div className="rounded-[1.85rem] bg-[var(--desktop-panel-soft)] p-5">
                <h3 className="text-[1rem] font-semibold text-foreground">
                  Select language
                </h3>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {languages.map((language) => {
                    const isActive = language.code === resolvedActiveLanguage;

                    return (
                      <button
                        key={language.code}
                        type="button"
                        className={cn(
                          "inline-flex min-h-12 items-center justify-center rounded-[1.2rem] border px-4 py-3 text-[0.95rem] font-semibold transition-all",
                          isActive
                            ? "border-transparent bg-[var(--desktop-nav-active)] text-[var(--desktop-nav-active-foreground)] shadow-[0_14px_28px_rgba(15,23,42,0.16)]"
                            : "border-[var(--desktop-chip-border)] bg-[var(--desktop-panel)] text-[var(--desktop-chip-foreground)] hover:-translate-y-px hover:border-[var(--desktop-chip-hover-border)] hover:bg-[var(--desktop-chip-hover)] hover:text-[var(--desktop-chip-hover-foreground)]",
                        )}
                        onClick={() => handleLanguageChange(language.code)}
                      >
                        {language.nativeName}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[1.85rem] bg-[var(--desktop-panel-soft)] p-5">
                <h3 className="text-[1rem] font-semibold text-foreground">
                  Reader tools
                </h3>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Button
                    variant="ghost"
                    onClick={handleShare}
                    className="h-11 rounded-full border border-[var(--desktop-chip-border)] bg-[var(--desktop-panel)] px-4 text-[0.9rem] font-semibold text-[var(--desktop-chip-foreground)] hover:bg-[var(--desktop-chip)]"
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => setIsFullscreen(true)}
                    className="h-11 rounded-full border border-[var(--desktop-chip-border)] bg-[var(--desktop-panel)] px-4 text-[0.9rem] font-semibold text-[var(--desktop-chip-foreground)] hover:bg-[var(--desktop-chip)]"
                  >
                    <Maximize2 className="mr-2 h-4 w-4" />
                    Fullscreen
                  </Button>
                </div>

                {youtubeVisible === true && activeTranslation?.youtubeUrl && (
                  <a
                    href={activeTranslation.youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex h-11 items-center rounded-full border border-[var(--desktop-chip-border)] bg-[var(--desktop-panel)] px-4 text-[0.9rem] font-semibold text-[var(--desktop-chip-foreground)] transition-all hover:-translate-y-px hover:border-[var(--desktop-chip-hover-border)] hover:bg-[var(--desktop-chip-hover)] hover:text-[var(--desktop-chip-hover-foreground)]"
                  >
                    <Youtube className="mr-2 h-4 w-4" />
                    Watch on YouTube
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                )}

                {showAudio && activeAudioUrl && (
                  <div className="mt-5 rounded-[1.4rem] border border-[var(--desktop-panel-border)] bg-[var(--desktop-panel)] p-4 shadow-[0_12px_24px_rgba(15,23,42,0.05)] dark:shadow-[0_12px_24px_rgba(2,6,23,0.18)]">
                    <div className="mb-3 flex items-center gap-2 text-[0.86rem] font-semibold text-[var(--desktop-chip-foreground)]">
                      <Volume2 className="h-4 w-4" />
                      Audio
                    </div>
                    <audio
                      ref={desktopAudioRef}
                      controls
                      preload="none"
                      src={streamAudioUrl ?? undefined}
                      controlsList="nodownload noplaybackrate noremoteplayback"
                      className="song-audio-player w-full"
                    />
                  </div>
                )}

                <div className="mt-5">
                  <p className="text-[0.82rem] font-semibold uppercase tracking-[0.14em] text-[var(--desktop-nav-muted)]">
                    Font size
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {SIZES.map((size) => (
                      <Button
                        key={size}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-9 min-w-9 rounded-full border px-3 text-[0.82rem] font-semibold",
                          fontSize === size
                            ? "border-transparent bg-[var(--desktop-nav-active)] text-[var(--desktop-nav-active-foreground)]"
                            : "border-[var(--desktop-chip-border)] bg-[var(--desktop-panel)] text-[var(--desktop-chip-foreground)] hover:bg-[var(--desktop-chip)]",
                        )}
                        onClick={() => setFontSize(size)}
                        aria-label={`Font size ${size}`}
                      >
                        {size}
                      </Button>
                    ))}
                  </div>
                </div>

                {canShowEnglishTranslation && (
                  <div className="mt-5 flex items-center gap-3 rounded-[1.2rem] border border-[var(--desktop-panel-border)] bg-[var(--desktop-panel)] px-4 py-3">
                    <Switch
                      checked={showEnglishTranslation}
                      onCheckedChange={setShowEnglishTranslation}
                      aria-label="Show English Text"
                    />
                    <span className="text-[0.9rem] font-medium text-foreground">
                      Show English Text
                    </span>
                  </div>
                )}
              </div>
            </aside>

            <div className="rounded-[1.85rem] bg-[var(--desktop-panel-soft)] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-heading text-[2rem] font-semibold leading-[1.02] tracking-[-0.04em] text-foreground">
                    Lyrics
                  </h3>
                  <p className="mt-2 text-[0.94rem] text-[var(--desktop-nav-muted)]">
                    Read the selected translation, share it, or open fullscreen
                    for focused reading.
                  </p>
                </div>

                <span className="rounded-full bg-[var(--desktop-panel)] px-3 py-1.5 text-[0.82rem] font-semibold text-foreground shadow-[0_10px_20px_rgba(15,23,42,0.06)] dark:shadow-[0_10px_20px_rgba(2,6,23,0.18)]">
                  {activeLanguageLabel}
                </span>
              </div>

              <div className="mt-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={resolvedActiveLanguage}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.18 }}
                    role="tabpanel"
                    id={`lyrics-panel-${resolvedActiveLanguage}`}
                    aria-labelledby={`lang-tab-${resolvedActiveLanguage}`}
                  >
                    {activeTranslation ? (
                      <div className="space-y-4">
                        {showEnglishInPlace && (
                          <p className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-[var(--desktop-nav-muted)]">
                            Text In English
                          </p>
                        )}
                        <LyricsText
                          lyrics={showEnglishInPlace ? englishMeaning : activeTranslation.lyrics}
                          fontSize={fontSize}
                          languageCode={showEnglishInPlace ? "en" : resolvedActiveLanguage}
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
            </div>
          </div>
        </section>
      </div>

      <div className="fixed bottom-[calc(5.35rem+env(safe-area-inset-bottom))] left-4 right-4 z-40 md:hidden">
        <div className="mx-auto flex max-w-md items-center gap-1.5 rounded-[1.4rem] border border-[var(--desktop-panel-border)] bg-[var(--desktop-sidebar)] p-1.5 shadow-[0_20px_44px_rgba(15,23,42,0.16)] backdrop-blur-xl dark:shadow-[0_20px_44px_rgba(2,6,23,0.38)]">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleFavorite(songId)}
            className={cn(
              "h-11 min-w-0 flex-1 flex-col gap-0.5 rounded-[1rem] px-2",
              favorited
                ? "bg-[var(--desktop-nav-active)] text-[var(--desktop-nav-active-foreground)] hover:bg-[var(--desktop-nav-active)]/95"
                : "text-[var(--desktop-nav-muted)] hover:bg-[var(--desktop-panel-soft)] hover:text-foreground",
            )}
            aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              className={cn(
                "h-4 w-4",
                favorited &&
                  "fill-[var(--desktop-nav-active-foreground)] text-[var(--desktop-nav-active-foreground)]",
              )}
            />
            <span className="text-[0.7rem] font-semibold">
              {favorited ? "Saved" : "Favorite"}
            </span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="h-11 min-w-0 flex-1 flex-col gap-0.5 rounded-[1rem] px-2 text-[var(--desktop-nav-muted)] hover:bg-[var(--desktop-panel-soft)] hover:text-foreground"
          >
            <Share2 className="h-4 w-4" />
            <span className="text-[0.7rem] font-semibold">Share</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(true)}
            className="h-11 min-w-0 flex-1 flex-col gap-0.5 rounded-[1rem] px-2 text-[var(--desktop-nav-muted)] hover:bg-[var(--desktop-panel-soft)] hover:text-foreground"
          >
            <Maximize2 className="h-4 w-4" />
            <span className="text-[0.7rem] font-semibold">Fullscreen</span>
          </Button>
        </div>
      </div>

      <FullscreenReader
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        translations={translations}
        activeLanguage={resolvedActiveLanguage}
        showEnglishTranslation={showEnglishTranslation}
        fontSize={fontSize}
      />

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
              className={buttonVariants({
                variant: "outline",
                className: "justify-start gap-2",
              })}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>

            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(
                shareUrl
              )}&text=${encodeURIComponent(currentTitle)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({
                variant: "outline",
                className: "justify-start gap-2",
              })}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
              Telegram
            </a>

            <a
              href={`mailto:?subject=${encodeURIComponent(
                `${currentTitle} | ${publicSiteTitle}`
              )}&body=${encodeURIComponent(`Check out this song: ${shareUrl}`)}`}
              className={buttonVariants({
                variant: "outline",
                className: "justify-start gap-2",
              })}
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
