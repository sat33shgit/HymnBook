"use client";

import { useState } from "react";
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
import { Pencil, Trash2, Plus } from "lucide-react";
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
}

export function AdminSongsClient({ songs: initialSongs }: AdminSongsClientProps) {
  const [songs, setSongs] = useState(initialSongs);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleTogglePublish = async (id: number, isPublished: boolean) => {
    try {
      const res = await fetch(`/api/songs/${id}`, {
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
      const res = await fetch(`/api/songs/${deleteId}`, { method: "DELETE" });
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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold">Songs</h1>
        <Link href="/admin/songs/new" className={buttonVariants()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Song
        </Link>
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
            {songs.map((song) => (
              <tr key={song.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{song.title}</td>
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
    </div>
  );
}
