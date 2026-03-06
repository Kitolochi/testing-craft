# testing-craft

Reference catalogs for JavaScript/TypeScript testing — tools, patterns, and decision frameworks.

## Structure

```
testing-craft/
  catalog/
    TESTING_TOOLKIT.md   — Tool reference: runners, mocking, coverage, E2E, performance
    PATTERN_CATALOG.md   — Reusable patterns with priority tiers (P0/P1/P2)
  examples/              — Runnable example code
```

## Coverage

- **Runners**: Vitest, Jest 30, node:test
- **Unit**: vi.mock, spies, stubs, fake timers
- **Integration**: Supertest, Testcontainers
- **E2E**: Playwright, Cypress
- **Mocking**: MSW, Nock, Fishery factories
- **Coverage**: c8/V8, threshold enforcement
- **Performance**: k6, autocannon
- **Patterns**: AAA, Given-When-Then, FIRST, testing pyramid
- **Components**: React Testing Library, Storybook
