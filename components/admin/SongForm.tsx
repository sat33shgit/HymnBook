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
import slugify from "slugify";

interface Translation {
  languageCode: string;
  title: string;
  lyrics: string;
  englishMeaning?: string;
}

interface SongFormProps {
  languages: { code: string; name: string; nativeName: string }[];
  initialData?: {
    id?: number;
    title: string;
    slug: string;
    category: string;
    isPublished: boolean;
    translations: Translation[];
  };
  mode: "create" | "edit";
}

const AUTOSAVE_KEY = "hymnbook_draft";

export function SongForm({ languages, initialData, mode }: SongFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title ?? "");
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
      const draft = { title, category, isPublished, translations };
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(draft));
    }, 30000);

    return () => {
      if (autosaveRef.current) clearInterval(autosaveRef.current);
    };
  }, [title, category, isPublished, translations]);

  // Restore draft on mount (create mode only)
  useEffect(() => {
    if (mode === "create") {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (saved) {
        try {
          const draft = JSON.parse(saved);
          if (draft.title || draft.translations?.some((t: Translation) => t.lyrics)) {
            const restore = window.confirm(
              "A draft was found. Would you like to restore it?"
            );
            if (restore) {
              setTitle(draft.title ?? "");
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
      field: "title" | "lyrics" | "englishMeaning",
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
        { languageCode: langCode, title: "", lyrics: "", englishMeaning: "" },
      ]);
    },
    [translations]
  );

  const removeTranslation = useCallback((langCode: string) => {
    setTranslations((prev) => prev.filter((t) => t.languageCode !== langCode));
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "English title is required";

    const enTrans = translations.find((t) => t.languageCode === "en");
    if (!enTrans?.title.trim()) {
      newErrors["en-title"] = "English title is required";
    }
    if (!enTrans?.lyrics.trim()) {
      newErrors["en-lyrics"] = "English lyrics are required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const slug = slugify(title, { lower: true, strict: true });
      const normalizedCategory = category.trim();
      const nonEmptyTranslations = translations.filter(
        (t) => t.title.trim() && t.lyrics.trim()
      );

      const payload = {
        title,
        slug,
        category:
          normalizedCategory.length > 0
            ? normalizedCategory
            : mode === "edit"
              ? null
              : undefined,
        isPublished,
        translations: nonEmptyTranslations,
      };

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
    } catch {
      toast.error("Failed to save song");
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

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Section 1: Metadata */}
      <div className="space-y-4 rounded-lg border p-6">
        <h2 className="font-heading text-xl font-semibold">Song Details</h2>

        <div>
          <Label htmlFor="title">
            English Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              // Auto-sync English translation title
              updateTranslation("en", "title", e.target.value);
            }}
            placeholder="Enter song title"
            className="mt-1"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-destructive">{errors.title}</p>
          )}
        </div>

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
              onRemove={
                trans.languageCode !== "en"
                  ? () => removeTranslation(trans.languageCode)
                  : undefined
              }
              isEnglish={trans.languageCode === "en"}
              errors={{
                title:
                  trans.languageCode === "en"
                    ? errors["en-title"]
                    : undefined,
                lyrics:
                  trans.languageCode === "en"
                    ? errors["en-lyrics"]
                    : undefined,
              }}
            />
          );
        })}
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/songs")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={saving} className="gap-2">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {mode === "create" ? "Create Song" : "Update Song"}
        </Button>
      </div>
    </form>
  );
}
