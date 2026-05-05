import {
  deriveSongDefaultLanguage,
  deriveSongPrimaryTitle,
  deriveSongDisplayTitle,
  deriveSongSlug,
} from '@/lib/song-utils'

describe('Song Utils', () => {
  const mockTranslations = [
    {
      languageCode: 'en',
      title: 'Amazing Grace',
      lyrics: 'Amazing grace, how sweet the sound',
    },
    {
      languageCode: 'es',
      title: 'Gracia Asombrosa',
      lyrics: 'Gracia asombrosa...',
    },
    {
      languageCode: 'fr',
      title: 'Grâce Merveilleuse',
      lyrics: 'Grâce merveilleuse...',
    },
  ]

  describe('deriveSongDefaultLanguage', () => {
    it('should return English if available', () => {
      const result = deriveSongDefaultLanguage(mockTranslations)
      expect(result).toBe('en')
    })

    it('should return first usable language if English not available', () => {
      const translations = [
        { languageCode: 'es', title: 'Test', lyrics: 'test' },
        { languageCode: 'fr', title: 'Test', lyrics: 'test' },
      ]
      const result = deriveSongDefaultLanguage(translations)
      expect(result).toBe('es')
    })

    it('should return "en" if no translations available', () => {
      const result = deriveSongDefaultLanguage([])
      expect(result).toBe('en')
    })

    it('should skip translations with empty language code', () => {
      const translations = [
        { languageCode: '', title: 'Test', lyrics: 'test' },
        { languageCode: 'en', title: 'English', lyrics: 'lyrics' },
      ]
      const result = deriveSongDefaultLanguage(translations)
      expect(result).toBe('en')
    })

    it('should skip translations with empty title', () => {
      const translations = [
        { languageCode: 'es', title: '', lyrics: 'test' },
        { languageCode: 'en', title: 'English', lyrics: 'lyrics' },
      ]
      const result = deriveSongDefaultLanguage(translations)
      expect(result).toBe('en')
    })
  })

  describe('deriveSongPrimaryTitle', () => {
    it('should return English title if available', () => {
      const result = deriveSongPrimaryTitle(mockTranslations)
      expect(result).toBe('Amazing Grace')
    })

    it('should return default language title if English not available', () => {
      const translations = [
        { languageCode: 'es', title: 'Gracia', lyrics: 'test' },
        { languageCode: 'fr', title: 'Grace', lyrics: 'test' },
      ]
      const result = deriveSongPrimaryTitle(translations)
      expect(result).toBe('Gracia')
    })

    it('should return empty string if no translations', () => {
      const result = deriveSongPrimaryTitle([])
      expect(result).toBe('')
    })

    it('should trim whitespace from title', () => {
      const translations = [
        { languageCode: 'en', title: '  Amazing Grace  ', lyrics: 'test' },
      ]
      const result = deriveSongPrimaryTitle(translations)
      expect(result).toBe('Amazing Grace')
    })

    it('should use custom default language', () => {
      const result = deriveSongPrimaryTitle(mockTranslations, 'es')
      expect(result).toBe('Amazing Grace') // Still returns English if available
    })

    it('should skip empty titles', () => {
      const translations = [
        { languageCode: 'en', title: '', lyrics: 'test' },
        { languageCode: 'es', title: 'Gracia', lyrics: 'test' },
      ]
      const result = deriveSongPrimaryTitle(translations)
      expect(result).toBe('Gracia')
    })
  })

  describe('deriveSongDisplayTitle', () => {
    it('should return title in preferred language if available', () => {
      const result = deriveSongDisplayTitle(mockTranslations, {
        preferredLanguageCode: 'es',
      })
      expect(result).toBe('Gracia Asombrosa')
    })

    it('should fallback to primary title if preferred language not available', () => {
      const result = deriveSongDisplayTitle(mockTranslations, {
        preferredLanguageCode: 'de',
      })
      expect(result).toBe('Amazing Grace')
    })

    it('should return primary title if no preferred language', () => {
      const result = deriveSongDisplayTitle(mockTranslations)
      expect(result).toBe('Amazing Grace')
    })

    it('should return empty string if no translations', () => {
      const result = deriveSongDisplayTitle([])
      expect(result).toBe('')
    })

    it('should respect default language option', () => {
      const translations = [
        { languageCode: 'es', title: 'Gracia', lyrics: 'test' },
        { languageCode: 'fr', title: 'Grace', lyrics: 'test' },
      ]
      const result = deriveSongDisplayTitle(translations, {
        defaultLanguageCode: 'fr',
      })
      expect(result).toBe('Grace') // Default language translation
    })
  })

  describe('deriveSongSlug', () => {
    it('should create slug from primary title', () => {
      const result = deriveSongSlug(mockTranslations)
      expect(result).toBe('amazing-grace')
    })

    it('should lowercase and remove special characters', () => {
      const translations = [
        { languageCode: 'en', title: 'Amazing Grace!', lyrics: 'test' },
      ]
      const result = deriveSongSlug(translations)
      expect(result).toBe('amazing-grace')
    })

    it('should use existing slug if slug generation fails', () => {
      const translations = [
        { languageCode: 'en', title: '', lyrics: 'test' },
      ]
      const result = deriveSongSlug(translations, {
        existingSlug: 'old-slug',
      })
      expect(result).toBe('old-slug')
    })

    it('should generate hash-based slug if title generates empty slug', () => {
      const translations = [
        { languageCode: 'en', title: '!!!', lyrics: 'test' },
      ]
      const result = deriveSongSlug(translations)
      expect(result).toMatch(/^song-en-[a-f0-9]{8}$/)
    })

    it('should generate fallback hash if no translations', () => {
      const result = deriveSongSlug([])
      expect(result).toMatch(/^song-en-[a-f0-9]{8}$/)
    })

    it('should be consistent for same input', () => {
      const result1 = deriveSongSlug(mockTranslations)
      const result2 = deriveSongSlug(mockTranslations)
      expect(result1).toBe(result2)
    })

    it('should handle unicode titles', () => {
      const translations = [
        { languageCode: 'ja', title: 'アメージング グレース', lyrics: 'test' },
      ]
      const result = deriveSongSlug(translations)
      expect(result).toBeDefined()
      expect(result.length).toBeGreaterThan(0)
    })

    it('should respect custom default language', () => {
      const translations = [
        { languageCode: 'es', title: 'Gracia Asombrosa', lyrics: 'test' },
        { languageCode: 'en', title: 'Amazing Grace', lyrics: 'test' },
      ]
      const result = deriveSongSlug(translations, {
        defaultLanguageCode: 'es',
      })
      expect(result).toBe('amazing-grace') // Still uses English if available
    })

    it('should trim whitespace from existing slug', () => {
      const translations = [
        { languageCode: 'en', title: '', lyrics: 'test' },
      ]
      const result = deriveSongSlug(translations, {
        existingSlug: '  old-slug  ',
      })
      expect(result).toBe('old-slug')
    })
  })
})
