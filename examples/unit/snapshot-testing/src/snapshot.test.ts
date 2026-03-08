import { describe, it, expect } from 'vitest'
import {
  normalizeUser,
  buildDbConfig,
  describeHttpError,
  toCsv,
} from './generators'

// ---------------------------------------------------------------------------
// WHEN TO USE SNAPSHOT TESTING
//
// Good fit:
//   - Serializable output (objects, strings, config blobs)
//   - Functions with many output fields that are tedious to assert individually
//   - Error message catalogs or lookup tables
//   - CSV/JSON/template generation
//
// Bad fit:
//   - Output that changes on every run (timestamps, random IDs)
//   - Very large objects (snapshots become noise that reviewers skip)
//   - Boolean/numeric results (a direct assertion is clearer)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// normalizeUser — API response shape (inline snapshots)
// ---------------------------------------------------------------------------
describe('normalizeUser', () => {
  // Inline snapshots live right next to the test — ideal for small objects.
  // Run `vitest --update` to auto-fill or refresh the snapshot string.
  it('normalizes a complete API response', () => {
    const raw = {
      id: '42',
      name: 'Alice',
      email: 'Alice@Example.COM',
      role: 'admin',
      created_at: '2024-01-15T10:30:00Z',
    }

    expect(normalizeUser(raw)).toMatchInlineSnapshot(`
      {
        "createdAt": "2024-01-15T10:30:00Z",
        "email": "alice@example.com",
        "id": 42,
        "name": "Alice",
        "role": "admin",
      }
    `)
  })

  it('applies defaults for missing fields', () => {
    const raw = { id: 1 }

    expect(normalizeUser(raw)).toMatchInlineSnapshot(`
      {
        "createdAt": "1970-01-01T00:00:00.000Z",
        "email": "",
        "id": 1,
        "name": "Unknown",
        "role": "viewer",
      }
    `)
  })

  it('falls back to viewer for unknown roles', () => {
    const raw = { id: 7, name: 'Eve', email: 'eve@test.com', role: 'superuser' }

    expect(normalizeUser(raw)).toMatchInlineSnapshot(`
      {
        "createdAt": "1970-01-01T00:00:00.000Z",
        "email": "eve@test.com",
        "id": 7,
        "name": "Eve",
        "role": "viewer",
      }
    `)
  })
})

// ---------------------------------------------------------------------------
// buildDbConfig — config generation (file snapshots)
// ---------------------------------------------------------------------------
describe('buildDbConfig', () => {
  // File snapshots store the expected value in a .snap file alongside the test.
  // Good for larger objects where inline snapshots would clutter the test.
  it('generates default config when no env vars are set', () => {
    expect(buildDbConfig({})).toMatchSnapshot()
  })

  it('generates production config from env vars', () => {
    expect(
      buildDbConfig({
        DB_HOST: 'db.prod.internal',
        DB_PORT: '5433',
        DB_NAME: 'app_prod',
        DB_USER: 'app_service',
        DB_PASSWORD: 'secret',
        DB_SSL: 'true',
        DB_POOL_MIN: '5',
        DB_POOL_MAX: '20',
      }),
    ).toMatchSnapshot()
  })

  // Inline snapshot for a smaller config to show both styles in one file
  it('uses defaults for partial env', () => {
    expect(buildDbConfig({ DB_HOST: 'staging.db', DB_SSL: 'true' })).toMatchInlineSnapshot(`
      {
        "database": "app_dev",
        "host": "staging.db",
        "migrations": {
          "directory": "./migrations",
          "tableName": "schema_migrations",
        },
        "password": "",
        "pool": {
          "idleTimeoutMs": 30000,
          "max": 10,
          "min": 2,
        },
        "port": 5432,
        "ssl": true,
        "user": "postgres",
      }
    `)
  })
})

// ---------------------------------------------------------------------------
// describeHttpError — error message catalog (inline snapshots)
// ---------------------------------------------------------------------------
describe('describeHttpError', () => {
  // Snapshot each status code so a message change is caught in review
  it.each([
    200, 400, 401, 403, 404, 409, 422, 429, 500, 503, 999,
  ])('describes status %i', (status) => {
    expect(describeHttpError(status)).toMatchSnapshot()
  })
})

// ---------------------------------------------------------------------------
// toCsv — multi-line string output (inline snapshot)
// ---------------------------------------------------------------------------
describe('toCsv', () => {
  it('generates CSV from an array of objects', () => {
    const rows = [
      { name: 'Alice', age: 30, city: 'Portland' },
      { name: 'Bob', age: 25, city: 'Seattle' },
    ]

    expect(toCsv(rows)).toMatchInlineSnapshot(`
      "name,age,city
      Alice,30,Portland
      Bob,25,Seattle"
    `)
  })

  it('quotes values containing commas', () => {
    const rows = [
      { name: 'Smith, John', department: 'Engineering' },
    ]

    expect(toCsv(rows)).toMatchInlineSnapshot(`
      "name,department
      "Smith, John",Engineering"
    `)
  })

  it('returns empty string for empty input', () => {
    expect(toCsv([])).toMatchInlineSnapshot(`""`)
  })
})
