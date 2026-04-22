"use client";

import { useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Eye, EyeOff, Trash2, Upload } from "lucide-react";
import { LyricsText } from "@/components/lyrics/LyricsText";
import { AUDIO_SIZE_ERROR_MESSAGE, MAX_AUDIO_SIZE_BYTES, MAX_AUDIO_SIZE_MB } from "@/lib/audio";

interface TranslationEditorProps {
  languageCode: string;
  languageName: string;
  title: string;
  lyrics: string;
  englishMeaning: string;
  audioUrl?: string | null;
  audioFileName?: string;
  removeAudio?: boolean;
  onTitleChange: (title: string) => void;
  onLyricsChange: (lyrics: string) => void;
  onEnglishMeaningChange: (meaning: string) => void;
  onAudioFileChange: (file: File | null) => void;
  onRemoveAudioChange: (remove: boolean) => void;
  youtubeUrl?: string | null;
  onYouTubeUrlChange?: (url: string) => void;
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
  audioUrl,
  audioFileName,
  removeAudio = false,
  onTitleChange,
  onLyricsChange,
  onEnglishMeaningChange,
  onAudioFileChange,
  onRemoveAudioChange,
  youtubeUrl,
  onYouTubeUrlChange,
  onRemove,
  errors,
  isEnglish = false,
  defaultCollapsed = false,
}: TranslationEditorProps) {
  const [preview, setPreview] = useState(false);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [isDraggingAudio, setIsDraggingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const audioPreviewRef = useRef<HTMLAudioElement>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFileSize, setSelectedFileSize] = useState<number | null>(null);

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes <= 0) return "0 bytes";
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${bytes} bytes`;
  };

  // Count lines
  const lineCount = lyrics.split("\n").length;
  const audioPreviewUrl = audioUrl
    ? `/api/songs/audio/stream?url=${encodeURIComponent(audioUrl)}`
    : null;

  const clearAudioInput = () => {
    if (audioInputRef.current) {
      audioInputRef.current.value = "";
    }
    setSelectedFileName(null);
    setSelectedFileSize(null);
  };

  const rejectAudioSelection = (message: string) => {
    setAudioError(message);
    onAudioFileChange(null);
    clearAudioInput();
  };

  const handleAudioSelection = (file: File | null) => {
    if (!file) {
      onAudioFileChange(null);
      setSelectedFileName(null);
      setSelectedFileSize(null);
      setAudioError(null);
      return;
    }

    const rawFileName = file.name;
    const fileSize = file.size;

    const fileName = rawFileName.toLowerCase();
    const isMp3ByName = fileName.endsWith(".mp3");
    const isM4aByName = fileName.endsWith(".m4a");
    const isMp3ByType = file.type === "audio/mpeg";
    const isM4aByType =
      file.type === "audio/mp4" ||
      file.type === "audio/x-m4a" ||
      file.type === "audio/m4a";

    if (!isMp3ByName && !isM4aByName && !isMp3ByType && !isM4aByType) {
      rejectAudioSelection("Only MP3 and M4A files are allowed");
      return;
    }

    if (file.size > MAX_AUDIO_SIZE_BYTES) {
      rejectAudioSelection(AUDIO_SIZE_ERROR_MESSAGE);
      return;
    }

    setAudioError(null);
    setSelectedFileName(rawFileName);
    setSelectedFileSize(fileSize);
    onAudioFileChange(file);
    onRemoveAudioChange(false);
  };

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 font-medium flex-1 text-left"
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
            onClick={(e) => {
              e.stopPropagation();
              setPreview(!preview);
            }}
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
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
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

        <div className="space-y-2 rounded-md bg-muted/20 p-3">
          <Label htmlFor={`audio-${languageCode}`}>
            Audio (MP3/M4A, max {MAX_AUDIO_SIZE_MB} MB) for {languageName}
          </Label>
          <p className="text-xs text-muted-foreground">
            Upload only audio files that are {MAX_AUDIO_SIZE_MB} MB or smaller.
          </p>

          {audioUrl && !removeAudio && !audioFileName && (
            <p className="text-xs text-muted-foreground">
              Existing audio is attached.
              <button
                type="button"
                className="ml-2 underline"
                onClick={() => {
                  if (!audioPreviewRef.current) return;
                  void audioPreviewRef.current.play();
                }}
              >
                Preview
              </button>
            </p>
          )}

          {audioPreviewUrl && !removeAudio && (
            <audio
              ref={audioPreviewRef}
              controls
              preload="none"
              src={audioPreviewUrl}
              className="w-full"
            />
          )}

          {selectedFileName ? (
            <p className="text-xs text-muted-foreground">
              Selected file: {selectedFileName} ({formatBytes(selectedFileSize ?? 0)})
            </p>
          ) : audioFileName ? (
            <p className="text-xs text-muted-foreground">
              Selected file: {audioFileName}
            </p>
          ) : null}

          {audioError && (
            <p className="text-xs text-destructive">{audioError}</p>
          )}

          <div
            role="button"
            tabIndex={0}
            onClick={() => audioInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                audioInputRef.current?.click();
              }
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDraggingAudio(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDraggingAudio(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDraggingAudio(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDraggingAudio(false);
              const file = e.dataTransfer.files?.[0] ?? null;
              handleAudioSelection(file);
            }}
            className={`rounded-md border border-dashed p-4 text-center transition-colors ${
              isDraggingAudio
                ? "border-primary bg-primary/5"
                : "border-border bg-background"
            }`}
            aria-label={`Upload audio file for ${languageName}`}
          >
            <Upload className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
            <p className="text-sm font-medium">Drag and drop MP3 or M4A here</p>
            <p className="mt-1 text-xs text-muted-foreground">
              or click to browse files up to {MAX_AUDIO_SIZE_MB} MB
            </p>
          </div>

          <Input
            ref={audioInputRef}
            id={`audio-${languageCode}`}
            type="file"
            accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/m4a,.mp3,.m4a"
            className="hidden"
            onChange={(e) => {
              handleAudioSelection(e.target.files?.[0] ?? null);
            }}
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => audioInputRef.current?.click()}
            className="w-fit"
          >
            Choose MP3/M4A File
          </Button>

          {audioUrl && (
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={removeAudio}
                onChange={(e) => {
                  onRemoveAudioChange(e.target.checked);
                  if (e.target.checked) {
                    onAudioFileChange(null);
                  }
                }}
              />
              Remove this translation audio
            </label>
          )}

          <div role="separator" aria-orientation="horizontal" className="my-3 border-t border-border" />

          <div className="mt-3">
            <Label htmlFor={`youtube-${languageCode}`}>YouTube URL for {languageName}</Label>
            <input
              id={`youtube-${languageCode}`}
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl ?? ""}
              onChange={(e) => onYouTubeUrlChange?.(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
