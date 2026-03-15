"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getLocalFavorites,
  addLocalFavorite,
  removeLocalFavorite,
} from "@/lib/favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<number[]>([]);

  useEffect(() => {
    setFavorites(getLocalFavorites());
  }, []);

  const toggleFavorite = useCallback((songId: number) => {
    setFavorites((prev) => {
      if (prev.includes(songId)) {
        return removeLocalFavorite(songId);
      } else {
        return addLocalFavorite(songId);
      }
    });
  }, []);

  const isFavorite = useCallback(
    (songId: number) => favorites.includes(songId),
    [favorites]
  );

  return { favorites, toggleFavorite, isFavorite };
}
