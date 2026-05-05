# HymnBook Test Suite Guide

## Overview
This document provides a comprehensive guide to the unit test suite for the HymnBook application, covering both the public website and admin dashboard functionalities.

## Test Coverage Structure

### 1. Configuration Files
- **jest.config.js** - Jest configuration with Next.js support
  - Coverage threshold: 80% minimum
  - Test environment: jsdom for React components
  - Custom module mappings for @/ imports

- **jest.setup.js** - Jest setup file
  - React Testing Library configuration
  - Mock implementations for Next.js modules
  - Environment variable setup
  - Console error suppression for expected warnings

## Test Files and Coverage

### Utility Functions Tests (`__tests__/lib/utils.test.ts`)
**Coverage Area**: String and styling utilities

Tests included:
- `cn()` - className merger with Tailwind support
  - Merging classes
  - Handling conditional classes
  - Override resolution
  - Edge cases (empty strings, undefined, arrays)
  
- `formatDate()` - Date formatting
  - String and Date object inputs
  - Different date formats
  - Locale-aware formatting
  
- `truncate()` - String truncation
  - Strings shorter/equal/longer than limit
  - Ellipsis addition
  - Unicode character support
  - Edge cases (0 length, empty string)

**Status**: ✅ Complete - 15+ test cases

---

### Song Utility Functions Tests (`__tests__/lib/song-utils.test.ts`)
**Coverage Area**: Song translation and slug generation logic

Tests included:
- `deriveSongDefaultLanguage()`
  - English preference logic
  - Fallback to first usable translation
  - Empty translation handling
  - Language code validation

- `deriveSongPrimaryTitle()`
  - English title priority
  - Default language fallback
  - Whitespace trimming
  - Handling empty titles

- `deriveSongDisplayTitle()`
  - Preferred language display
  - Fallback to primary title
  - Custom default language support

- `deriveSongSlug()`
  - Slug generation from title
  - Hash-based fallback
  - Existing slug preservation
  - Character sanitization
  - Consistency across calls
  - Unicode support

**Status**: ✅ Complete - 35+ test cases

---

### Contact Validation Tests (`__tests__/lib/validations/contact.test.ts`)
**Coverage Area**: Contact form validation and security

Tests included:
- Name field validation
  - Required, min/max length
  - No number constraint
  - Header injection prevention
  - Whitespace trimming

- Email field validation
  - Valid email format
  - Required, max length
  - Email injection prevention

- Request type validation
  - Valid enum values
  - Invalid type rejection

- Message field validation
  - Required, min/max length
  - Control character filtering
  - Whitespace trimming

- Consent and honeypot fields
  - Default values
  - Boolean handling
  - Bot detection (website field)

- Turnstile token validation
  - Optional field
  - Token format validation

**Status**: ✅ Complete - 40+ test cases

---

### Song Validation Tests (`__tests__/lib/validations/song.test.ts`)
**Coverage Area**: Song creation, updates, and search validation

Tests included:
- Translation validation
  - Language code, title, lyrics
  - Optional fields (meaning, audio/YouTube URLs)
  - URL format validation

- Song creation schema
  - Multiple translations support
  - Minimum translation requirement
  - Default publish status
  - Optional category

- Song update schema
  - Partial updates support
  - Null category handling
  - Translation updates

- Language management schemas
  - Language code validation (lowercase, letters only)
  - Name and native name
  - Optional font stack
  - Sort order

- Search validation
  - Query length limits
  - Language code format
  - Publish status flags
  - Optional filters

- Pagination and listing
  - Page and limit defaults
  - Min/max constraints
  - Category and language filters

- Favorites management
  - UUID user ID validation
  - Positive integer song IDs
  - Batch sync with limits (500 max)

**Status**: ✅ Complete - 50+ test cases

---

### Request Security Tests (`__tests__/lib/request-security.test.ts`)
**Coverage Area**: CSRF protection and header injection prevention

Tests included:
- CSRF Origin validation
  - Origin header checking
  - Referer fallback
  - www/non-www variant handling
  - Localhost/127.0.0.1 support
  - Untrusted origin rejection

- Form header validation
  - Required custom header presence
  - Correct header value
  - Case-sensitive matching

- Header injection detection
  - Line feed (LF) detection
  - Carriage return (CR) detection
  - CRLF sequence detection
  - NEL (Next Line) detection
  - Line separator detection
  - Paragraph separator detection

- Line break stripping
  - Replacement with spaces
  - Multiple break handling
  - Tab preservation
  - Email injection prevention
  - Trim functionality

**Status**: ✅ Complete - 35+ test cases

---

### Rate Limiting Tests (`__tests__/lib/rate-limit.test.ts`)
**Coverage Area**: Rate limiting and IP detection

Tests included:
- Rate limit enforcement (fallback mode)
  - Request allowance under limit
  - Rejection at limit
  - Remaining count tracking
  - Reset timestamp accuracy
  - Per-key isolation
  - Window expiration handling

- Client IP extraction
  - cf-connecting-ip priority
  - x-real-ip fallback
  - x-forwarded-for fallback
  - First IP from proxy list
  - Precedence order
  - Whitespace trimming
  - IPv4 and IPv6 support
  - Unknown fallback

**Status**: ✅ Complete - 30+ test cases

---

### Favorites Management Tests (`__tests__/lib/favorites.test.ts`)
**Coverage Area**: Client-side favorite management with localStorage

Tests included:
- Device ID management
  - Creation and persistence
  - UUID generation
  - Reuse across calls
  - Server-side safety (returns empty)

- Local favorites CRUD
  - Get/set operations
  - Add/remove functionality
  - Duplicate prevention
  - Persistence validation
  - JSON error handling

- Favorite status checking
  - isLocalFavorite() validation
  - Bulk operations
  - Order preservation

- Integration scenarios
  - Complete workflow testing
  - Rapid operation handling
  - Cross-function persistence

**Status**: ✅ Complete - 45+ test cases

---

### API Error Handling Tests (`__tests__/lib/api/errors.test.ts`)
**Coverage Area**: API error formatting and status codes

Tests included:
- Error response structures
  - Validation errors with field details
  - 404 not found errors
  - 401 unauthorized errors
  - 403 forbidden errors
  - 500 server errors
  - 429 rate limit errors

- HTTP status code mapping
  - All standard error codes
  - Correct code ranges

**Status**: ✅ Complete - 20+ test cases

---

### Integration Tests (`__tests__/integration/data-flow.test.ts`)
**Coverage Area**: Cross-module data flow and workflows

Tests included:
- Song display workflow
  - Song object structure validation
  - Translation handling
  - Publish status checks

- Contact form workflow
  - Complete submission flow
  - Data validation
  - Invalid data rejection

- Favorites synchronization
  - Device favorites sync
  - Add/remove operations
  - Merge logic

- Search functionality
  - Query validation
  - Language filtering
  - Publish status filtering

- Authentication
  - Login flow
  - Admin access validation
  - Session expiration

- Content moderation
  - Security issue detection
  - Input sanitization
  - Header injection prevention

- Admin settings
  - Individual setting toggles
  - Independent setting changes
  - Persistence

- Email notifications
  - Single song notifications
  - Batch notifications
  - Email structure

**Status**: ✅ Complete - 25+ test cases

---

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Generate Coverage Report
```bash
npm run test:coverage
```

This will generate:
- Terminal coverage summary
- HTML coverage report in `coverage/` directory
- Coverage statistics for all covered files

## Coverage Requirements

The test suite is configured with the following coverage thresholds:
- **Lines**: 80%
- **Statements**: 80%
- **Functions**: 80%
- **Branches**: 80%

All tests pass or fail the build based on meeting these minimum thresholds.

## Test Statistics

| Category | Test Count | Status |
|----------|-----------|--------|
| Utils | 15+ | ✅ |
| Song Utils | 35+ | ✅ |
| Contact Validation | 40+ | ✅ |
| Song Validation | 50+ | ✅ |
| Request Security | 35+ | ✅ |
| Rate Limiting | 30+ | ✅ |
| Favorites | 45+ | ✅ |
| API Errors | 20+ | ✅ |
| Integration | 25+ | ✅ |
| **TOTAL** | **295+** | ✅ |

## Mocked Dependencies

The following modules are mocked in tests:
- `next/navigation` - Router, pathname, params utilities
- `next/headers` - Headers and cookies API
- `@vercel/kv` - Redis/KV store operations
- `localStorage` - Client storage (in jsdom)
- `crypto.randomUUID()` - UUID generation

## Testing Best Practices

1. **Isolation**: Each test is independent and doesn't rely on other tests
2. **Clarity**: Test names clearly describe what is being tested
3. **Arrangement**: Tests follow Arrange-Act-Assert pattern
4. **Coverage**: Tests cover both happy paths and error cases
5. **Mocking**: External dependencies are properly mocked
6. **Edge Cases**: Boundary conditions and edge cases are tested

## Adding New Tests

When adding new functionality:
1. Create a test file matching the source file name with `.test.ts` suffix
2. Place it in `__tests__/` directory with same folder structure
3. Test the happy path, error cases, and edge cases
4. Run coverage report to verify 80%+ coverage
5. Update this document with new test information

## CI/CD Integration

The test suite can be integrated with CI/CD:
```bash
npm run test:coverage -- --passWithNoTests
```

The coverage report can be submitted to coverage services:
- Codecov
- Coveralls
- Code Climate

## Troubleshooting

### Tests fail with "Cannot find module"
- Run `npm install`
- Check `jest.config.js` moduleNameMapper configuration

### LocalStorage errors
- Tests mock localStorage globally
- Ensure tests run in jsdom environment

### Next.js module errors
- next/navigation and next/headers are mocked in jest.setup.js
- Check jest.setup.js for required mocks

### Coverage not meeting threshold
- Run `npm run test:coverage` to see detailed report
- Review `coverage/` directory for file-specific breakdown
- Add tests for uncovered lines/branches

## References

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Next.js Testing](https://nextjs.org/docs/testing)

## Contributing

When contributing tests:
- Follow existing test structure and naming conventions
- Ensure new tests are isolated and repeatable
- Add comprehensive edge case coverage
- Update this guide with any new test files or categories
- Maintain or improve the 80% coverage threshold
