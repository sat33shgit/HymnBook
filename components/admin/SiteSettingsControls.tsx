"use client";

import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";

export function SiteSettingsControls({ initialAudioVisible, initialYoutubeVisible }: { initialAudioVisible: boolean; initialYoutubeVisible?: boolean; }) {
  const [audioVisible, setAudioVisible] = useState(initialAudioVisible);
  const [youtubeVisible, setYoutubeVisible] = useState(initialYoutubeVisible ?? true);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [loadingYoutube, setLoadingYoutube] = useState(false);

  useEffect(() => {
    setAudioVisible(initialAudioVisible);
  }, [initialAudioVisible]);

  async function toggleAudio(next: boolean) {
    setLoadingAudio(true);
    try {
      const res = await fetch("/api/admin/site-settings/audio-visibility", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible: next }),
      });
      const data = await res.json();
      if (res.ok && typeof data.visible === "boolean") {
        setAudioVisible(data.visible);
      }
    } finally {
      setLoadingAudio(false);
    }
  }

  async function toggleYoutube(next: boolean) {
    setLoadingYoutube(true);
    try {
      const res = await fetch("/api/admin/site-settings/youtube-visibility", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible: next }),
      });
      const data = await res.json();
      if (res.ok && typeof data.visible === "boolean") {
        setYoutubeVisible(data.visible);
      }
    } finally {
      setLoadingYoutube(false);
    }
  }

  return (
    <div className="flex items-center gap-6">
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Enable Audio</span>
        <Switch
          checked={audioVisible}
          onCheckedChange={(v) => toggleAudio(Boolean(v))}
          disabled={loadingAudio}
          aria-label="Toggle song audio visibility on main site"
        />
      </label>

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Enable YouTube</span>
        <Switch
          checked={youtubeVisible}
          onCheckedChange={(v) => toggleYoutube(Boolean(v))}
          disabled={loadingYoutube}
          aria-label="Toggle song YouTube visibility on main site"
        />
      </label>
    </div>
  );
}
