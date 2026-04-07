"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TranslationEditor } from "./TranslationEditor";
import { toast } from "sonner";
import { Plus, Save, Loader2 } from "lucide-react";
import { deriveSongSlug } from "@/lib/song-utils";

interface Translation {
  languageCode: string;
  title: string;
  lyrics: string;
  englishMeaning?: string;
  audioUrl?: string | null;
  youtubeUrl?: string | null;
}

interface SongFormProps {
  languages: { code: string; name: string; nativeName: string }[];
  initialData?: {
    id?: number;
    slug: string;
    category: string;
    isPublished: boolean;
    translations: Translation[];
  };
  mode: "create" | "edit";
}

const AUTOSAVE_KEY = "hymnbook_draft";

interface PresignedAudioUploadResponse {
  uploadUrl?: string;
  url?: string;
  contentType?: string;
  error?: string;
}

function isLocalAudioUploadHost() {
  if (typeof window === "undefined") {
    return false;
  }

  const hostname = window.location.hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

async function uploadAudioFileViaProxy(params: {
  file: File;
  slug: string;
  existingUrl?: string | null;
}) {
  const { file, slug, existingUrl } = params;

  const uploadBody = new FormData();
  uploadBody.append("file", file);
  uploadBody.append("slug", slug);

  if (existingUrl) {
    uploadBody.append("existingUrl", existingUrl);
  }

  const uploadRes = await fetch("/api/songs/audio", {
    method: "POST",
    body: uploadBody,
  });

  const uploadData = (await uploadRes.json().catch(() => ({}))) as {
    url?: string;
    error?: string;
  };

  if (!uploadRes.ok) {
    throw new Error(uploadData.error || "Audio upload failed");
  }

  if (!uploadData.url) {
    throw new Error("Audio upload completed without a file URL");
  }

  return uploadData.url;
}

async function uploadAudioFileViaPresignedUrl(params: {
  file: File;
  slug: string;
  existingUrl?: string | null;
}) {
  const { file, slug, existingUrl } = params;

  const presignRes = await fetch("/api/songs/audio/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      slug,
    }),
  });

  const presignData =
    (await presignRes.json().catch(() => ({}))) as PresignedAudioUploadResponse;

  if (!presignRes.ok) {
    throw new Error(presignData.error || "Failed to prepare audio upload");
  }

  const uploadUrl = presignData.uploadUrl?.trim();
  const nextAudioUrl = presignData.url?.trim();
  const contentType =
    presignData.contentType?.trim() || file.type || "application/octet-stream";

  if (!uploadUrl || !nextAudioUrl) {
    throw new Error("Audio upload could not be initialized");
  }

  try {
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: file,
    });

    if (!uploadRes.ok) {
      throw new Error(`Audio upload failed with status ${uploadRes.status}`);
    }
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        "Direct audio upload failed. Check the R2 bucket CORS settings for this site origin."
      );
    }

    throw error;
  }

  if (existingUrl) {
    void fetch("/api/songs/audio", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: existingUrl, slug }),
    }).catch(() => undefined);
  }

  return nextAudioUrl;
}

async function uploadAudioFile(params: {
  file: File;
  slug: string;
  existingUrl?: string | null;
}) {
  if (isLocalAudioUploadHost()) {
    return uploadAudioFileViaProxy(params);
  }

  return uploadAudioFileViaPresignedUrl(params);
}

export function SongForm({ languages, initialData, mode }: SongFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);

  const [category, setCategory] = useState(initialData?.category ?? "");
  const [isPublished, setIsPublished] = useState(
    initialData?.isPublished ?? true
  );
  const [translations, setTranslations] = useState<Translation[]>(
    initialData?.translations ?? [
      { languageCode: "en", title: "", lyrics: "", englishMeaning: "" },
    ]
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categorySuggestions, setCategorySuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [audioFilesByLang, setAudioFilesByLang] = useState<Record<string, File | null>>({});
  const [removeAudioByLang, setRemoveAudioByLang] = useState<Record<string, boolean>>({});
  const autosaveRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Fetch category suggestions
  useEffect(() => {
    fetch("/api/songs?limit=100")
      .then((r) => r.json())
      .then((data) => {
        const cats = [
          ...new Set(
            (data.data ?? [])
              .map((s: { category?: string }) => s.category)
              .filter(Boolean)
          ),
        ] as string[];
        setCategorySuggestions(cats);
      })
      .catch(() => {});
  }, []);

  // Autosave draft
  useEffect(() => {
    autosaveRef.current = setInterval(() => {
      const draft = { category, isPublished, translations };
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(draft));
    }, 30000);

    return () => {
      if (autosaveRef.current) clearInterval(autosaveRef.current);
    };
  }, [category, isPublished, translations]);

  // Restore draft on mount (create mode only)
  useEffect(() => {
    if (mode === "create") {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (saved) {
        try {
          const draft = JSON.parse(saved);
          if (draft.translations?.some((t: Translation) => t.lyrics || t.title)) {
            const restore = window.confirm(
              "A draft was found. Would you like to restore it?"
            );
            if (restore) {
              setCategory(draft.category ?? "");
              setIsPublished(draft.isPublished ?? true);
              setTranslations(draft.translations ?? []);
            } else {
              localStorage.removeItem(AUTOSAVE_KEY);
            }
          }
        } catch {
          localStorage.removeItem(AUTOSAVE_KEY);
        }
      }
    }
  }, [mode]);

  const updateTranslation = useCallback(
    (
      langCode: string,
      field: "title" | "lyrics" | "englishMeaning" | "youtubeUrl",
      value: string
    ) => {
      setTranslations((prev) =>
        prev.map((t) =>
          t.languageCode === langCode ? { ...t, [field]: value } : t
        )
      );
    },
    []
  );

  const addTranslation = useCallback(
    (langCode: string) => {
      if (translations.some((t) => t.languageCode === langCode)) return;
      setTranslations((prev) => [
        ...prev,
        {
          languageCode: langCode,
          title: "",
          lyrics: "",
          englishMeaning: "",
          audioUrl: null,
          youtubeUrl: null,
        },
      ]);
    },
    [translations]
  );

  const removeTranslation = useCallback((langCode: string) => {
    setTranslations((prev) => prev.filter((t) => t.languageCode !== langCode));
    setAudioFilesByLang((prev) => {
      const next = { ...prev };
      delete next[langCode];
      return next;
    });
    setRemoveAudioByLang((prev) => {
      const next = { ...prev };
      delete next[langCode];
      return next;
    });
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const hasAnyTranslation = translations.some(
      (t) => t.title.trim() && t.lyrics.trim()
    );
    if (!hasAnyTranslation) {
      newErrors.translations = "At least one translation with title and lyrics is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const normalizedCategory = category.trim();
      const nonEmptyTranslations = translations.filter(
        (t) => t.title.trim() && t.lyrics.trim()
      );

      if (nonEmptyTranslations.length === 0) {
        toast.error("Add at least one translation with title and lyrics");
        return;
      }

      const slug = deriveSongSlug(nonEmptyTranslations, {
        existingSlug: initialData?.slug,
      });

      const payload = {
        category:
          normalizedCategory.length > 0
            ? normalizedCategory
            : mode === "edit"
              ? null
              : undefined,
        isPublished,
        translations: nonEmptyTranslations,
      };

      // If user marked removal for translations without uploading a replacement,
      // delete the existing audio objects first so storage is cleaned up prior
      // to updating the DB.
      for (const translation of nonEmptyTranslations) {
        const lang = translation.languageCode;
        const wantsRemove = removeAudioByLang[lang];
        const hasNewFile = !!audioFilesByLang[lang];
        if (wantsRemove && !hasNewFile && translation.audioUrl) {
          const deleteRes = await fetch("/api/songs/audio", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: translation.audioUrl, slug: `${slug}-${lang}` }),
          });

          if (!deleteRes.ok) {
            const err = await deleteRes.json().catch(() => ({}));
            throw new Error(err.error || `Failed to delete existing audio for ${lang}`);
          }
        }
      }

      const translationsWithAudio = await Promise.all(
        payload.translations.map(async (translation) => {
          let nextAudioUrl = translation.audioUrl ?? null;
          if (removeAudioByLang[translation.languageCode]) {
            nextAudioUrl = null;
          }

          const file = audioFilesByLang[translation.languageCode];
          if (file) {
            nextAudioUrl = await uploadAudioFile({
              file,
              slug: `${slug}-${translation.languageCode}`,
              existingUrl: translation.audioUrl,
            });
          }

          return {
            ...translation,
            audioUrl: nextAudioUrl,
          };
        })
      );

      payload.translations = translationsWithAudio;

      const url =
        mode === "create"
          ? "/api/songs"
          : `/api/songs/${initialData?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to save song");
        return;
      }

      localStorage.removeItem(AUTOSAVE_KEY);
      toast.success(mode === "create" ? "Song created!" : "Song updated!");
      router.replace("/admin/songs");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save song";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const availableToAdd = languages.filter(
    (l) => !translations.some((t) => t.languageCode === l.code)
  );

  const filteredSuggestions = categorySuggestions.filter((c) =>
    c.toLowerCase().includes(category.toLowerCase())
  );

  const handleFloatingSubmit = () => {
    if (formRef.current) {
      // Use requestSubmit so the browser runs form validation and onSubmit
      // handlers as if the user clicked the real submit button.
      // Cast to any to avoid ts lib differences where requestSubmit may be missing
      (formRef.current as HTMLFormElement | null)?.requestSubmit?.();
    }
  };

  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
      {/* Section 1: Metadata */}
      <div className="space-y-4 rounded-lg border p-6">
        <h2 className="font-heading text-xl font-semibold">Song Details</h2>

        <div className="relative">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="e.g. Worship, Praise, Christmas"
            className="mt-1"
          />
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-md border bg-popover shadow-md">
              {filteredSuggestions.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => {
                    setCategory(cat);
                    setShowSuggestions(false);
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="published"
            checked={isPublished}
            onCheckedChange={setIsPublished}
          />
          <Label htmlFor="published">Published</Label>
        </div>
      </div>

      {/* Section 2: Translations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-semibold">Translations</h2>
          {availableToAdd.length > 0 && (
            <div className="flex gap-2">
              {availableToAdd.map((lang) => (
                <Button
                  key={lang.code}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addTranslation(lang.code)}
                  className="gap-1"
                  aria-label={`Add ${lang.name} translation`}
                  title={lang.name}
                >
                  <Plus className="h-3 w-3" />
                  {lang.nativeName}
                </Button>
              ))}
            </div>
          )}
        </div>

        {translations.map((trans) => {
          const lang = languages.find((l) => l.code === trans.languageCode);
          return (
            <TranslationEditor
              key={trans.languageCode}
              languageCode={trans.languageCode}
              languageName={lang?.nativeName ?? trans.languageCode}
              title={trans.title}
              lyrics={trans.lyrics}
              youtubeUrl={trans.youtubeUrl ?? null}
              englishMeaning={trans.englishMeaning ?? ""}
              onTitleChange={(v) =>
                updateTranslation(trans.languageCode, "title", v)
              }
              onLyricsChange={(v) =>
                updateTranslation(trans.languageCode, "lyrics", v)
              }
              onEnglishMeaningChange={(v) =>
                updateTranslation(trans.languageCode, "englishMeaning", v)
              }
              onYouTubeUrlChange={(v) => updateTranslation(trans.languageCode, "youtubeUrl", v)}
              audioUrl={trans.audioUrl ?? null}
              audioFileName={audioFilesByLang[trans.languageCode]?.name}
              removeAudio={removeAudioByLang[trans.languageCode] ?? false}
              onAudioFileChange={(file) =>
                setAudioFilesByLang((prev) => ({
                  ...prev,
                  [trans.languageCode]: file,
                }))
              }
              onRemoveAudioChange={(remove) =>
                setRemoveAudioByLang((prev) => ({
                  ...prev,
                  [trans.languageCode]: remove,
                }))
              }
              onRemove={
                trans.languageCode !== "en"
                  ? () => removeTranslation(trans.languageCode)
                  : undefined
              }
              isEnglish={trans.languageCode === "en"}
              defaultCollapsed={mode === "edit"}
              errors={{}}
            />
          );
        })}

        {errors.translations && (
          <p className="text-sm text-destructive">{errors.translations}</p>
        )}
      </div>

      {/* Hidden submit for accessibility/keyboard submit; floating bar handles visible actions */}
      <button type="submit" className="sr-only" aria-hidden>
        Submit
      </button>
      </form>

      {/* Floating action bar: always visible */}
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-md bg-popover/90 p-3 shadow-lg backdrop-blur">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/songs")}
        >
          Cancel
        </Button>
        <Button onClick={handleFloatingSubmit} disabled={saving} className="gap-2">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {mode === "create" ? "Create Song" : "Update Song"}
        </Button>
      </div>
    </>
  );
}
