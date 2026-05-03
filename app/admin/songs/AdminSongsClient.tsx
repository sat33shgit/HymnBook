"use client";

import { useEffect, useRef, useState } from "react";
import { DateTime } from "luxon";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowUp,
  ArrowUpDown,
  FileDown,
  Music as MusicIcon,
  Pencil,
  Plus,
  Trash2,
  X,
  Youtube as YoutubeIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { SongListItem } from "@/types";

const LANGUAGE_BADGES: Record<string, string> = {
  en: "EN",
  te: "TE",
  hi: "HI",
  ta: "TA",
  ml: "ML",
  kn: "KN",
};

interface AdminSongsClientProps {
  songs: SongListItem[];
  totalSongs: number;
  availableLanguages: Array<{ code: string; label: string }>;
  availableCategories: string[];
}

type AvailabilityFilter = "all" | "with" | "without";
type SortKey = "title" | "languages" | "category" | "createdAt";
type SortDirection = "asc" | "desc";

function getSongApiPath(songId: number) {
  if (!Number.isInteger(songId) || songId <= 0) {
    throw new Error("Invalid song ID");
  }

  return `/api/songs/${songId}`;
}

export function AdminSongsClient({
  songs: initialSongs,
  totalSongs,
  availableLanguages,
  availableCategories,
}: AdminSongsClientProps) {
  const [allSongs, setAllSongs] = useState(initialSongs);
  const [searchResults, setSearchResults] = useState<SongListItem[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [audioFilter, setAudioFilter] = useState<AvailabilityFilter>("all");
  const [youtubeFilter, setYoutubeFilter] = useState<AvailabilityFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("title");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const collatorRef = useRef(
    new Intl.Collator(undefined, { sensitivity: "base" })
  );
  const getDisplayTitle = (song: SongListItem) =>
    selectedLanguage !== "all"
      ? song.titlesByLanguage?.[selectedLanguage] ??
        song.localizedTitle ??
        song.title
      : song.title;

  const formatCreatedAt = (value?: string | Date | null) => {
    if (!value) return "-";
    try {
      let dt;
      if (typeof value === "string") {
        // ISO strings (from getSongs) include 'Z' so fromISO parses as UTC
        dt = DateTime.fromISO(value);
        if (!dt.isValid) {
          // PostgreSQL format has no timezone — treat as UTC explicitly
          dt = DateTime.fromSQL(value, { zone: "utc" });
        }
      } else {
        dt = DateTime.fromJSDate(value);
      }
      return dt.isValid ? dt.toLocal().toFormat("dd-MMM-yyyy HH:mm") : "-";
    } catch {
      return "-";
    }
  };

  const isSearching = searchQuery.trim().length > 0;
  const hasActiveFilters =
    selectedLanguage !== "all" ||
    selectedCategory !== "all" ||
    audioFilter !== "all" ||
    youtubeFilter !== "all";
  const baseSongs = searchResults ?? allSongs;
  const songs = [...baseSongs]
    .filter((song) => {
      const matchesLanguage =
        selectedLanguage === "all" || song.languages.includes(selectedLanguage);
      const matchesCategory =
        selectedCategory === "all" || song.category === selectedCategory;
      const matchesAudio =
        audioFilter === "all" ||
        (audioFilter === "with" && song.hasAudio === true) ||
        (audioFilter === "without" && song.hasAudio !== true);
      const matchesYoutube =
        youtubeFilter === "all" ||
        (youtubeFilter === "with" && song.hasYoutube === true) ||
        (youtubeFilter === "without" && song.hasYoutube !== true);

      return matchesLanguage && matchesCategory && matchesAudio && matchesYoutube;
    })
    .sort((left, right) => {
      const direction = sortDirection === "asc" ? 1 : -1;

      if (sortKey === "title") {
        return (
          direction *
          collatorRef.current.compare(getDisplayTitle(left), getDisplayTitle(right))
        );
      }

      if (sortKey === "languages") {
        const leftValue = left.languages.join(", ");
        const rightValue = right.languages.join(", ");
        return direction * collatorRef.current.compare(leftValue, rightValue);
      }

      if (sortKey === "createdAt") {
        const toTs = (v?: string | Date | null) => {
          if (!v) return 0;
          const t = typeof v === "string" ? Date.parse(v) : v instanceof Date ? v.getTime() : Number(v);
          return Number.isFinite(t) ? t : 0;
        };

        const leftTime = toTs(left.createdAt);
        const rightTime = toTs(right.createdAt);

        return direction * (leftTime - rightTime);
      }

      const leftValue = left.category ?? "";
      const rightValue = right.category ?? "";
      return direction * collatorRef.current.compare(leftValue, rightValue);
    });
  const summaryLabel =
    isSearching || hasActiveFilters
      ? `${songs.length} ${isSearching ? "result" : "song"}${
          songs.length === 1 ? "" : "s"
        }`
      : null;

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
    searchInputRef.current?.focus();
  };

  const clearFilters = () => {
    setSelectedLanguage("all");
    setSelectedCategory("all");
    setAudioFilter("all");
    setYoutubeFilter("all");
  };

  const handleSort = (nextKey: SortKey) => {
    if (sortKey === nextKey) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection("asc");
  };

  const getSortIndicator = (columnKey: SortKey) => {
    if (sortKey !== columnKey) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />;
    }

    return (
      <ArrowUp
        className={`h-3.5 w-3.5 transition-transform ${
          sortDirection === "desc" ? "rotate-180" : ""
        }`}
      />
    );
  };

  const updateSongCollections = (
    updater: (currentSongs: SongListItem[]) => SongListItem[]
  ) => {
    setAllSongs((prev) => updater(prev));
    setSearchResults((prev) => (prev ? updater(prev) : prev));
  };

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      lastFocusedRef.current = e.target as HTMLElement | null;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Backspace") return;

      if (lastFocusedRef.current === searchInputRef.current) {
        setTimeout(() => {
          if (document.activeElement !== searchInputRef.current) {
            searchInputRef.current?.focus();
          }
        }, 0);
      }
    };

    window.addEventListener("focusin", onFocusIn);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("focusin", onFocusIn);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) {
      clearSearch();
      return;
    }

    setSearchLoading(true);

    try {
      const params = new URLSearchParams({
        q,
        includeUnpublished: "1",
      });

      if (selectedLanguage !== "all") {
        params.set("lang", selectedLanguage);
      }

      const res = await fetch(`/api/search?${params.toString()}`);
      if (!res.ok) {
        toast.error("Search failed");
        return;
      }

      const json = await res.json();
      const results: Array<{
        song_id: number;
        slug: string;
        is_published?: boolean;
        title: string;
        matched_language: string;
        has_audio?: boolean;
        has_youtube?: boolean;
        category?: string | null;
        created_at?: string | null;
      }> = json.results ?? [];

      const mapped = results.map((result) => ({
        id: result.song_id,
        slug: result.slug,
        category: result.category ?? null,
        defaultLang: result.matched_language,
        viewCount: null,
        isPublished: result.is_published ?? null,
        title: result.title,
        languages: [result.matched_language],
        createdAt: result.created_at ?? null,
        hasAudio: result.has_audio ?? false,
        hasYoutube: result.has_youtube ?? false,
      }));

      setSearchResults(mapped);
    } catch {
      toast.error("Search failed");
    } finally {
      setSearchLoading(false);
      searchInputRef.current?.focus();
    }
  };

  useEffect(() => {
    const q = searchQuery.trim();

    if (q === "") {
      setSearchResults(null);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      void handleSearch();
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedLanguage]);

  const scheduleTypingEnd = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
      setIsTyping(false);
    }, 800);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsTyping(true);
    scheduleTypingEnd();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setIsTyping(true);
    scheduleTypingEnd();

    if (e.key === "Backspace") {
      e.stopPropagation();
      return;
    }

    if (e.key === "Enter") {
      void handleSearch();
    }
  };

  useEffect(() => {
    if (!isTyping) return;

    const onFocusInWhileTyping = () => {
      if (document.activeElement !== searchInputRef.current) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 0);
      }
    };

    window.addEventListener("focusin", onFocusInWhileTyping, true);

    return () => {
      window.removeEventListener("focusin", onFocusInWhileTyping, true);
    };
  }, [isTyping]);

  const handleTogglePublish = async (id: number, isPublished: boolean) => {
    try {
      const res = await fetch(getSongApiPath(id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished }),
      });

      if (res.ok) {
        updateSongCollections((prev) =>
          prev.map((song) =>
            song.id === id ? { ...song, isPublished } : song
          )
        );
        toast.success(isPublished ? "Song published" : "Song unpublished");
      }
    } catch {
      toast.error("Failed to update song");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);

    try {
      const res = await fetch(getSongApiPath(deleteId), { method: "DELETE" });

      if (res.ok) {
        updateSongCollections((prev) =>
          prev.filter((song) => song.id !== deleteId)
        );
        toast.success("Song deleted");
        setDeleteId(null);
      } else {
        toast.error("Failed to delete song");
      }
    } catch {
      toast.error("Failed to delete song");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="font-heading text-3xl font-bold">Songs ({totalSongs})</h1>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/songs/export?autoprint=1"
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline" })}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Export PDF
            </Link>
            <Link href="/admin/songs/new" className={buttonVariants()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Song
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full max-w-lg">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              placeholder="Search by title or lyrics..."
              className="w-full rounded-md border px-3 py-2 pr-8"
              disabled={searchLoading}
              aria-label="Search songs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {summaryLabel && (
            <div className="ml-4 shrink-0 text-sm text-muted-foreground">
              {summaryLabel}
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="h-10 rounded-md border bg-background px-3 text-sm"
            aria-label="Filter songs by language"
          >
            <option value="all">All languages</option>
            {availableLanguages.map((language) => (
              <option key={language.code} value={language.code}>
                {language.label}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-10 rounded-md border bg-background px-3 text-sm"
            aria-label="Filter songs by category"
          >
            <option value="all">All categories</option>
            {availableCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={audioFilter}
            onChange={(e) => setAudioFilter(e.target.value as AvailabilityFilter)}
            className="h-10 rounded-md border bg-background px-3 text-sm"
            aria-label="Filter songs by audio availability"
          >
            <option value="all">All audio states</option>
            <option value="with">With audio</option>
            <option value="without">Without audio</option>
          </select>

          <select
            value={youtubeFilter}
            onChange={(e) => setYoutubeFilter(e.target.value as AvailabilityFilter)}
            className="h-10 rounded-md border bg-background px-3 text-sm"
            aria-label="Filter songs by YouTube availability"
          >
            <option value="all">All YouTube states</option>
            <option value="with">With YouTube URL</option>
            <option value="without">Without YouTube URL</option>
          </select>

          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">
                <button
                  type="button"
                  onClick={() => handleSort("title")}
                  className="inline-flex items-center gap-1.5 hover:text-foreground"
                >
                  <span>Title</span>
                  {getSortIndicator("title")}
                </button>
              </th>
              <th className="px-4 py-3 text-left font-medium">
                <button
                  type="button"
                  onClick={() => handleSort("languages")}
                  className="inline-flex items-center gap-1.5 hover:text-foreground"
                >
                  <span>Languages</span>
                  {getSortIndicator("languages")}
                </button>
              </th>
              <th className="px-4 py-3 text-left font-medium">
                <button
                  type="button"
                  onClick={() => handleSort("category")}
                  className="inline-flex items-center gap-1.5 hover:text-foreground"
                >
                  <span>Category</span>
                  {getSortIndicator("category")}
                </button>
              </th>
              <th className="px-4 py-3 text-left font-medium">
                <button
                  type="button"
                  onClick={() => handleSort("createdAt")}
                  className="inline-flex items-center gap-1.5 hover:text-foreground"
                >
                  <span>Created at</span>
                  {getSortIndicator("createdAt")}
                </button>
              </th>
              <th className="px-4 py-3 text-center font-medium">Published</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {songs.map((song, idx) => (
              <tr key={`${song.id}-${idx}`} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-2">
                    <span>{getDisplayTitle(song)}</span>
                    {song.hasAudio && (
                      <MusicIcon
                        className="h-4 w-4 text-muted-foreground"
                        aria-hidden
                      />
                    )}
                    {song.hasYoutube && (
                      <YoutubeIcon className="h-4 w-4 text-red-600" aria-hidden />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {song.languages.map((lang) => (
                      <Badge
                        key={lang}
                        variant="outline"
                        className="px-1.5 py-0 text-[10px]"
                      >
                        {LANGUAGE_BADGES[lang] ?? lang.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {song.category ?? "-"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatCreatedAt(song.createdAt ?? null)}
                </td>
                <td className="px-4 py-3 text-center">
                  <Switch
                    checked={song.isPublished ?? false}
                    onCheckedChange={(checked) =>
                      handleTogglePublish(song.id, checked)
                    }
                    aria-label={`${
                      song.isPublished ? "Unpublish" : "Publish"
                    } ${getDisplayTitle(song)}`}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Link
                      href={`/admin/songs/${song.id}/edit`}
                      className={buttonVariants({ variant: "ghost", size: "icon" })}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit {getDisplayTitle(song)}</span>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(song.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete {getDisplayTitle(song)}</span>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {songs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  {isSearching || hasActiveFilters ? (
                    "No songs match the current search or filters."
                  ) : (
                    <>
                      No songs yet.{" "}
                      <Link href="/admin/songs/new" className="text-primary underline">
                        Add one
                      </Link>
                    </>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Song</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this song? This action cannot be undone.
            All translations will also be removed.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showTop && (
        <Button
          size="icon"
          onClick={scrollToTop}
          aria-label="Back to top"
          className="fixed right-6 bottom-6 z-50 h-12 w-12 rounded-full p-0"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
