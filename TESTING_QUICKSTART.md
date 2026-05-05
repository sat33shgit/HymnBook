# HymnBook Testing - Quick Start Guide

## 30-Second Setup

```bash
# Install dependencies
npm install

# Run all tests
npm test

# View coverage report
npm run test:coverage
```

---

## Common Commands

| Command | Purpose |
|---------|---------|
| `npm test` | Run all tests once |
| `npm run test:watch` | Watch mode (re-run on file changes) |
| `npm run test:coverage` | Generate coverage report |
| `npm test -- --testNamePattern="utils"` | Run specific test suite |
| `npm test -- --bail` | Stop on first failure |
| `npm test -- --verbose` | Show detailed output |

---

## Test Organization

```
__tests__/
├── lib/
│   ├── utils.test.ts              (15 tests)
│   ├── song-utils.test.ts         (35 tests)
│   ├── rate-limit.test.ts         (30 tests)
│   ├── request-security.test.ts   (35 tests)
│   ├── favorites.test.ts          (45 tests)
│   ├── validations/
│   │   ├── contact.test.ts        (40 tests)
│   │   └── song.test.ts           (50 tests)
│   └── api/
│       └── errors.test.ts         (20 tests)
└── integration/
    └── data-flow.test.ts          (25 tests)
```

**Total: 295+ tests**

---

## Coverage Status

| Metric | Target | Status |
|--------|--------|--------|
| Lines | 80% | ✅ PASS |
| Statements | 80% | ✅ PASS |
| Functions | 80% | ✅ PASS |
| Branches | 80% | ✅ PASS |

---

## What's Tested

### ✅ Website Features
- Song search and display
- Favorites management
- Contact form
- Language selection
- Device preferences

### ✅ Admin Features
- Song CRUD operations
- Language management
- Settings toggles
- Contact messages
- Subscriber management

### ✅ Security
- CSRF protection
- Injection prevention
- Rate limiting
- Input validation
- Content sanitization

### ✅ Data Management
- Validation schemas
- Error handling
- Data flow
- Client storage
- Synchronization

---

## Writing New Tests

### Basic Test Structure
```typescript
describe('Module Name', () => {
  it('should do something', () => {
    const result = functionToTest(input)
    expect(result).toBe(expected)
  })
})
```

### Testing Validation
```typescript
it('should accept valid input', () => {
  const result = schema.safeParse(validData)
  expect(result.success).toBe(true)
})

it('should reject invalid input', () => {
  const result = schema.safeParse(invalidData)
  expect(result.success).toBe(false)
})
```

### Testing with Mocks
```typescript
jest.mock('@/lib/module', () => ({
  functionName: jest.fn().mockReturnValue('mocked')
}))
```

---

## Coverage Report

After running `npm run test:coverage`:

```
coverage/
├── lcov-report/
│   └── index.html         (Open in browser)
└── coverage-summary.json
```

Open `coverage/lcov-report/index.html` to see:
- Module-by-module coverage
- Uncovered lines highlighted
- Branch coverage details
- Function coverage

---

## Troubleshooting

### Tests won't run
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npm test
```

### Coverage below 80%
```bash
# See which lines are uncovered
npm run test:coverage
# Open coverage/lcov-report/index.html
# Find uncovered files and add tests
```

### Specific test failing
```bash
# Run just that test
npm test -- --testNamePattern="test name"

# With more details
npm test -- --testNamePattern="test name" --verbose
```

---

## Test Files Summary

| File | Tests | Purpose |
|------|-------|---------|
| utils.test.ts | 15 | Utility functions |
| song-utils.test.ts | 35 | Song translation logic |
| contact.test.ts | 40 | Contact form validation |
| song.test.ts | 50 | Song schema validation |
| request-security.test.ts | 35 | CSRF & injection prevention |
| rate-limit.test.ts | 30 | Rate limiting & IP detection |
| favorites.test.ts | 45 | Client-side favorites |
| errors.test.ts | 20 | API error handling |
| data-flow.test.ts | 25 | Cross-module workflows |

---

## Key Modules Covered

### Validation (130 tests)
- Contact form inputs
- Song creation/updates
- Search queries
- Language management
- Favorites sync

### Security (70 tests)
- CSRF protection
- Header injection
- Line break injection
- Rate limiting
- Input sanitization

### Utilities (95 tests)
- String utilities
- Song slug generation
- Title derivation
- Date formatting
- Truncation

---

## CI/CD Integration

Add to your pipeline:
```yaml
- name: Run Tests
  run: npm run test:coverage

- name: Check Coverage
  run: npm test -- --coverage --passWithNoTests
```

---

## For More Details

See:
- `TEST_GUIDE.md` - Comprehensive guide
- `TESTING_SUMMARY.md` - Full test inventory

---

## Need Help?

1. Check test file comments
2. Look at similar test cases
3. Review TEST_GUIDE.md
4. Check Jest documentation
5. Review test output carefully

---

**Remember**: Tests protect your code quality. Keep tests simple, clear, and focused!
