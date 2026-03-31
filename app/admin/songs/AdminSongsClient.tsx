"use client";

import { useEffect, useRef, useState } from "react";
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
  initialAudioVisible: boolean;
  initialYoutubeVisible?: boolean;
}

type AvailabilityFilter = "all" | "with" | "without";
type SortKey = "title" | "languages" | "category";
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
  initialAudioVisible,
  initialYoutubeVisible = true,
}: AdminSongsClientProps) {
  const [allSongs, setAllSongs] = useState(initialSongs);
  const [searchResults, setSearchResults] = useState<SongListItem[] | null>(null);
  const [audioVisible, setAudioVisible] = useState(initialAudioVisible);
  const [audioToggleLoading, setAudioToggleLoading] = useState(false);
  const [youtubeVisible, setYoutubeVisible] = useState(initialYoutubeVisible);
  const [youtubeToggleLoading, setYoutubeToggleLoading] = useState(false);
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
  const collatorRef = useRef(
    new Intl.Collator(undefined, { sensitivity: "base" })
  );

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
        return direction * collatorRef.current.compare(left.title, right.title);
      }

      if (sortKey === "languages") {
        const leftValue = left.languages.join(", ");
        const rightValue = right.languages.join(", ");
        return direction * collatorRef.current.compare(leftValue, rightValue);
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
        hasAudio: result.has_audio ?? false,
        hasYoutube: result.has_youtube ?? false,
      }));

      setSearchResults(mapped);
    } catch {
      toast.error("Search failed");
    } finally {
      setSearchLoading(false);
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

  const handleToggleAudioVisibility = async (checked: boolean) => {
    const previous = audioVisible;
    setAudioVisible(checked);
    setAudioToggleLoading(true);

    try {
      const res = await fetch("/api/admin/site-settings/audio-visibility", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible: checked }),
      });

      if (!res.ok) {
        throw new Error("Failed to update audio visibility");
      }

      toast.success(
        checked
          ? "Audio enabled on main site"
          : "Audio hidden on main site"
      );
    } catch {
      setAudioVisible(previous);
      toast.error("Failed to update audio visibility");
    } finally {
      setAudioToggleLoading(false);
    }
  };

  const handleToggleYouTubeVisibility = async (checked: boolean) => {
    const previous = youtubeVisible;
    setYoutubeVisible(checked);
    setYoutubeToggleLoading(true);

    try {
      const res = await fetch("/api/admin/site-settings/youtube-visibility", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible: checked }),
      });

      if (!res.ok) {
        throw new Error("Failed to update youtube visibility");
      }

      toast.success(
        checked
          ? "YouTube links enabled on main site"
          : "YouTube links hidden on main site"
      );
    } catch {
      setYoutubeVisible(previous);
      toast.error("Failed to update YouTube visibility");
    } finally {
      setYoutubeToggleLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="font-heading text-3xl font-bold">Songs ({totalSongs})</h1>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Enable Audio</span>
              <Switch
                checked={audioVisible}
                onCheckedChange={handleToggleAudioVisibility}
                disabled={audioToggleLoading}
                aria-label="Toggle song audio visibility on main site"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Enable YouTube</span>
              <Switch
                checked={youtubeVisible}
                onCheckedChange={handleToggleYouTubeVisibility}
                disabled={youtubeToggleLoading}
                aria-label="Toggle song YouTube visibility on main site"
              />
            </label>
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
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void handleSearch();
              }
            }}
            placeholder="Search by title or lyrics..."
            className="w-full max-w-lg rounded-md border px-3 py-2"
            disabled={searchLoading}
            aria-label="Search songs"
          />

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
              <th className="px-4 py-3 text-center font-medium">Published</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {songs.map((song, idx) => (
              <tr key={`${song.id}-${idx}`} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-2">
                    <span>{song.title}</span>
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
                <td className="px-4 py-3 text-center">
                  <Switch
                    checked={song.isPublished ?? false}
                    onCheckedChange={(checked) =>
                      handleTogglePublish(song.id, checked)
                    }
                    aria-label={`${
                      song.isPublished ? "Unpublish" : "Publish"
                    } ${song.title}`}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Link
                      href={`/admin/songs/${song.id}/edit`}
                      className={buttonVariants({ variant: "ghost", size: "icon" })}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit {song.title}</span>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(song.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete {song.title}</span>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {songs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
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
