import {
  createContactMessageSchema,
  CONTACT_NAME_MAX,
  CONTACT_EMAIL_MAX,
  CONTACT_MESSAGE_MAX,
  CONTACT_REQUEST_TYPES,
} from '@/lib/validations/contact'

describe('Contact Validation Schema', () => {
  describe('name field', () => {
    it('should accept valid names', () => {
      const result = createContactMessageSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        type: 'Song request',
        message: 'Please add this song',
        consent: true,
      })
      expect(result.success).toBe(true)
    })

    it('should reject empty name', () => {
      const result = createContactMessageSchema.safeParse({
        name: '',
        email: 'john@example.com',
        type: 'Song request',
        message: 'Please add this song',
        consent: true,
      })
      expect(result.success).toBe(false)
    })

    it('should trim whitespace from name', () => {
      const result = createContactMessageSchema.safeParse({
        name: '  John Doe  ',
        email: 'john@example.com',
        type: 'Song request',
        message: 'Test',
        consent: true,
      })
      expect(result.success).toBe(true)
    })

    it('should reject names with numbers', () => {
      const result = createContactMessageSchema.safeParse({
        name: 'John123',
        email: 'john@example.com',
        type: 'Song request',
        message: 'Test',
        consent: true,
      })
      expect(result.success).toBe(false)
    })

    it('should reject name exceeding max length', () => {
      const longName = 'a'.repeat(CONTACT_NAME_MAX + 1)
      const result = createContactMessageSchema.safeParse({
        name: longName,
        email: 'john@example.com',
        type: 'Song request',
        message: 'Test',
        consent: true,
      })
      expect(result.success).toBe(false)
    })

    it('should accept name at max length', () => {
      const maxName = 'John Doe'.repeat(5).slice(0, CONTACT_NAME_MAX)
      const result = createContactMessageSchema.safeParse({
        name: maxName,
        email: 'john@example.com',
        type: 'Song request',
        message: 'Test',
        consent: true,
      })
      expect(result.success).toBe(true)
    })

    it('should reject names with line breaks', () => {
      const result = createContactMessageSchema.safeParse({
        name: 'John\nDoe',
        email: 'john@example.com',
        type: 'Song request',
        message: 'Test',
        consent: true,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('email field', () => {
    it('should accept valid emails', () => {
      const result = createContactMessageSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        type: 'Song request',
        message: 'Test',
        consent: true,
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid email format', () => {
      const result = createContactMessageSchema.safeParse({
        name: 'John Doe',
        email: 'not-an-email',
        type: 'Song request',
        message: 'Test',
        consent: true,
      })
      expect(result.success).toBe(false)
    })

    it('should reject empty email', () => {
      const result = createContactMessageSchema.safeParse({
        name: 'John Doe',
        email: '',
        type: 'Song request',
        message: 'Test',
        consent: true,
      })
      expect(result.success).toBe(false)
    })

    it('should reject email exceeding max length', () => {
      const longEmail = 'a'.repeat(CONTACT_EMAIL_MAX) + '@test.com'
      const result = createContactMessageSchema.safeParse({
        name: 'John Doe',
        email: longEmail,
        type: 'Song request',
        message: 'Test',
        consent: true,
      })
      expect(result.success).toBe(false)
    })

    it('should reject emails with line breaks', () => {
      const result = createContactMessageSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com\nBcc: attacker@evil.com',
        type: 'Song request',
        message: 'Test',
        consent: true,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('type field', () => {
    it('should accept valid request types', () => {
      for (const type of CONTACT_REQUEST_TYPES) {
        const result = createContactMessageSchema.safeParse({
          name: 'John Doe',
          email: 'john@example.com',
          type,
          message: 'Test',
          consent: true,
        })
        expect(result.success).toBe(true)
      }
    })

    it('should reject invalid request type', () => {
      const result = createContactMessageSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        type: 'Invalid Type',
        message: 'Test',
        consent: true,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('message field', () => {
    it('should accept valid messages', () => {
      const result = createContactMessageSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        type: 'Song request',
        message: 'Please add this beautiful song to the collection',
        consent: true,
      })
      expect(result.success).toBe(true)
    })

    it('should reject empty message', () => {
      const result = createContactMessageSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        type: 'Song request',
        message: '',
        consent: true,
      })
      expect(result.success).toBe(false)
    })

    it('should trim whitespace from message', () => {
      const result = createContactMessageSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        type: 'Song request',
        message: '  Test message  ',
        consent: true,
      })
      expect(result.success).toBe(true)
    })

    it('should reject message exceeding max length', () => {
      const longMessage = 'a'.repeat(CONTACT_MESSAGE_MAX + 1)
      const result = createContactMessageSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        type: 'Song request',
        message: longMessage,
        consent: true,
      })
      expect(result.success).toBe(false)
    })

    it('should accept message at max length', () => {
      const maxMessage = 'a'.repeat(CONTACT_MESSAGE_MAX)
      const result = createContactMessageSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        type: 'Song request',
        message: maxMessage,
        consent: true,
      })
      expect(result.success).toBe(true)
    })

    it('should reject messages with control characters', () => {
      const result = createContactMessageSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        type: 'Song request',
        message: 'Test\x00Message',
        consent: true,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('consent field', () => {
    it('should default to true', () => {
      const result = createContactMessageSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        type: 'Song request',
        message: 'Test',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.consent).toBe(true)
      }
    })

    it('should accept explicit consent false', () => {
      const result = createContactMessageSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        type: 'Song request',
        message: 'Test',
        consent: false,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.consent).toBe(false)
      }
    })
  })

  describe('website field (honeypot)', () => {
    it('should accept empty website field', () => {
      const result = createContactMessageSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        type: 'Song request',
        message: 'Test',
        website: '',
      })
      expect(result.success).toBe(true)
    })

    it('should reject non-empty website field (bot detection)', () => {
      const result = createContactMessageSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        type: 'Song request',
        message: 'Test',
        website: 'http://spam.com',
      })
      expect(result.success).toBe(false)
    })

    it('should default to empty string', () => {
      const result = createContactMessageSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        type: 'Song request',
        message: 'Test',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.website).toBe('')
      }
    })
  })

  describe('turnstileToken field', () => {
    it('should accept valid turnstile token', () => {
      const result = createContactMessageSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        type: 'Song request',
        message: 'Test',
        turnstileToken: 'valid-token-string',
      })
      expect(result.success).toBe(true)
    })

    it('should be optional', () => {
      const result = createContactMessageSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        type: 'Song request',
        message: 'Test',
      })
      expect(result.success).toBe(true)
    })

    it('should reject empty turnstile token', () => {
      const result = createContactMessageSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        type: 'Song request',
        message: 'Test',
        turnstileToken: '',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('full validation', () => {
    it('should accept complete valid data', () => {
      const result = createContactMessageSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        type: 'Song request',
        message: 'Please add this amazing song',
        consent: true,
        website: '',
        turnstileToken: 'token-123',
      })
      expect(result.success).toBe(true)
    })

    it('should provide error details for invalid data', () => {
      const result = createContactMessageSchema.safeParse({
        name: 'John123',
        email: 'invalid-email',
        type: 'Invalid',
        message: '',
        consent: true,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0)
      }
    })
  })
})
