# Testing Toolkit Reference

Comprehensive catalog of JavaScript/TypeScript testing tools, frameworks, and practices.

---

## Test Runners

### Decision Matrix

| Criteria | Vitest | Jest 30 | node:test |
|---|---|---|---|
| **Cold start** | ~150ms (4x faster than Jest) | ~600ms | ~25ms (600% faster than Jest) |
| **Memory** | 30% less than Jest | Baseline | Minimal (zero deps) |
| **ESM support** | Native, zero-config | Improved in v30, still needs flags | Native |
| **TypeScript** | Native via esbuild/SWC | Requires ts-jest or SWC transform | Requires loader (`--loader tsx`) |
| **Watch mode** | Smart, Vite-powered HMR | `--watch` with haste | `--watch` flag (Node 22+) |
| **Browser mode** | Stable in v4.0 | jsdom/happy-dom only | N/A |
| **Ecosystem** | Growing, Jest-compatible API | Largest, most mature | Node built-in, small ecosystem |
| **Best for** | Vite projects, new greenfield | React Native, legacy codebases | Libraries, zero-dep projects, CI speed |

### When to Choose

- **Vitest**: Default choice for new projects. Fastest DX, native ESM+TS, browser mode.
- **Jest 30**: Required for React Native. Choose when team already knows Jest deeply.
- **node:test**: Maximum speed, zero dependencies. Ideal for libraries and CI pipelines.

### Install

```bash
# Vitest
npm i -D vitest

# Jest 30
npm i -D jest@next @jest/globals
npm i -D ts-jest  # for TypeScript

# node:test (built-in, Node 20+)
# No install needed. Import:
# import { test, describe } from 'node:test'
# import assert from 'node:assert/strict'
```

---

## Unit Testing

### Mocking with Vitest

```ts
// vi.mock — module-level mock
vi.mock('./db', () => ({
  getUser: vi.fn().mockResolvedValue({ id: 1, name: 'Alice' }),
}))

// vi.spyOn — spy on existing method
const spy = vi.spyOn(service, 'save')
spy.mockReturnValue(true)

// vi.fn — standalone stub
const callback = vi.fn()
callback.mockImplementation((x) => x * 2)

// vi.stubGlobal — mock globals
vi.stubGlobal('fetch', vi.fn())

// Restore
afterEach(() => { vi.restoreAllMocks() })
```

### Assertions

```ts
// Vitest (same API as Jest)
expect(result).toBe(42)
expect(obj).toEqual({ a: 1 })
expect(fn).toHaveBeenCalledWith('arg')
expect(fn).toHaveBeenCalledTimes(2)
expect(promise).resolves.toBe('done')
expect(() => fn()).toThrow(/invalid/)

// node:assert/strict
assert.strictEqual(result, 42)
assert.deepStrictEqual(obj, { a: 1 })
assert.rejects(() => fn(), /invalid/)
```

---

## Integration Testing

### Supertest (HTTP)

Test Express/Koa/Fastify handlers without starting a server.

```bash
npm i -D supertest @types/supertest
```

```ts
import request from 'supertest'
import { app } from './app'

test('POST /users creates user', async () => {
  const res = await request(app)
    .post('/users')
    .send({ name: 'Alice', email: 'a@b.com' })
    .expect(201)
    .expect('Content-Type', /json/)

  expect(res.body.id).toBeDefined()
  expect(res.body.name).toBe('Alice')
})
```

### Testcontainers (Docker Services)

Spin up real databases/services in tests. Production-like, disposable.

```bash
npm i -D testcontainers
```

```ts
import { PostgreSqlContainer } from '@testcontainers/postgresql'

let container: StartedPostgreSqlContainer

beforeAll(async () => {
  container = await new PostgreSqlContainer()
    .withDatabase('testdb')
    .start()
  // container.getConnectionUri() -> postgres://test:test@localhost:xxxxx/testdb
}, 60_000)

afterAll(async () => { await container.stop() })
```

Supports: PostgreSQL, MySQL, Redis, MongoDB, Kafka, Elasticsearch, and any Docker image.

---

## E2E Testing

### Playwright vs Cypress

| Criteria | Playwright | Cypress |
|---|---|---|
| **Speed** | 23% faster (native parallelization) | Single-threaded by default |
| **Browsers** | Chromium, Firefox, WebKit (Safari) | Chromium, Firefox, Edge (no Safari) |
| **Parallelism** | Built-in workers, sharding | Requires Cypress Cloud or orchestration |
| **Debugging** | Trace viewer, VS Code extension | Time-travel, best-in-class DevTools |
| **Language** | JS/TS, Python, Java, C# | JS/TS only |
| **Network control** | Route API, HAR replay | `cy.intercept()` |
| **Multi-tab/origin** | Native support | Limited |
| **Component testing** | Experimental | Stable |
| **CI cost** | Free parallel | Cloud paid for parallel |
| **Best for** | Cross-browser, parallel CI, complex flows | Developer DX, visual debugging |

### Install

```bash
# Playwright
npm i -D @playwright/test
npx playwright install

# Cypress
npm i -D cypress
npx cypress open
```

---

## Mocking

### MSW (Mock Service Worker)

Intercepts at network level. Works in browser, Node, and Storybook. Reusable handlers across dev/test.

```bash
npm i -D msw
```

```ts
// handlers.ts — shared across all contexts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: 1, name: 'Alice' },
    ])
  }),
  http.post('/api/users', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json(body, { status: 201 })
  }),
]

// test setup
import { setupServer } from 'msw/node'
const server = setupServer(...handlers)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// per-test override
server.use(
  http.get('/api/users', () => HttpResponse.json([], { status: 500 }))
)
```

### Nock (Node HTTP)

Lower-level HTTP mocking for Node only. Good for testing HTTP clients directly.

```bash
npm i -D nock
```

```ts
import nock from 'nock'

nock('https://api.example.com')
  .get('/users')
  .reply(200, [{ id: 1 }])
```

---

## Fixtures & Factories

### Fishery

TypeScript-first factory library for generating test data.

```bash
npm i -D fishery
```

```ts
import { Factory } from 'fishery'

interface User {
  id: number
  name: string
  email: string
  admin: boolean
}

const userFactory = Factory.define<User>(({ sequence }) => ({
  id: sequence,
  name: `User ${sequence}`,
  email: `user${sequence}@test.com`,
  admin: false,
}))

// Usage
const user = userFactory.build()                       // single
const admin = userFactory.build({ admin: true })       // override
const users = userFactory.buildList(5)                 // batch
const persisted = await userFactory.create()           // with async onCreate hook
```

### Database Seeding Pattern

```ts
// seed.ts — reusable across tests
export async function seedUsers(db: Database, count = 3) {
  const users = userFactory.buildList(count)
  await db.insert(usersTable).values(users)
  return users
}
```

---

## Coverage

### c8 (V8-Native)

More accurate than Istanbul. Measures what V8 actually executes.

```bash
npm i -D c8
# or use Vitest's built-in v8 provider
```

```jsonc
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',          // or 'istanbul'
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        branches: 75,
        functions: 80,
        lines: 80,
        statements: 80,
      },
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
    },
  },
})
```

### What to Cover

- **Branch coverage > line coverage**. A line can execute without testing all paths.
- **Target 70-80%** overall. 100% is a false goal that encourages testing implementation details.
- **Always cover**: business logic, data transformations, error paths, edge cases.
- **Skip coverage on**: generated code, type definitions, config files, simple pass-through wrappers.

### Threshold Enforcement in CI

```bash
vitest run --coverage  # fails CI if thresholds not met
```

---

## Testing Patterns

### AAA (Arrange-Act-Assert)

```ts
test('calculates total with discount', () => {
  // Arrange
  const cart = createCart([item(10), item(20)])
  const discount = 0.1

  // Act
  const total = calculateTotal(cart, discount)

  // Assert
  expect(total).toBe(27)
})
```

### Given-When-Then (BDD)

```ts
describe('checkout', () => {
  it('applies loyalty discount for premium members', () => {
    // Given
    const member = userFactory.build({ tier: 'premium' })
    const order = orderFactory.build({ subtotal: 100 })

    // When
    const result = checkout(member, order)

    // Then
    expect(result.discount).toBe(15)
    expect(result.total).toBe(85)
  })
})
```

### FIRST Principles

| Principle | Meaning |
|---|---|
| **F**ast | Tests run in milliseconds. Slow tests get skipped. |
| **I**ndependent | No test depends on another's state or execution order. |
| **R**epeatable | Same result every time, any machine, any order. |
| **S**elf-validating | Pass or fail, no manual output inspection. |
| **T**imely | Written before or alongside the code, not months later. |

---

## Component Testing

### React Testing Library

```bash
npm i -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

```ts
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

test('submits form with user input', async () => {
  const onSubmit = vi.fn()
  render(<LoginForm onSubmit={onSubmit} />)

  await userEvent.type(screen.getByLabelText('Email'), 'a@b.com')
  await userEvent.type(screen.getByLabelText('Password'), 'secret')
  await userEvent.click(screen.getByRole('button', { name: /log in/i }))

  expect(onSubmit).toHaveBeenCalledWith({
    email: 'a@b.com',
    password: 'secret',
  })
})
```

**Key principles**: Query by role/label (accessible selectors) > test ID > class/tag. Test behavior, not implementation.

### Storybook

```bash
npx storybook@latest init
npm i -D @storybook/test
```

Component isolation + visual documentation + interaction testing. Pairs with MSW for data mocking.

---

## Performance Testing

### k6 (Load Testing)

JavaScript-based, Grafana ecosystem.

```bash
# Install: https://grafana.com/docs/k6/latest/set-up/install-k6/
# or: brew install k6 / choco install k6
```

```js
// load-test.js
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '30s', target: 50 },   // ramp up
    { duration: '1m',  target: 50 },   // hold
    { duration: '10s', target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],   // 95th percentile < 200ms
  },
}

export default function () {
  const res = http.get('http://localhost:3000/api/users')
  check(res, { 'status 200': (r) => r.status === 200 })
  sleep(1)
}
```

```bash
k6 run load-test.js
```

### autocannon (HTTP Benchmarking)

Quick HTTP benchmarks from Node.

```bash
npm i -D autocannon
```

```bash
npx autocannon -c 100 -d 10 http://localhost:3000/api/health
# -c connections, -d duration (seconds)
```

---

## Testing Pyramid

```
        /  E2E  \          ~2%   — Critical user flows only
       / Integr. \         ~8%   — API boundaries, DB queries
      / Component  \      ~20%   — UI components in isolation
     /    Unit      \     ~70%   — Pure logic, transforms, utils
    ------------------
```

More unit tests = faster feedback. E2E tests validate the system works end-to-end but are slow and brittle. Optimize for the base of the pyramid.
