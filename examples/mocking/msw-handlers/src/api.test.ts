import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import { getUsers, getUser, createUser, deleteUser } from './api'

// ---------------------------------------------------------------------------
// MSW lifecycle: start server, reset handlers between tests, stop at end
// ---------------------------------------------------------------------------
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ---------------------------------------------------------------------------
// GET /api/users
// ---------------------------------------------------------------------------
describe('getUsers', () => {
  it('returns list of users', async () => {
    const users = await getUsers()

    expect(users).toHaveLength(3)
    expect(users[0]).toEqual(
      expect.objectContaining({ name: 'Alice', email: 'alice@test.com' }),
    )
  })

  it('respects limit parameter', async () => {
    const users = await getUsers(2)

    expect(users).toHaveLength(2)
  })

  it('handles server error with server.use override', async () => {
    // Override the handler for this single test
    server.use(
      http.get('https://api.example.com/users', () => {
        return HttpResponse.json(
          { error: 'Internal Server Error' },
          { status: 500 },
        )
      }),
    )

    await expect(getUsers()).rejects.toThrow('Failed to fetch users: 500')
  })
})

// ---------------------------------------------------------------------------
// GET /api/users/:id
// ---------------------------------------------------------------------------
describe('getUser', () => {
  it('returns a single user by id', async () => {
    const user = await getUser(1)

    expect(user.id).toBe(1)
    expect(user.name).toBe('Alice')
  })

  it('throws on 404', async () => {
    await expect(getUser(999)).rejects.toThrow('Failed to fetch user 999: 404')
  })
})

// ---------------------------------------------------------------------------
// POST /api/users
// ---------------------------------------------------------------------------
describe('createUser', () => {
  it('creates a new user and returns it', async () => {
    const user = await createUser('Dave', 'dave@test.com')

    expect(user.name).toBe('Dave')
    expect(user.email).toBe('dave@test.com')
    expect(user.id).toBeGreaterThan(0)
  })

  it('throws on validation error', async () => {
    // Override to simulate missing fields
    server.use(
      http.post('https://api.example.com/users', () => {
        return HttpResponse.json(
          { error: 'name and email are required' },
          { status: 400 },
        )
      }),
    )

    await expect(createUser('', '')).rejects.toThrow('name and email are required')
  })
})

// ---------------------------------------------------------------------------
// DELETE /api/users/:id
// ---------------------------------------------------------------------------
describe('deleteUser', () => {
  it('deletes a user successfully', async () => {
    await expect(deleteUser(1)).resolves.toBeUndefined()
  })

  it('throws when user does not exist', async () => {
    await expect(deleteUser(999)).rejects.toThrow('Failed to delete user 999: 404')
  })
})

// ---------------------------------------------------------------------------
// Simulating network errors with server.use
// ---------------------------------------------------------------------------
describe('network error simulation', () => {
  it('handles network failure', async () => {
    server.use(
      http.get('https://api.example.com/users', () => {
        return HttpResponse.error()
      }),
    )

    await expect(getUsers()).rejects.toThrow()
  })

  it('simulates slow response with delay', async () => {
    server.use(
      http.get('https://api.example.com/users', async () => {
        // Simulate a very slow response
        await new Promise((resolve) => setTimeout(resolve, 100))
        return HttpResponse.json([])
      }),
    )

    const users = await getUsers()
    expect(users).toEqual([])
  })
})
