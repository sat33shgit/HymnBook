"use client";

import { useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Eye, EyeOff, Trash2 } from "lucide-react";
import { LyricsText } from "@/components/lyrics/LyricsText";

interface TranslationEditorProps {
  languageCode: string;
  languageName: string;
  title: string;
  lyrics: string;
  englishMeaning: string;
  onTitleChange: (title: string) => void;
  onLyricsChange: (lyrics: string) => void;
  onEnglishMeaningChange: (meaning: string) => void;
  onRemove?: () => void;
  errors?: { title?: string; lyrics?: string };
  isEnglish?: boolean;
  defaultCollapsed?: boolean;
}

export function TranslationEditor({
  languageCode,
  languageName,
  title,
  lyrics,
  englishMeaning,
  onTitleChange,
  onLyricsChange,
  onEnglishMeaningChange,
  onRemove,
  errors,
  isEnglish = false,
  defaultCollapsed = false,
}: TranslationEditorProps) {
  const [preview, setPreview] = useState(false);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Count lines
  const lineCount = lyrics.split("\n").length;

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 font-medium"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-expanded={!collapsed}
          aria-controls={`translation-body-${languageCode}`}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
          {languageName}
        </button>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setPreview(!preview)}
            className="gap-1"
            disabled={collapsed}
          >
            {preview ? (
              <>
                <EyeOff className="h-4 w-4" /> Edit
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" /> Preview
              </>
            )}
          </Button>
          {onRemove && !isEnglish && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="text-destructive hover:text-destructive gap-1"
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          )}
        </div>
      </div>

      <div
        id={`translation-body-${languageCode}`}
        className={collapsed ? "hidden" : "space-y-3"}
      >
        <div>
          <Label htmlFor={`title-${languageCode}`}>
            Title {isEnglish && <span className="text-destructive">*</span>}
          </Label>
          <Input
            id={`title-${languageCode}`}
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder={`Song title in ${languageName}`}
            className="mt-1"
          />
          {errors?.title && (
            <p className="mt-1 text-sm text-destructive">{errors.title}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor={`lyrics-${languageCode}`}>
              Lyrics {isEnglish && <span className="text-destructive">*</span>}
            </Label>
            <span className="text-xs text-muted-foreground">
              {lineCount} line{lineCount !== 1 ? "s" : ""}
            </span>
          </div>

          {preview ? (
            <div className="mt-1 min-h-[200px] rounded-md border bg-muted/30 p-4">
              <LyricsText
                lyrics={lyrics || "No lyrics yet..."}
                fontSize="M"
                languageCode={languageCode}
              />
            </div>
          ) : (
            <Textarea
              id={`lyrics-${languageCode}`}
              ref={textareaRef}
              value={lyrics}
              onChange={(e) => onLyricsChange(e.target.value)}
              placeholder={`Enter lyrics in ${languageName}...`}
              className="mt-1 min-h-[200px] font-mono text-sm"
              rows={12}
            />
          )}
          {errors?.lyrics && (
            <p className="mt-1 text-sm text-destructive">{errors.lyrics}</p>
          )}
        </div>

        {!isEnglish && (
          <div>
            <Label htmlFor={`meaning-${languageCode}`}>Meaning In English</Label>
            <Textarea
              id={`meaning-${languageCode}`}
              value={englishMeaning}
              onChange={(e) => onEnglishMeaningChange(e.target.value)}
              placeholder={`Explain the meaning of the ${languageName} lyrics in English...`}
              className="mt-1 min-h-[140px] text-sm"
              rows={7}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              This is not the separate English song. Add the equivalent English meaning for readers who cannot read {languageName}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
