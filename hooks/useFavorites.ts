"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  addLocalFavorite,
  removeLocalFavorite,
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

export function useFavorites() {
  const favorites = useSyncExternalStore(
    subscribeFavorites,
    getFavoritesSnapshot,
    () => EMPTY_FAVORITES
  );

  const toggleFavorite = useCallback((songId: number) => {
    if (favorites.includes(songId)) {
      removeLocalFavorite(songId);
    } else {
      addLocalFavorite(songId);
    }
    window.dispatchEvent(new Event("favorites-updated"));
  }, [favorites]);

  const isFavorite = useCallback(
    (songId: number) => favorites.includes(songId),
    [favorites]
  );

  return { favorites, toggleFavorite, isFavorite };
}
