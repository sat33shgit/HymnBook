const STORAGE_KEY = "hymnbook_favorites";
const DEVICE_ID_KEY = "hymnbook_device_id";

/**
 * Get or create a stable anonymous device identifier so we can persist
 * favorites to the DB without requiring user authentication.
 */
export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function getLocalFavorites(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setLocalFavorites(ids: number[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
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
