import {
  getDeviceId,
  getLocalFavorites,
  setLocalFavorites,
  addLocalFavorite,
  removeLocalFavorite,
  isLocalFavorite,
  clearLocalFavorites,
} from '@/lib/favorites'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock crypto.randomUUID
const mockUUID = '550e8400-e29b-41d4-a716-446655440000'
Object.defineProperty(global.crypto, 'randomUUID', {
  value: () => mockUUID,
})

describe('Favorites', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('getDeviceId', () => {
    it('should return stored device ID if it exists', () => {
      const testId = '550e8400-e29b-41d4-a716-446655440001'
      localStorage.setItem('hymnbook_device_id', testId)
      expect(getDeviceId()).toBe(testId)
    })

    it('should create and store new device ID if not exists', () => {
      const id = getDeviceId()
      expect(id).toBe(mockUUID)
      expect(localStorage.getItem('hymnbook_device_id')).toBe(mockUUID)
    })

    it('should return same ID on subsequent calls', () => {
      const id1 = getDeviceId()
      const id2 = getDeviceId()
      expect(id1).toBe(id2)
    })

    it('should return empty string on server side', () => {
      const originalWindow = global.window
      // @ts-ignore
      delete global.window
      const id = getDeviceId()
      expect(id).toBe('')
      global.window = originalWindow
    })
  })

  describe('getLocalFavorites', () => {
    it('should return empty array when no favorites stored', () => {
      const result = getLocalFavorites()
      expect(result).toEqual([])
    })

    it('should return stored favorites', () => {
      localStorage.setItem('hymnbook_favorites', JSON.stringify([1, 2, 3]))
      const result = getLocalFavorites()
      expect(result).toEqual([1, 2, 3])
    })

    it('should handle invalid JSON gracefully', () => {
      localStorage.setItem('hymnbook_favorites', 'invalid json')
      const result = getLocalFavorites()
      expect(result).toEqual([])
    })

    it('should return empty array on server side', () => {
      const originalWindow = global.window
      // @ts-ignore
      delete global.window
      const result = getLocalFavorites()
      expect(result).toEqual([])
      global.window = originalWindow
    })

    it('should handle corrupted data', () => {
      localStorage.setItem('hymnbook_favorites', '{"bad": "data"}')
      const result = getLocalFavorites()
      expect(result).toEqual([])
    })
  })

  describe('setLocalFavorites', () => {
    it('should store favorites array', () => {
      setLocalFavorites([1, 2, 3])
      expect(JSON.parse(localStorage.getItem('hymnbook_favorites') || '[]')).toEqual(
        [1, 2, 3]
      )
    })

    it('should overwrite existing favorites', () => {
      setLocalFavorites([1, 2])
      setLocalFavorites([3, 4, 5])
      expect(JSON.parse(localStorage.getItem('hymnbook_favorites') || '[]')).toEqual(
        [3, 4, 5]
      )
    })

    it('should handle empty array', () => {
      setLocalFavorites([1, 2, 3])
      setLocalFavorites([])
      expect(JSON.parse(localStorage.getItem('hymnbook_favorites') || '[]')).toEqual(
        []
      )
    })

    it('should preserve order', () => {
      const favorites = [5, 3, 1, 4, 2]
      setLocalFavorites(favorites)
      expect(JSON.parse(localStorage.getItem('hymnbook_favorites') || '[]')).toEqual(
        favorites
      )
    })
  })

  describe('addLocalFavorite', () => {
    it('should add new favorite to empty list', () => {
      const result = addLocalFavorite(1)
      expect(result).toEqual([1])
    })

    it('should add new favorite to existing list', () => {
      setLocalFavorites([1, 2])
      const result = addLocalFavorite(3)
      expect(result).toEqual([1, 2, 3])
    })

    it('should not add duplicate favorites', () => {
      setLocalFavorites([1, 2])
      const result = addLocalFavorite(2)
      expect(result).toEqual([1, 2])
    })

    it('should update localStorage', () => {
      addLocalFavorite(1)
      expect(JSON.parse(localStorage.getItem('hymnbook_favorites') || '[]')).toEqual(
        [1]
      )
    })

    it('should return updated favorites list', () => {
      setLocalFavorites([1])
      const result = addLocalFavorite(2)
      expect(result).toContain(1)
      expect(result).toContain(2)
    })
  })

  describe('removeLocalFavorite', () => {
    it('should remove favorite from list', () => {
      setLocalFavorites([1, 2, 3])
      const result = removeLocalFavorite(2)
      expect(result).toEqual([1, 3])
    })

    it('should handle removing from empty list', () => {
      const result = removeLocalFavorite(1)
      expect(result).toEqual([])
    })

    it('should handle removing non-existent favorite', () => {
      setLocalFavorites([1, 2])
      const result = removeLocalFavorite(3)
      expect(result).toEqual([1, 2])
    })

    it('should update localStorage', () => {
      setLocalFavorites([1, 2, 3])
      removeLocalFavorite(2)
      expect(JSON.parse(localStorage.getItem('hymnbook_favorites') || '[]')).toEqual(
        [1, 3]
      )
    })

    it('should preserve order of remaining items', () => {
      setLocalFavorites([5, 3, 1, 4, 2])
      const result = removeLocalFavorite(1)
      expect(result).toEqual([5, 3, 4, 2])
    })
  })

  describe('isLocalFavorite', () => {
    it('should return true for favorite in list', () => {
      setLocalFavorites([1, 2, 3])
      expect(isLocalFavorite(2)).toBe(true)
    })

    it('should return false for favorite not in list', () => {
      setLocalFavorites([1, 2, 3])
      expect(isLocalFavorite(4)).toBe(false)
    })

    it('should return false for empty list', () => {
      expect(isLocalFavorite(1)).toBe(false)
    })

    it('should handle large IDs', () => {
      setLocalFavorites([999999])
      expect(isLocalFavorite(999999)).toBe(true)
    })
  })

  describe('clearLocalFavorites', () => {
    it('should remove all favorites', () => {
      setLocalFavorites([1, 2, 3])
      clearLocalFavorites()
      expect(getLocalFavorites()).toEqual([])
    })

    it('should remove storage key', () => {
      setLocalFavorites([1])
      clearLocalFavorites()
      expect(localStorage.getItem('hymnbook_favorites')).toBeNull()
    })

    it('should be safe to call on empty list', () => {
      clearLocalFavorites()
      expect(getLocalFavorites()).toEqual([])
    })
  })

  describe('Integration tests', () => {
    it('should handle full workflow', () => {
      // Start with empty
      expect(getLocalFavorites()).toEqual([])

      // Add favorite
      addLocalFavorite(1)
      expect(isLocalFavorite(1)).toBe(true)
      expect(getLocalFavorites()).toEqual([1])

      // Add more
      addLocalFavorite(2)
      addLocalFavorite(3)
      expect(getLocalFavorites()).toEqual([1, 2, 3])

      // Remove one
      removeLocalFavorite(2)
      expect(getLocalFavorites()).toEqual([1, 3])
      expect(isLocalFavorite(2)).toBe(false)

      // Clear all
      clearLocalFavorites()
      expect(getLocalFavorites()).toEqual([])
    })

    it('should persist across function calls', () => {
      addLocalFavorite(1)
      addLocalFavorite(2)

      // Access in different function
      expect(getLocalFavorites()).toEqual([1, 2])
      expect(isLocalFavorite(1)).toBe(true)

      // Modify
      removeLocalFavorite(1)
      expect(getLocalFavorites()).toEqual([2])
    })

    it('should handle rapid operations', () => {
      for (let i = 1; i <= 10; i++) {
        addLocalFavorite(i)
      }
      expect(getLocalFavorites()).toHaveLength(10)

      for (let i = 1; i <= 5; i++) {
        removeLocalFavorite(i)
      }
      expect(getLocalFavorites()).toHaveLength(5)
    })
  })
})
