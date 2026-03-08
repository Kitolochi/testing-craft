# Testing Decision Frameworks

Opinionated guides for common testing choices. Each section gives a default, explains when to deviate, and provides a comparison table.

---

## Testing Strategy: The Trophy Shape

**Default approach:** Integration-first (trophy shape, not pyramid).

The testing trophy prioritizes:
1. **Static analysis** (TypeScript, ESLint) — catches typos and type errors instantly
2. **Integration tests** (biggest section) — test modules working together through public APIs
3. **Unit tests** — only for pure logic, algorithms, and edge cases
4. **E2E tests** (smallest section) — critical user journeys only

**Why not the test pyramid?**
The pyramid over-emphasizes unit tests, leading to brittle tests that break on refactoring. Integration tests give more confidence per test because they exercise real interactions between modules.

**Rules of thumb:**
- Write integration tests by default
- Write unit tests for pure functions with complex logic or many edge cases
- Write E2E tests for the 5-10 most critical user flows
- If a test mocks more than it tests, it's probably at the wrong level
- If a test breaks every time you refactor internals, it's testing implementation

| Level | Coverage target | What to test | What to avoid |
|-------|----------------|--------------|---------------|
| Static | 100% (TS strict) | Type errors, unused vars | Over-typing internals |
| Unit | Complex logic only | Pure functions, algorithms | Mocking frameworks |
| Integration | 80%+ of features | API routes, DB queries, services | External APIs (mock those) |
| E2E | Critical paths | Login, checkout, signup | Every permutation |

**Our pick:** Integration tests as the default, units for algorithms, E2E for critical flows. Let TypeScript handle the rest.

---

## Test Runner: Vitest vs Jest

**Default choice:** Vitest — faster, ESM-native, same API as Jest, better DX.

**Choose Vitest when:** You're starting a new project, using Vite or any ESM-first toolchain, want faster test execution, or need built-in TypeScript support without transforms.

**Choose Jest when:** You have a large existing Jest test suite, need React Native testing (Vitest browser mode doesn't support RN), or your team knows Jest and switching cost outweighs benefits.

| Factor | Vitest | Jest |
|--------|--------|------|
| Speed | 2-10x faster (native ESM, HMR) | Slower (transform step) |
| ESM support | Native | Experimental (--experimental-vm-modules) |
| TypeScript | Zero config | Needs ts-jest or @swc/jest |
| Config | vitest.config.ts | jest.config.ts |
| API compatibility | Jest-compatible | — |
| Watch mode | Instant (Vite HMR) | Fast (file watcher) |
| Browser testing | Built-in (Browser Mode) | Needs separate setup |
| Snapshot testing | Yes | Yes |
| Coverage | v8 or istanbul | istanbul |
| Community/ecosystem | Growing fast | Largest |
| Migration effort | Low (API compatible) | — |

**Our pick:** Vitest for all new projects. Migrate from Jest when velocity matters more than migration cost.

---

## Visual Regression: Vitest Screenshots vs Playwright vs Percy/Chromatic

**Default choice:** Vitest Browser Mode screenshots — zero external dependencies, integrated into your test runner.

**Choose Vitest screenshots when:** You want visual tests alongside unit/integration tests, don't need cross-browser visual testing, and want the simplest setup.

**Choose Playwright screenshots when:** You need cross-browser visual testing (Chrome + Firefox + Safari), want fine-grained screenshot options (masking, animations), or already use Playwright for E2E.

**Choose Percy/Chromatic when:** You need cloud-based visual review workflows, cross-browser rendering on real browsers, or team-based approval processes for visual changes.

| Factor | Vitest Browser | Playwright | Percy/Chromatic |
|--------|---------------|------------|-----------------|
| Setup complexity | Low | Low | Medium |
| Cost | Free | Free | Free tier + $$ |
| Cross-browser | Chromium (default) | Chrome, Firefox, Safari | All browsers |
| CI integration | Standard | Standard | Cloud service |
| Review workflow | Git diff | Git diff | Web UI (excellent) |
| Component-level | Yes | Page-level | Both |
| Flakiness handling | Threshold | Threshold | AI-powered |
| Maintenance burden | Low | Low | Low (cloud managed) |

**Our pick:** Vitest Browser Mode for component visual tests. Playwright screenshots for full-page E2E visuals. Percy/Chromatic only if you need multi-browser or team review workflows.

---

## E2E: Playwright Patterns + When to Use What

**Default choice:** Playwright — fastest, most reliable, best TypeScript support, all browsers.

**Testing patterns by feature type:**

| Feature | Test approach | Why |
|---------|--------------|-----|
| Login flow | E2E (Playwright) | Critical path, touches auth, redirects, cookies |
| Form validation | Integration (Vitest) | Test validation logic, not DOM manipulation |
| API endpoint | Integration (supertest) | Fast, no browser needed |
| Dashboard data | Integration (component) | Test data transformation, not layout |
| Checkout flow | E2E (Playwright) | Multi-step, payments, critical revenue path |
| Admin permissions | Integration (API) | Test authorization logic, not UI clicks |
| Responsive layout | Visual (Playwright) | Screenshot at multiple viewports |
| Accessibility | E2E (axe-core) | Needs real DOM rendering |

**Playwright best practices:**
- Use `data-testid` for test selectors, never CSS classes or XPath
- Use `page.getByRole()` and `page.getByLabel()` for accessibility-friendly selectors
- Use `test.step()` for readable multi-step tests
- Use page object models only when you have 10+ tests per page
- Parallelize with `test.describe.parallel` for independent tests
- Use `expect(page).toHaveScreenshot()` for visual regression in the same suite

**Our pick:** Playwright for all E2E testing. Write fewer but more meaningful E2E tests covering critical user journeys.
