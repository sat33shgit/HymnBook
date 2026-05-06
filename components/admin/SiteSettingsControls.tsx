"use client";

import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export function SiteSettingsControls({ initialAudioVisible, initialYoutubeVisible, initialSongNotificationsEnabled, initialContactVisible }: { initialAudioVisible: boolean; initialYoutubeVisible?: boolean; initialSongNotificationsEnabled?: boolean; initialContactVisible?: boolean }) {
  const [audioVisible, setAudioVisible] = useState(initialAudioVisible);
  const [youtubeVisible, setYoutubeVisible] = useState(initialYoutubeVisible ?? true);
  const [songNotificationsEnabled, setSongNotificationsEnabled] = useState(initialSongNotificationsEnabled ?? false);
  const [contactVisible, setContactVisible] = useState(initialContactVisible ?? false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [loadingYoutube, setLoadingYoutube] = useState(false);
  const [loadingSongNotifications, setLoadingSongNotifications] = useState(false);
  const [loadingContact, setLoadingContact] = useState(false);

  useEffect(() => {
    setAudioVisible(initialAudioVisible);
  }, [initialAudioVisible]);

  useEffect(() => {
    setContactVisible(initialContactVisible ?? false);
  }, [initialContactVisible]);

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

  async function toggleSongNotifications(next: boolean) {
    setLoadingSongNotifications(true);
    try {
      const res = await fetch("/api/admin/site-settings/song-notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      const data = await res.json();
      if (res.ok && typeof data.enabled === "boolean") {
        setSongNotificationsEnabled(data.enabled);
      }
    } finally {
      setLoadingSongNotifications(false);
    }
  }

  async function toggleContact(next: boolean) {
    setLoadingContact(true);
    const previous = contactVisible;
    setContactVisible(next);
    try {
      const res = await fetch("/api/admin/site-settings/contact-visibility", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible: next }),
      });
      if (!res.ok) throw new Error("Failed to update contact visibility");
      toast.success(next ? "Contact page enabled on main site" : "Contact page hidden from main site");
    } catch {
      setContactVisible(previous);
      toast.error("Failed to update contact page visibility");
    } finally {
      setLoadingContact(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <label className="flex items-center justify-between sm:grid sm:grid-cols-2 gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground rounded-md p-2 sm:p-3 hover:bg-muted/30 transition-colors">
        <span>Enable Contact Page</span>
        <div className="flex justify-end">
          <Switch
            checked={contactVisible}
            onCheckedChange={(v) => toggleContact(Boolean(v))}
            disabled={loadingContact}
            aria-label="Toggle contact page visibility on main site"
          />
        </div>
      </label>

      <label className="flex items-center justify-between sm:grid sm:grid-cols-2 gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground rounded-md p-2 sm:p-3 hover:bg-muted/30 transition-colors">
        <span>Enable Audio</span>
        <div className="flex justify-end">
          <Switch
            checked={audioVisible}
            onCheckedChange={(v) => toggleAudio(Boolean(v))}
            disabled={loadingAudio}
            aria-label="Toggle song audio visibility on main site"
          />
        </div>
      </label>

      <label className="flex items-center justify-between sm:grid sm:grid-cols-2 gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground rounded-md p-2 sm:p-3 hover:bg-muted/30 transition-colors">
        <span>Enable YouTube</span>
        <div className="flex justify-end">
          <Switch
            checked={youtubeVisible}
            onCheckedChange={(v) => toggleYoutube(Boolean(v))}
            disabled={loadingYoutube}
            aria-label="Toggle song YouTube visibility on main site"
          />
        </div>
      </label>

      <label className="flex items-center justify-between sm:grid sm:grid-cols-2 gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground rounded-md p-2 sm:p-3 hover:bg-muted/30 transition-colors">
        <span>Enable Song Notifications</span>
        <div className="flex justify-end">
          <Switch
            checked={songNotificationsEnabled}
            onCheckedChange={(v) => toggleSongNotifications(Boolean(v))}
            disabled={loadingSongNotifications}
            aria-label="Toggle song notifications to subscribers"
          />
        </div>
      </label>
    </div>
  );
}
