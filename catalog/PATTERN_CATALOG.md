# Testing Pattern Catalog

Reusable testing patterns organized by category with build priority tiers.

**Priority Tiers**:
- **P0 (Foundation)**: Implement first. Required for any project.
- **P1 (Standard)**: Implement once the codebase has API routes or a database.
- **P2 (Mature)**: Implement when the project reaches production or needs scale validation.

---

## Unit Testing Patterns

### Pure Function Testing [P0]

Test deterministic input/output with boundary values.

```ts
import { describe, it, expect } from 'vitest'
import { clamp } from './math'

describe('clamp', () => {
  it('returns value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('returns min when value is below range', () => {
    expect(clamp(-1, 0, 10)).toBe(0)
  })

  it('returns max when value is above range', () => {
    expect(clamp(11, 0, 10)).toBe(10)
  })

  it('handles equal min and max', () => {
    expect(clamp(5, 3, 3)).toBe(3)
  })
})
```

**Example:** `examples/unit/pure-functions/`

### Mocking Modules [P0]

Replace dependencies to isolate the unit under test.

```ts
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { getUser } from './user-service'

// Mock the entire module
vi.mock('./db', () => ({
  query: vi.fn(),
}))

import { query } from './db'

describe('getUser', () => {
  beforeEach(() => {
    vi.mocked(query).mockReset()
  })

  it('returns user when found', async () => {
    vi.mocked(query).mockResolvedValue([{ id: 1, name: 'Alice' }])

    const user = await getUser(1)

    expect(user).toEqual({ id: 1, name: 'Alice' })
    expect(query).toHaveBeenCalledWith('SELECT * FROM users WHERE id = ?', [1])
  })

  it('returns null when not found', async () => {
    vi.mocked(query).mockResolvedValue([])

    const user = await getUser(999)

    expect(user).toBeNull()
  })
})
```

**Example:** `examples/unit/mocking/`

### Testing Async Code [P0]

Handle promises, timers, and concurrent operations.

```ts
// Async/await
it('fetches data', async () => {
  const data = await fetchData('key-1')
  expect(data).toEqual({ value: 42 })
})

// Rejected promises
it('throws on invalid key', async () => {
  await expect(fetchData('')).rejects.toThrow('Key is required')
})

// Fake timers
it('debounces calls', async () => {
  vi.useFakeTimers()
  const fn = vi.fn()
  const debounced = debounce(fn, 300)

  debounced()
  debounced()
  debounced()

  expect(fn).not.toHaveBeenCalled()

  await vi.advanceTimersByTimeAsync(300)

  expect(fn).toHaveBeenCalledTimes(1)
  vi.useRealTimers()
})

// Concurrent
it('resolves all in parallel', async () => {
  const results = await Promise.all([
    fetchData('a'),
    fetchData('b'),
  ])
  expect(results).toHaveLength(2)
})
```

**Example:** `examples/unit/async-testing/`

### Testing Error Paths [P0]

Verify error handling, not just happy paths.

```ts
describe('parseConfig', () => {
  it('throws on invalid JSON', () => {
    expect(() => parseConfig('not json')).toThrow(SyntaxError)
  })

  it('throws on missing required fields', () => {
    expect(() => parseConfig('{}')).toThrow('Missing required field: name')
  })

  it('includes context in error message', () => {
    expect(() => parseConfig('{"name": ""}')).toThrow(
      expect.objectContaining({
        message: expect.stringContaining('name'),
        code: 'VALIDATION_ERROR',
      })
    )
  })
})
```

**Example:** `examples/unit/error-paths/`

---

## Integration Testing Patterns

### Supertest HTTP Testing [P1]

Test API routes with real middleware but without a running server.

```ts
import request from 'supertest'
import { app } from './app'
import { seedUsers } from './test/seed'

describe('GET /api/users', () => {
  beforeAll(async () => {
    await seedUsers(3)
  })

  it('returns paginated users', async () => {
    const res = await request(app)
      .get('/api/users')
      .query({ page: 1, limit: 2 })
      .set('Authorization', `Bearer ${testToken}`)
      .expect(200)

    expect(res.body.data).toHaveLength(2)
    expect(res.body.meta.total).toBe(3)
    expect(res.body.meta.page).toBe(1)
  })

  it('returns 401 without auth', async () => {
    await request(app)
      .get('/api/users')
      .expect(401)
  })

  it('validates query params', async () => {
    const res = await request(app)
      .get('/api/users')
      .query({ page: -1 })
      .set('Authorization', `Bearer ${testToken}`)
      .expect(400)

    expect(res.body.error).toMatch(/page/)
  })
})
```

**Example:** `examples/integration/supertest-api/`

### Testcontainers Database Testing [P1]

Real database in Docker for integration tests.

```ts
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'

let container: StartedPostgreSqlContainer
let db: ReturnType<typeof drizzle>

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:16-alpine').start()

  db = drizzle(container.getConnectionUri())
  await migrate(db, { migrationsFolder: './drizzle' })
}, 60_000) // container startup can be slow

afterAll(async () => {
  await container.stop()
})

afterEach(async () => {
  // Clean tables between tests for isolation
  await db.execute(sql`TRUNCATE users, orders CASCADE`)
})

it('creates and retrieves a user', async () => {
  const inserted = await db.insert(users).values({
    name: 'Alice',
    email: 'alice@test.com',
  }).returning()

  const found = await db.select().from(users).where(eq(users.id, inserted[0].id))

  expect(found[0].name).toBe('Alice')
})
```

### API Contract Testing [P1]

Validate response shapes against a schema to catch breaking changes.

```ts
import { z } from 'zod'

const UserResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.string().datetime(),
})

it('matches the user contract', async () => {
  const res = await request(app)
    .get('/api/users/1')
    .set('Authorization', `Bearer ${testToken}`)
    .expect(200)

  const parsed = UserResponseSchema.safeParse(res.body)
  expect(parsed.success).toBe(true)
})
```

---

## E2E Testing Patterns

### Playwright Login Flow [P1]

```ts
import { test, expect } from '@playwright/test'

test.describe('authentication', () => {
  test('logs in with valid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel('Email').fill('user@example.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: 'Log in' }).click()

    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel('Email').fill('wrong@example.com')
    await page.getByLabel('Password').fill('wrong')
    await page.getByRole('button', { name: 'Log in' }).click()

    await expect(page.getByText('Invalid credentials')).toBeVisible()
    await expect(page).toHaveURL('/login')
  })
})
```

### Playwright Form Submission [P1]

```ts
test('submits contact form', async ({ page }) => {
  await page.goto('/contact')

  await page.getByLabel('Name').fill('Alice')
  await page.getByLabel('Email').fill('alice@test.com')
  await page.getByLabel('Message').fill('Hello world')
  await page.getByRole('combobox', { name: 'Category' }).selectOption('support')

  await page.getByRole('button', { name: 'Send' }).click()

  await expect(page.getByText('Message sent')).toBeVisible()
})
```

### Visual Regression Testing [P2]

```ts
// playwright.config.ts
export default defineConfig({
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
    },
  },
})

// test
test('homepage matches snapshot', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveScreenshot('homepage.png', {
    fullPage: true,
  })
})

test('button states', async ({ page }) => {
  await page.goto('/components/button')

  // Default state
  const button = page.getByRole('button', { name: 'Submit' })
  await expect(button).toHaveScreenshot('button-default.png')

  // Hover state
  await button.hover()
  await expect(button).toHaveScreenshot('button-hover.png')
})
```

Update snapshots: `npx playwright test --update-snapshots`

---

## Mocking Patterns

### MSW Handler Setup [P0]

Reusable handlers shared across tests, dev server, and Storybook.

```ts
// mocks/handlers.ts
import { http, HttpResponse } from 'msw'
import { userFactory } from '../test/factories'

export const handlers = [
  http.get('/api/users', ({ request }) => {
    const url = new URL(request.url)
    const limit = Number(url.searchParams.get('limit') ?? 10)
    return HttpResponse.json(userFactory.buildList(limit))
  }),

  http.get('/api/users/:id', ({ params }) => {
    return HttpResponse.json(userFactory.build({ id: Number(params.id) }))
  }),

  http.post('/api/users', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json(
      userFactory.build(body as Partial<User>),
      { status: 201 }
    )
  }),

  http.delete('/api/users/:id', () => {
    return new HttpResponse(null, { status: 204 })
  }),
]

// mocks/server.ts — for Node/test
import { setupServer } from 'msw/node'
import { handlers } from './handlers'
export const server = setupServer(...handlers)

// test/setup.ts
import { server } from '../mocks/server'
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

**Example:** `examples/mocking/msw-handlers/`

### Factory Patterns with Fishery [P0]

```ts
import { Factory } from 'fishery'

// Basic factory
const userFactory = Factory.define<User>(({ sequence }) => ({
  id: sequence,
  name: `User ${sequence}`,
  email: `user${sequence}@test.com`,
  role: 'member',
  createdAt: new Date().toISOString(),
}))

// Traits via transient params
const userFactory = Factory.define<User>(({ sequence, transientParams }) => ({
  id: sequence,
  name: `User ${sequence}`,
  email: `user${sequence}@test.com`,
  role: transientParams.admin ? 'admin' : 'member',
  createdAt: new Date().toISOString(),
}))

// Associations
const postFactory = Factory.define<Post>(({ sequence, associations }) => ({
  id: sequence,
  title: `Post ${sequence}`,
  author: associations.author || userFactory.build(),
}))

// Usage
const post = postFactory.build({}, {
  associations: { author: userFactory.build({ name: 'Alice' }) },
})
```

**Example:** `examples/mocking/factories/`

### Snapshot Testing [P1]

Use for serializable output that should not change unexpectedly. Avoid for volatile data.

```ts
// Good: stable serializable output
it('renders user card', () => {
  const { container } = render(<UserCard user={userFactory.build()} />)
  expect(container).toMatchSnapshot()
})

// Better: inline snapshots for small values
it('formats address', () => {
  const result = formatAddress({ street: '123 Main', city: 'NYC', zip: '10001' })
  expect(result).toMatchInlineSnapshot(`"123 Main, NYC 10001"`)
})

// Update snapshots: vitest --update or jest --updateSnapshot
```

**When to use**: component render output, serialized configs, error messages.
**When to avoid**: timestamps, random IDs, large objects, frequently changing UI.

---

## Coverage Patterns

### c8/V8 Configuration [P0]

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',

      // Thresholds — CI fails if not met
      thresholds: {
        branches: 75,
        functions: 80,
        lines: 80,
        statements: 80,
      },

      // What to measure
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/**/index.ts',       // barrel exports
        'src/**/*.config.*',
        'src/test/**',
        'src/mocks/**',
      ],
    },
  },
})
```

### Threshold Enforcement in CI [P0]

```yaml
# .github/workflows/test.yml
- name: Test with coverage
  run: npx vitest run --coverage

# Coverage thresholds in vitest.config.ts will fail the step
# if any threshold is not met
```

```bash
# Local check
npx vitest run --coverage
# Outputs text table + fails with exit code 1 if thresholds not met
```

**Example:** `examples/coverage/vitest-coverage/`

### Coverage Anti-Patterns

| Do | Don't |
|---|---|
| Cover business logic and edge cases | Chase 100% line coverage |
| Focus on branch coverage | Count lines only |
| Exclude generated/config files | Include everything for inflated numbers |
| Set thresholds and enforce in CI | Rely on manual review of reports |
| Increase thresholds gradually | Set unrealistic thresholds on day one |

---

## Performance Testing Patterns

### k6 Load Test [P2]

```js
// tests/load/api-load.js
import http from 'k6/http'
import { check, group, sleep } from 'k6'
import { Rate } from 'k6/metrics'

const errorRate = new Rate('errors')

export const options = {
  stages: [
    { duration: '30s', target: 20 },    // warm up
    { duration: '1m',  target: 100 },   // ramp to load
    { duration: '2m',  target: 100 },   // sustain
    { duration: '30s', target: 0 },     // cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<300', 'p(99)<500'],
    errors: ['rate<0.01'],              // <1% error rate
  },
}

export default function () {
  group('list users', () => {
    const res = http.get('http://localhost:3000/api/users')
    check(res, {
      'status 200': (r) => r.status === 200,
      'response < 200ms': (r) => r.timings.duration < 200,
    }) || errorRate.add(1)
  })

  sleep(Math.random() * 2) // simulate think time
}
```

```bash
k6 run tests/load/api-load.js
k6 run --out json=results.json tests/load/api-load.js  # export results
```

### autocannon Benchmark [P2]

Quick HTTP benchmarks for local performance profiling.

```bash
# Simple benchmark: 100 connections, 10 seconds
npx autocannon -c 100 -d 10 http://localhost:3000/api/health

# With POST body
npx autocannon -c 50 -d 10 -m POST \
  -H "Content-Type: application/json" \
  -b '{"name":"test"}' \
  http://localhost:3000/api/users

# Programmatic
```

```ts
import autocannon from 'autocannon'

const result = await autocannon({
  url: 'http://localhost:3000/api/health',
  connections: 100,
  duration: 10,
})

console.log(`Avg latency: ${result.latency.average}ms`)
console.log(`Req/sec: ${result.requests.average}`)
console.log(`Throughput: ${result.throughput.average} bytes/sec`)
```

---

## Build Priority Summary

| Tier | Patterns | When |
|---|---|---|
| **P0** | Pure functions, mocking, async, errors, MSW, factories, coverage config | Day one |
| **P1** | Supertest, Testcontainers, API contracts, E2E flows, snapshots | Once you have API routes or a database |
| **P2** | Visual regression, k6 load tests, autocannon benchmarks | Pre-production, scale validation |
