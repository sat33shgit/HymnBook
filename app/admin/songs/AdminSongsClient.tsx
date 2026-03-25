"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Plus, Music as MusicIcon, ArrowUp, Youtube as YoutubeIcon } from "lucide-react";
import { toast } from "sonner";
import type { SongListItem } from "@/types";

const LANG_NAMES: Record<string, string> = {
  en: "EN",
  te: "తె",
  hi: "हि",
  ta: "த",
  ml: "മ",
  kn: "ಕ",
};

interface AdminSongsClientProps {
  songs: SongListItem[];
  totalSongs: number;
  initialAudioVisible: boolean;
  initialYoutubeVisible?: boolean;
}

function getSongApiPath(songId: number) {
  if (!Number.isInteger(songId) || songId <= 0) {
    throw new Error("Invalid song ID");
  }

  return `/api/songs/${songId}`;
}

export function AdminSongsClient({
  songs: initialSongs,
  totalSongs,
  initialAudioVisible,
  initialYoutubeVisible = true,
}: AdminSongsClientProps) {
  const [songs, setSongs] = useState(initialSongs);
  const [audioVisible, setAudioVisible] = useState(initialAudioVisible);
  const [audioToggleLoading, setAudioToggleLoading] = useState(false);
  const [youtubeVisible, setYoutubeVisible] = useState(initialYoutubeVisible);
  const [youtubeToggleLoading, setYoutubeToggleLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [resultsCount, setResultsCount] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showTop, setShowTop] = useState(false);

  const clearSearch = () => {
    setSearchQuery("");
    setResultsCount(null);
    setSongs(initialSongs);
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
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&includeUnpublished=1`);
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
        matched_text?: string;
        category?: string | null;
      }> = json.results ?? [];
      setResultsCount(results.length);
      const mapped = results.map((r) => ({
        id: r.song_id,
        slug: r.slug,
        category: r.category ?? null,
        defaultLang: r.matched_language,
        viewCount: null,
        isPublished: r.is_published ?? null,
        title: r.title,
        languages: [r.matched_language],
        hasAudio: r.has_audio ?? false,
        hasYoutube: r.has_youtube ?? false,
      }));
      setSongs(mapped);
    } catch (err) {
      console.warn(err);
      toast.error("Search failed");
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounce runtime search while typing
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const q = searchQuery.trim();
    if (q === "") {
      // reset to initial list when query cleared
      setResultsCount(null);
      setSongs(initialSongs);
      return;
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current as ReturnType<typeof setTimeout>);
    }
    debounceRef.current = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current as ReturnType<typeof setTimeout>);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleTogglePublish = async (id: number, isPublished: boolean) => {
    try {
      const res = await fetch(getSongApiPath(id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished }),
      });
      if (res.ok) {
        setSongs((prev) =>
          prev.map((s) => (s.id === id ? { ...s, isPublished } : s))
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
        setSongs((prev) => prev.filter((s) => s.id !== deleteId));
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
        <div className="flex items-center justify-between mb-3">
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
              if (e.key === "Enter") handleSearch();
            }}
            placeholder="Search by title or lyrics..."
            className="w-full max-w-lg rounded-md border px-3 py-2"
            disabled={searchLoading}
            aria-label="Search songs"
          />
          
          {resultsCount !== null && (
            <div className="ml-4 text-sm text-muted-foreground">
              {resultsCount} result{resultsCount === 1 ? "" : "s"}
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Title</th>
              <th className="px-4 py-3 text-left font-medium">Languages</th>
              <th className="px-4 py-3 text-left font-medium">Category</th>
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
                      <MusicIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
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
                        {LANG_NAMES[lang] ?? lang}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {song.category ?? "—"}
                </td>
                <td className="px-4 py-3 text-center">
                  <Switch
                    checked={song.isPublished ?? false}
                    onCheckedChange={(checked) =>
                      handleTogglePublish(song.id, checked)
                    }
                    aria-label={`${song.isPublished ? "Unpublish" : "Publish"} ${song.title}`}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Link href={`/admin/songs/${song.id}/edit`} className={buttonVariants({ variant: "ghost", size: "icon" })}>
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
                  No songs yet.{" "}
                  <Link href="/admin/songs/new" className="text-primary underline">
                    Add one
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation dialog */}
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
          className="fixed bottom-6 right-6 z-50 rounded-full h-12 w-12 p-0"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
