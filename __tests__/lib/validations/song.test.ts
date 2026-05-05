import {
  createSongSchema,
  updateSongSchema,
  createLanguageSchema,
  updateLanguageSchema,
  searchSchema,
  songsListQuerySchema,
  favoriteSchema,
  syncFavoritesSchema,
} from '@/lib/validations/song'

describe('Song Validation Schemas', () => {
  describe('translationSchema', () => {
    const validTranslation = {
      languageCode: 'en',
      title: 'Amazing Grace',
      lyrics: 'Amazing grace, how sweet the sound',
    }

    it('should accept valid translation', () => {
      const result = createSongSchema.safeParse({
        translations: [validTranslation],
      })
      expect(result.success).toBe(true)
    })

    it('should accept optional englishMeaning', () => {
      const result = createSongSchema.safeParse({
        translations: [
          {
            ...validTranslation,
            englishMeaning: 'The meaning in English',
          },
        ],
      })
      expect(result.success).toBe(true)
    })

    it('should accept valid audio URL', () => {
      const result = createSongSchema.safeParse({
        translations: [
          {
            ...validTranslation,
            audioUrl: 'https://example.com/audio.mp3',
          },
        ],
      })
      expect(result.success).toBe(true)
    })

    it('should accept valid youtube URL', () => {
      const result = createSongSchema.safeParse({
        translations: [
          {
            ...validTranslation,
            youtubeUrl: 'https://youtube.com/watch?v=123',
          },
        ],
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid URL', () => {
      const result = createSongSchema.safeParse({
        translations: [
          {
            ...validTranslation,
            audioUrl: 'not-a-url',
          },
        ],
      })
      expect(result.success).toBe(false)
    })

    it('should reject empty title', () => {
      const result = createSongSchema.safeParse({
        translations: [
          {
            ...validTranslation,
            title: '',
          },
        ],
      })
      expect(result.success).toBe(false)
    })

    it('should reject empty lyrics', () => {
      const result = createSongSchema.safeParse({
        translations: [
          {
            ...validTranslation,
            lyrics: '',
          },
        ],
      })
      expect(result.success).toBe(false)
    })
  })

  describe('createSongSchema', () => {
    it('should accept valid song data', () => {
      const result = createSongSchema.safeParse({
        category: 'Hymns',
        isPublished: true,
        translations: [
          {
            languageCode: 'en',
            title: 'Test Song',
            lyrics: 'Test lyrics',
          },
        ],
      })
      expect(result.success).toBe(true)
    })

    it('should require at least one translation', () => {
      const result = createSongSchema.safeParse({
        category: 'Hymns',
        translations: [],
      })
      expect(result.success).toBe(false)
    })

    it('should default isPublished to true', () => {
      const result = createSongSchema.safeParse({
        translations: [
          {
            languageCode: 'en',
            title: 'Test',
            lyrics: 'test',
          },
        ],
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.isPublished).toBe(true)
      }
    })

    it('should accept multiple translations', () => {
      const result = createSongSchema.safeParse({
        translations: [
          {
            languageCode: 'en',
            title: 'Test',
            lyrics: 'test',
          },
          {
            languageCode: 'es',
            title: 'Prueba',
            lyrics: 'prueba',
          },
        ],
      })
      expect(result.success).toBe(true)
    })
  })

  describe('updateSongSchema', () => {
    it('should accept partial updates', () => {
      const result = updateSongSchema.safeParse({
        category: 'Updated Category',
      })
      expect(result.success).toBe(true)
    })

    it('should allow null category', () => {
      const result = updateSongSchema.safeParse({
        category: null,
      })
      expect(result.success).toBe(true)
    })

    it('should allow updating isPublished', () => {
      const result = updateSongSchema.safeParse({
        isPublished: false,
      })
      expect(result.success).toBe(true)
    })

    it('should allow updating translations', () => {
      const result = updateSongSchema.safeParse({
        translations: [
          {
            languageCode: 'en',
            title: 'Updated',
            lyrics: 'updated lyrics',
          },
        ],
      })
      expect(result.success).toBe(true)
    })

    it('should allow empty object', () => {
      const result = updateSongSchema.safeParse({})
      expect(result.success).toBe(true)
    })
  })

  describe('createLanguageSchema', () => {
    it('should accept valid language data', () => {
      const result = createLanguageSchema.safeParse({
        code: 'en',
        name: 'English',
        nativeName: 'English',
      })
      expect(result.success).toBe(true)
    })

    it('should reject code with uppercase', () => {
      const result = createLanguageSchema.safeParse({
        code: 'EN',
        name: 'English',
        nativeName: 'English',
      })
      expect(result.success).toBe(false)
    })

    it('should reject code with non-letter characters', () => {
      const result = createLanguageSchema.safeParse({
        code: 'en-US',
        name: 'English',
        nativeName: 'English',
      })
      expect(result.success).toBe(false)
    })

    it('should accept optional fontStack', () => {
      const result = createLanguageSchema.safeParse({
        code: 'ja',
        name: 'Japanese',
        nativeName: '日本語',
        fontStack: 'font-jp',
      })
      expect(result.success).toBe(true)
    })

    it('should default sortOrder to 0', () => {
      const result = createLanguageSchema.safeParse({
        code: 'en',
        name: 'English',
        nativeName: 'English',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.sortOrder).toBe(0)
      }
    })
  })

  describe('updateLanguageSchema', () => {
    it('should allow updating name', () => {
      const result = updateLanguageSchema.safeParse({
        name: 'English (US)',
      })
      expect(result.success).toBe(true)
    })

    it('should allow updating nativeName', () => {
      const result = updateLanguageSchema.safeParse({
        nativeName: 'Español',
      })
      expect(result.success).toBe(true)
    })

    it('should allow updating isActive', () => {
      const result = updateLanguageSchema.safeParse({
        isActive: false,
      })
      expect(result.success).toBe(true)
    })

    it('should allow empty update', () => {
      const result = updateLanguageSchema.safeParse({})
      expect(result.success).toBe(true)
    })
  })

  describe('searchSchema', () => {
    it('should accept valid search query', () => {
      const result = searchSchema.safeParse({
        q: 'Amazing Grace',
      })
      expect(result.success).toBe(true)
    })

    it('should trim query whitespace', () => {
      const result = searchSchema.safeParse({
        q: '  Amazing Grace  ',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.q).toBe('Amazing Grace')
      }
    })

    it('should reject empty query', () => {
      const result = searchSchema.safeParse({
        q: '',
      })
      expect(result.success).toBe(false)
    })

    it('should reject query exceeding max length', () => {
      const longQuery = 'a'.repeat(201)
      const result = searchSchema.safeParse({
        q: longQuery,
      })
      expect(result.success).toBe(false)
    })

    it('should accept valid language code', () => {
      const result = searchSchema.safeParse({
        q: 'test',
        lang: 'en',
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid language code', () => {
      const result = searchSchema.safeParse({
        q: 'test',
        lang: '123',
      })
      expect(result.success).toBe(false)
    })

    it('should accept includeUnpublished values', () => {
      const values = ['1', 'true', '0', 'false']
      for (const value of values) {
        const result = searchSchema.safeParse({
          q: 'test',
          includeUnpublished: value,
        })
        expect(result.success).toBe(true)
      }
    })

    it('should reject invalid includeUnpublished', () => {
      const result = searchSchema.safeParse({
        q: 'test',
        includeUnpublished: 'maybe',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('songsListQuerySchema', () => {
    it('should accept valid pagination params', () => {
      const result = songsListQuerySchema.safeParse({
        page: 1,
        limit: 15,
      })
      expect(result.success).toBe(true)
    })

    it('should default page to 1', () => {
      const result = songsListQuerySchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
      }
    })

    it('should default limit to 15', () => {
      const result = songsListQuerySchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.limit).toBe(15)
      }
    })

    it('should accept category filter', () => {
      const result = songsListQuerySchema.safeParse({
        category: 'Hymns',
      })
      expect(result.success).toBe(true)
    })

    it('should accept language filter', () => {
      const result = songsListQuerySchema.safeParse({
        language: 'es',
      })
      expect(result.success).toBe(true)
    })

    it('should reject page exceeding max', () => {
      const result = songsListQuerySchema.safeParse({
        page: 10001,
      })
      expect(result.success).toBe(false)
    })

    it('should reject limit exceeding max', () => {
      const result = songsListQuerySchema.safeParse({
        limit: 101,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('favoriteSchema', () => {
    it('should accept valid favorite data', () => {
      const result = favoriteSchema.safeParse({
        userId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        songId: 1,
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID', () => {
      const result = favoriteSchema.safeParse({
        userId: 'not-a-uuid',
        songId: 1,
      })
      expect(result.success).toBe(false)
    })

    it('should reject non-positive songId', () => {
      const result = favoriteSchema.safeParse({
        userId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        songId: 0,
      })
      expect(result.success).toBe(false)
    })

    it('should reject negative songId', () => {
      const result = favoriteSchema.safeParse({
        userId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        songId: -1,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('syncFavoritesSchema', () => {
    it('should accept valid sync data', () => {
      const result = syncFavoritesSchema.safeParse({
        userId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        songIds: [1, 2, 3],
      })
      expect(result.success).toBe(true)
    })

    it('should accept empty songIds array', () => {
      const result = syncFavoritesSchema.safeParse({
        userId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        songIds: [],
      })
      expect(result.success).toBe(true)
    })

    it('should reject songIds exceeding max', () => {
      const songIds = Array.from({ length: 501 }, (_, i) => i + 1)
      const result = syncFavoritesSchema.safeParse({
        userId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        songIds,
      })
      expect(result.success).toBe(false)
    })

    it('should accept max songIds (500)', () => {
      const songIds = Array.from({ length: 500 }, (_, i) => i + 1)
      const result = syncFavoritesSchema.safeParse({
        userId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        songIds,
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID', () => {
      const result = syncFavoritesSchema.safeParse({
        userId: 'invalid',
        songIds: [1, 2, 3],
      })
      expect(result.success).toBe(false)
    })
  })
})
