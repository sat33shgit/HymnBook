"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import {
  addLocalFavorite,
  removeLocalFavorite,
  getLocalFavorites,
  setLocalFavorites,
  getDeviceId,
} from "@/lib/favorites";

const EMPTY_FAVORITES: number[] = [];

let cachedRawFavorites: string | null = null;
let cachedFavorites: number[] = EMPTY_FAVORITES;

function getFavoritesSnapshot() {
  if (typeof window === "undefined") {
    return EMPTY_FAVORITES;
  }

  const raw = localStorage.getItem("hymnbook_favorites") ?? "[]";
  if (raw === cachedRawFavorites) {
    return cachedFavorites;
  }

  cachedRawFavorites = raw;
  try {
    const parsed = JSON.parse(raw);
    cachedFavorites = Array.isArray(parsed)
      ? parsed.filter((id): id is number => typeof id === "number")
      : EMPTY_FAVORITES;
  } catch {
    cachedFavorites = EMPTY_FAVORITES;
  }

  return cachedFavorites;
}

function subscribeFavorites(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("favorites-updated", onStoreChange as EventListener);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("favorites-updated", onStoreChange as EventListener);
  };
}

/** Notify all subscribers that localStorage changed. */
function notifyUpdate() {
  window.dispatchEvent(new Event("favorites-updated"));
}

export function useFavorites() {
  const favorites = useSyncExternalStore(
    subscribeFavorites,
    getFavoritesSnapshot,
    () => EMPTY_FAVORITES
  );

  const syncedRef = useRef(false);

  // On mount: sync localStorage ↔ DB.
  // If localStorage has favorites not yet in DB, push them. Then replace
  // localStorage with the DB truth so the two are always aligned.
  useEffect(() => {
    if (syncedRef.current) return;
    syncedRef.current = true;

    const userId = getDeviceId();
    if (!userId) return;

    const localIds = getLocalFavorites();

    (async () => {
      try {
        // If there are local-only favorites, sync them to the DB first.
        if (localIds.length > 0) {
          await fetch("/api/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, songIds: localIds }),
          });
        }

        // Fetch the full list from DB (single source of truth).
        const res = await fetch(`/api/favorites?userId=${encodeURIComponent(userId)}`);
        if (res.ok) {
          const data = await res.json();
          const dbIds: number[] = (data.favorites ?? []).map(
            (f: { songId: number }) => f.songId
          );
          setLocalFavorites(dbIds);
          notifyUpdate();
        }
      } catch {
        // Network error — keep localStorage as-is for offline resilience.
      }
    })();
  }, []);

  const toggleFavorite = useCallback(
    (songId: number) => {
      const removing = favorites.includes(songId);

      // Optimistic localStorage update.
      if (removing) {
        removeLocalFavorite(songId);
      } else {
        addLocalFavorite(songId);
      }
      notifyUpdate();

      // Persist to DB in the background.
      const userId = getDeviceId();
      if (userId) {
        const opts: RequestInit = {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, songId }),
          keepalive: true,
        };

        if (removing) {
          fetch("/api/favorites", { method: "DELETE", ...opts }).catch(() => {});
        } else {
          fetch("/api/favorites", { method: "POST", ...opts }).catch(() => {});
        }
      }
    },
    [favorites]
  );

  const isFavorite = useCallback(
    (songId: number) => favorites.includes(songId),
    [favorites]
  );

  return { favorites, toggleFavorite, isFavorite };
}
