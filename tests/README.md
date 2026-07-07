# Edge Case Test Suite

This directory contains comprehensive edge case tests for the RAT LAB application.

## Test Structure

```
tests/
├── setup.ts                    # Test configuration and mocks
├── utils/
│   └── testHelpers.ts          # Test utilities and helpers
└── edge-cases/
    ├── token-exhaustion.test.ts      # Token exhaustion scenarios
    ├── network-failures.test.ts      # Network failure scenarios
    ├── concurrent-operations.test.ts # Concurrent operation scenarios
    ├── large-datasets.test.ts        # Large dataset performance
    ├── browser-refresh.test.ts       # Browser refresh scenarios
    └── index.test.ts                  # Main test suite
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm test -- --watch
```

### Run tests with UI
```bash
npm run test:ui
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm test -- token-exhaustion
```

## Test Categories

### 1. Token Exhaustion Tests
Tests scenarios where users run out of tokens:
- Token deduction on API calls
- Pre-flight token validation
- Token exhaustion during operations
- Token warning thresholds
- Concurrent token usage

### 2. Network Failure Tests
Tests network-related failures:
- Network timeouts
- Connection errors
- Rate limiting (429)
- Server errors (5xx)
- Client errors (4xx)
- Partial failures
- Retry logic

### 3. Concurrent Operations Tests
Tests concurrent operation scenarios:
- Multiple persona generations
- Multiple simulations
- Concurrent state updates
- Resource contention
- Concurrent Firebase saves

### 4. Large Dataset Tests
Tests performance with large datasets:
- 100+ personas
- 50+ segments
- 1000+ simulation results
- Memory usage
- Filtering and searching
- Pagination

### 5. Browser Refresh Tests
Tests browser refresh scenarios:
- State persistence
- In-progress operation recovery
- Token balance persistence
- Partial operation recovery
- Data integrity
- Session restoration

## Test Utilities

The `testHelpers.ts` file provides utilities for:
- Creating mock data (users, personas, segments, results)
- Creating large datasets for performance testing
- Mocking fetch requests
- Simulating token usage events
- Mock localStorage implementation

## Writing New Tests

When adding new edge case tests:

1. Create a new test file in `tests/edge-cases/`
2. Import necessary utilities from `tests/utils/testHelpers.ts`
3. Follow the existing test structure and naming conventions
4. Add descriptive test names and comments
5. Ensure tests are isolated and don't depend on each other

## Example Test

```typescript
import { describe, it, expect } from 'vitest';
import { createMockUser } from '../utils/testHelpers';

describe('My Edge Case', () => {
  it('should handle specific scenario', () => {
    const user = createMockUser({ tokens: 100 });
    // Test implementation
    expect(user.tokens).toBe(100);
  });
});
```

## Coverage Goals

- Token management: 100%
- Network error handling: 100%
- Concurrent operations: 90%+
- Large dataset performance: 80%+
- Browser refresh scenarios: 90%+

## Continuous Integration

These tests should be run:
- Before every commit
- In CI/CD pipeline
- Before production deployments
- When adding new features
