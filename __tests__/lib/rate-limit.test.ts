import { rateLimit, getClientIp, type RateLimitResult } from '@/lib/rate-limit'

// Mock Vercel KV
jest.mock('@vercel/kv', () => ({
  kv: {
    incr: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
  },
}))

describe('Rate Limiting', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Ensure KV is not configured for fallback tests
    delete process.env.KV_REST_API_URL
    delete process.env.KV_REST_API_TOKEN
  })

  describe('rateLimit with fallback', () => {
    it('should allow requests under limit', async () => {
      const result = await rateLimit({
        key: 'test-key',
        limit: 5,
        windowSeconds: 60,
      })
      expect(result.ok).toBe(true)
      expect(result.remaining).toBe(4)
    })

    it('should reject request after limit exceeded', async () => {
      const key = 'test-key-limit'
      // Make 5 requests at limit of 5
      for (let i = 0; i < 5; i++) {
        await rateLimit({
          key,
          limit: 5,
          windowSeconds: 60,
        })
      }
      // 6th request should be rejected
      const result = await rateLimit({
        key,
        limit: 5,
        windowSeconds: 60,
      })
      expect(result.ok).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should track remaining requests', async () => {
      const key = 'test-remaining'
      const result1 = await rateLimit({
        key,
        limit: 3,
        windowSeconds: 60,
      })
      expect(result1.remaining).toBe(2)

      const result2 = await rateLimit({
        key,
        limit: 3,
        windowSeconds: 60,
      })
      expect(result2.remaining).toBe(1)

      const result3 = await rateLimit({
        key,
        limit: 3,
        windowSeconds: 60,
      })
      expect(result3.remaining).toBe(0)
    })

    it('should return resetAt timestamp', async () => {
      const now = Date.now()
      const result = await rateLimit({
        key: 'test-reset',
        limit: 5,
        windowSeconds: 60,
      })
      expect(result.resetAt).toBeGreaterThan(now)
      expect(result.resetAt).toBeLessThanOrEqual(now + 60000 + 1000) // Allow 1 second margin
    })

    it('should handle different keys independently', async () => {
      const limit = 2
      const window = 60

      const result1 = await rateLimit({
        key: 'key-1',
        limit,
        windowSeconds: window,
      })
      const result2 = await rateLimit({
        key: 'key-2',
        limit,
        windowSeconds: window,
      })

      expect(result1.remaining).toBe(1)
      expect(result2.remaining).toBe(1)
    })

    it('should handle zero limit', async () => {
      const result = await rateLimit({
        key: 'zero-limit',
        limit: 0,
        windowSeconds: 60,
      })
      // Zero limit means first request is allowed but exceeds immediately
      expect(result.ok).toBe(true)
      expect(result.remaining).toBe(0)
    })

    it('should handle low limit (1)', async () => {
      const key = 'low-limit'
      const result1 = await rateLimit({
        key,
        limit: 1,
        windowSeconds: 60,
      })
      expect(result1.ok).toBe(true)
      expect(result1.remaining).toBe(0)

      const result2 = await rateLimit({
        key,
        limit: 1,
        windowSeconds: 60,
      })
      expect(result2.ok).toBe(false)
    })

    it('should reset after window expires', async () => {
      const key = 'test-expiry'
      const windowSeconds = 1

      const result1 = await rateLimit({
        key,
        limit: 1,
        windowSeconds,
      })
      expect(result1.ok).toBe(true)

      // Try to make another request immediately (should fail)
      const result2 = await rateLimit({
        key,
        limit: 1,
        windowSeconds,
      })
      expect(result2.ok).toBe(false)

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 1100))

      // Should be able to make request again
      const result3 = await rateLimit({
        key,
        limit: 1,
        windowSeconds,
      })
      expect(result3.ok).toBe(true)
    })
  })

  describe('getClientIp', () => {
    // Create a mock Request class for testing
    const createMockRequest = (headers: Record<string, string>) => {
      return {
        headers: {
          get: (key: string) => headers[key] || null,
        },
      } as unknown as Request
    }

    it('should extract IP from cf-connecting-ip header', () => {
      const request = createMockRequest({
        'cf-connecting-ip': '192.168.1.1',
      })
      expect(getClientIp(request)).toBe('192.168.1.1')
    })

    it('should fallback to x-real-ip header', () => {
      const request = createMockRequest({
        'x-real-ip': '192.168.1.2',
      })
      expect(getClientIp(request)).toBe('192.168.1.2')
    })

    it('should fallback to x-forwarded-for header', () => {
      const request = createMockRequest({
        'x-forwarded-for': '192.168.1.3',
      })
      expect(getClientIp(request)).toBe('192.168.1.3')
    })

    it('should extract first IP from x-forwarded-for list', () => {
      const request = createMockRequest({
        'x-forwarded-for': '192.168.1.3, 192.168.1.4, 192.168.1.5',
      })
      expect(getClientIp(request)).toBe('192.168.1.3')
    })

    it('should follow precedence: cf-connecting-ip > x-real-ip > x-forwarded-for', () => {
      const request = createMockRequest({
        'cf-connecting-ip': '192.168.1.1',
        'x-real-ip': '192.168.1.2',
        'x-forwarded-for': '192.168.1.3',
      })
      expect(getClientIp(request)).toBe('192.168.1.1')
    })

    it('should trim whitespace from IPs', () => {
      const request = createMockRequest({
        'cf-connecting-ip': '  192.168.1.1  ',
      })
      expect(getClientIp(request)).toBe('192.168.1.1')
    })

    it('should return "unknown" when no IP headers present', () => {
      const request = createMockRequest({})
      expect(getClientIp(request)).toBe('unknown')
    })

    it('should ignore empty header values', () => {
      const request = createMockRequest({
        'cf-connecting-ip': '',
        'x-real-ip': '192.168.1.2',
      })
      expect(getClientIp(request)).toBe('192.168.1.2')
    })

    it('should ignore whitespace-only header values', () => {
      const request = createMockRequest({
        'cf-connecting-ip': '   ',
        'x-real-ip': '192.168.1.2',
      })
      expect(getClientIp(request)).toBe('192.168.1.2')
    })

    it('should handle IPv6 addresses', () => {
      const request = createMockRequest({
        'cf-connecting-ip': '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
      })
      expect(getClientIp(request)).toBe(
        '2001:0db8:85a3:0000:0000:8a2e:0370:7334'
      )
    })
  })

  describe('RateLimitResult type', () => {
    it('should have correct structure', async () => {
      const result: RateLimitResult = {
        ok: true,
        remaining: 5,
        resetAt: Date.now() + 60000,
      }
      expect(result).toHaveProperty('ok')
      expect(result).toHaveProperty('remaining')
      expect(result).toHaveProperty('resetAt')
    })
  })
})
