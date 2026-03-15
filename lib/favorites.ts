const STORAGE_KEY = "hymnbook_favorites";

export function getLocalFavorites(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addLocalFavorite(songId: number): number[] {
  const favorites = getLocalFavorites();
  if (!favorites.includes(songId)) {
    favorites.push(songId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }
  return favorites;
}

export function removeLocalFavorite(songId: number): number[] {
  const favorites = getLocalFavorites().filter((id) => id !== songId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  return favorites;
}

export function isLocalFavorite(songId: number): boolean {
  return getLocalFavorites().includes(songId);
}

export function clearLocalFavorites(): void {
  localStorage.removeItem(STORAGE_KEY);
}
