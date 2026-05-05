/**
 * @jest-environment node
 */
import {
  originIsTrusted,
  hasRequiredFormHeader,
  REQUIRED_FORM_HEADER_NAME,
  REQUIRED_FORM_HEADER_VALUE,
  containsHeaderInjection,
  stripLineBreaks,
} from '@/lib/request-security'

describe('Request Security', () => {
  describe('originIsTrusted', () => {
    it('should trust requests from the configured site', () => {
      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          origin: 'http://localhost:3000',
        },
      })
      expect(originIsTrusted(request)).toBe(true)
    })

    it('should check Origin header first', () => {
      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          origin: 'http://localhost:3000',
          referer: 'http://evil.com/attack',
        },
      })
      expect(originIsTrusted(request)).toBe(true)
    })

    it('should fallback to Referer header', () => {
      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          referer: 'http://localhost:3000/page',
        },
      })
      expect(originIsTrusted(request)).toBe(true)
    })

    it('should reject requests with untrusted origin', () => {
      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          origin: 'http://evil.com',
        },
      })
      expect(originIsTrusted(request)).toBe(false)
    })

    it('should reject requests with untrusted referer', () => {
      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          referer: 'http://evil.com/attack',
        },
      })
      expect(originIsTrusted(request)).toBe(false)
    })

    it('should reject requests with neither origin nor referer', () => {
      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
      })
      expect(originIsTrusted(request)).toBe(false)
    })

    it('should reject requests with invalid referer URL', () => {
      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          referer: 'not-a-valid-url',
        },
      })
      expect(originIsTrusted(request)).toBe(false)
    })

    it('should accept localhost in development', () => {
      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          origin: 'http://localhost:3000',
        },
      })
      expect(originIsTrusted(request)).toBe(true)
    })

    it('should accept 127.0.0.1 in development', () => {
      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          origin: 'http://127.0.0.1:3000',
        },
      })
      expect(originIsTrusted(request)).toBe(true)
    })
  })

  describe('hasRequiredFormHeader', () => {
    it('should return true when required header is present', () => {
      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          [REQUIRED_FORM_HEADER_NAME]: REQUIRED_FORM_HEADER_VALUE,
        },
      })
      expect(hasRequiredFormHeader(request)).toBe(true)
    })

    it('should return false when required header is missing', () => {
      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
      })
      expect(hasRequiredFormHeader(request)).toBe(false)
    })

    it('should return false when header value is incorrect', () => {
      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          [REQUIRED_FORM_HEADER_NAME]: '2',
        },
      })
      expect(hasRequiredFormHeader(request)).toBe(false)
    })

    it('should be case-sensitive for header value', () => {
      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          [REQUIRED_FORM_HEADER_NAME]: 'TRUE',
        },
      })
      expect(hasRequiredFormHeader(request)).toBe(false)
    })
  })

  describe('containsHeaderInjection', () => {
    it('should detect line feed character', () => {
      expect(containsHeaderInjection('John\nDoe')).toBe(true)
    })

    it('should detect carriage return character', () => {
      expect(containsHeaderInjection('John\rDoe')).toBe(true)
    })

    it('should detect CRLF sequence', () => {
      expect(containsHeaderInjection('John\r\nDoe')).toBe(true)
    })

    it('should detect NEL character', () => {
      expect(containsHeaderInjection('JohnDoe')).toBe(true)
    })

    it('should detect line separator', () => {
      expect(containsHeaderInjection('John Doe')).toBe(true)
    })

    it('should detect paragraph separator', () => {
      expect(containsHeaderInjection('John Doe')).toBe(true)
    })

    it('should allow normal text', () => {
      expect(containsHeaderInjection('John Doe')).toBe(false)
    })

    it('should allow email addresses', () => {
      expect(containsHeaderInjection('john@example.com')).toBe(false)
    })

    it('should allow special characters (non-line-breaks)', () => {
      expect(containsHeaderInjection('John!@#$%^&*()')).toBe(false)
    })

    it('should allow tabs', () => {
      expect(containsHeaderInjection('John\tDoe')).toBe(false)
    })

    it('should detect multiple line breaks', () => {
      expect(
        containsHeaderInjection('To: attacker@evil.com\nBcc: someone@evil.com')
      ).toBe(true)
    })
  })

  describe('stripLineBreaks', () => {
    it('should replace line feed with space', () => {
      const result = stripLineBreaks('John\nDoe')
      expect(result).toBe('John Doe')
    })

    it('should replace carriage return with space', () => {
      const result = stripLineBreaks('John\rDoe')
      expect(result).toBe('John Doe')
    })

    it('should replace CRLF with single space', () => {
      const result = stripLineBreaks('John\r\nDoe')
      expect(result).toBe('John Doe')
    })

    it('should replace multiple consecutive line breaks with single space', () => {
      const result = stripLineBreaks('John\n\n\nDoe')
      expect(result).toBe('John Doe')
    })

    it('should trim leading/trailing spaces', () => {
      const result = stripLineBreaks('\nJohn Doe\n')
      expect(result).toBe('John Doe')
    })

    it('should preserve normal spaces', () => {
      const result = stripLineBreaks('John   Doe')
      expect(result).toBe('John   Doe')
    })

    it('should handle NEL character', () => {
      const result = stripLineBreaks('JohnDoe')
      expect(result).toBe('John Doe')
    })

    it('should handle line separator', () => {
      const result = stripLineBreaks('John Doe')
      expect(result).toBe('John Doe')
    })

    it('should handle paragraph separator', () => {
      const result = stripLineBreaks('John Doe')
      expect(result).toBe('John Doe')
    })

    it('should handle email injection attempt', () => {
      const result = stripLineBreaks(
        'John\nSubject: Spam\nBcc: attacker@evil.com'
      )
      expect(result).toBe('John Subject: Spam Bcc: attacker@evil.com')
      expect(result).not.toContain('\n')
    })

    it('should return unchanged string without line breaks', () => {
      const result = stripLineBreaks('John Doe')
      expect(result).toBe('John Doe')
    })
  })
})
