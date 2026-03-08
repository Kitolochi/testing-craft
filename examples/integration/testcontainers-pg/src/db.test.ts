import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import {
  connect,
  disconnect,
  runMigrations,
  createUser,
  getUserById,
  listUsers,
  updateUser,
  deleteUser,
  truncateUsers,
} from './db'

// ---------------------------------------------------------------------------
// Testcontainers + PostgreSQL — CRUD integration tests
// ---------------------------------------------------------------------------
// These tests run against a REAL PostgreSQL database started by the
// globalSetup (see global-setup.ts). The connection URI is passed via
// the DATABASE_URL environment variable.
//
// Lifecycle:
//   globalSetup  → starts PostgreSQL container, sets DATABASE_URL
//   beforeAll    → connects pool, runs migrations
//   afterEach    → truncates tables for test isolation
//   afterAll     → disconnects pool
//   globalTeardown → stops PostgreSQL container
//
// Why real Postgres instead of mocks?
//   - Catches SQL syntax errors, constraint violations, type mismatches
//   - Tests transactions, unique indexes, and cascades
//   - Gives confidence that queries work with the actual database engine
// ---------------------------------------------------------------------------

beforeAll(async () => {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL not set — is globalSetup running?')
  }
  connect(databaseUrl)
  await runMigrations()
})

afterEach(async () => {
  // Clean slate between tests — TRUNCATE is faster than DELETE
  await truncateUsers()
})

afterAll(async () => {
  await disconnect()
})

// ---------------------------------------------------------------------------
// CREATE
// ---------------------------------------------------------------------------
describe('createUser', () => {
  it('inserts a user and returns it with an auto-generated id', async () => {
    const user = await createUser({ name: 'Alice', email: 'alice@test.com' })

    expect(user.id).toBeGreaterThan(0)
    expect(user.name).toBe('Alice')
    expect(user.email).toBe('alice@test.com')
    expect(user.created_at).toBeInstanceOf(Date)
  })

  it('auto-increments ids for successive inserts', async () => {
    const first = await createUser({ name: 'Alice', email: 'alice@test.com' })
    const second = await createUser({ name: 'Bob', email: 'bob@test.com' })

    expect(second.id).toBeGreaterThan(first.id)
  })

  it('rejects duplicate emails with a unique constraint error', async () => {
    await createUser({ name: 'Alice', email: 'alice@test.com' })

    // Inserting the same email again should throw a pg unique violation
    await expect(
      createUser({ name: 'Alice Clone', email: 'alice@test.com' }),
    ).rejects.toThrow(/unique/)
  })
})

// ---------------------------------------------------------------------------
// READ
// ---------------------------------------------------------------------------
describe('getUserById', () => {
  it('returns the user when found', async () => {
    const created = await createUser({ name: 'Alice', email: 'alice@test.com' })

    const found = await getUserById(created.id)

    expect(found).not.toBeNull()
    expect(found!.name).toBe('Alice')
    expect(found!.email).toBe('alice@test.com')
  })

  it('returns null when user does not exist', async () => {
    const found = await getUserById(999)

    expect(found).toBeNull()
  })
})

describe('listUsers', () => {
  it('returns empty array when no users exist', async () => {
    const users = await listUsers()

    expect(users).toEqual([])
  })

  it('returns all users ordered by id', async () => {
    await createUser({ name: 'Carol', email: 'carol@test.com' })
    await createUser({ name: 'Alice', email: 'alice@test.com' })
    await createUser({ name: 'Bob', email: 'bob@test.com' })

    const users = await listUsers()

    expect(users).toHaveLength(3)
    // Ordered by id (insertion order), not alphabetically
    expect(users[0].name).toBe('Carol')
    expect(users[1].name).toBe('Alice')
    expect(users[2].name).toBe('Bob')
  })
})

// ---------------------------------------------------------------------------
// UPDATE
// ---------------------------------------------------------------------------
describe('updateUser', () => {
  it('updates the name and returns the modified user', async () => {
    const created = await createUser({ name: 'Alice', email: 'alice@test.com' })

    const updated = await updateUser(created.id, { name: 'Alice Updated' })

    expect(updated).not.toBeNull()
    expect(updated!.name).toBe('Alice Updated')
    expect(updated!.email).toBe('alice@test.com') // unchanged
  })

  it('updates the email', async () => {
    const created = await createUser({ name: 'Alice', email: 'alice@test.com' })

    const updated = await updateUser(created.id, { email: 'newalice@test.com' })

    expect(updated!.email).toBe('newalice@test.com')
  })

  it('updates both name and email at once', async () => {
    const created = await createUser({ name: 'Alice', email: 'alice@test.com' })

    const updated = await updateUser(created.id, {
      name: 'Bob',
      email: 'bob@test.com',
    })

    expect(updated!.name).toBe('Bob')
    expect(updated!.email).toBe('bob@test.com')
  })

  it('returns null when updating a non-existent user', async () => {
    const result = await updateUser(999, { name: 'Ghost' })

    expect(result).toBeNull()
  })

  it('rejects update to a duplicate email', async () => {
    await createUser({ name: 'Alice', email: 'alice@test.com' })
    const bob = await createUser({ name: 'Bob', email: 'bob@test.com' })

    await expect(
      updateUser(bob.id, { email: 'alice@test.com' }),
    ).rejects.toThrow(/unique/)
  })
})

// ---------------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------------
describe('deleteUser', () => {
  it('deletes an existing user and returns true', async () => {
    const created = await createUser({ name: 'Alice', email: 'alice@test.com' })

    const deleted = await deleteUser(created.id)

    expect(deleted).toBe(true)

    // Verify the user is gone
    const found = await getUserById(created.id)
    expect(found).toBeNull()
  })

  it('returns false when user does not exist', async () => {
    const deleted = await deleteUser(999)

    expect(deleted).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Table isolation — verify truncate works between tests
// ---------------------------------------------------------------------------
describe('test isolation', () => {
  it('starts with an empty table (first test)', async () => {
    const users = await listUsers()
    expect(users).toHaveLength(0)
  })

  it('data from previous test is gone (second test)', async () => {
    // Insert a user in this test
    await createUser({ name: 'Ephemeral', email: 'ephemeral@test.com' })
    const users = await listUsers()
    expect(users).toHaveLength(1)
  })

  it('previous test data was cleaned up (third test)', async () => {
    // afterEach truncated the table, so we should start fresh
    const users = await listUsers()
    expect(users).toHaveLength(0)
  })
})
