import '@testing-library/jest-dom'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  useParams() {
    return {}
  },
}))

// Mock next/headers
jest.mock('next/headers', () => ({
  headers: async () => new Map(),
  cookies: async () => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  }),
}))

// Mock environment variables\nprocess.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000'\nprocess.env.NODE_ENV = 'test'

// Suppress console errors in tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
