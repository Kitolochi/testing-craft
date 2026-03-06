import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { app, resetStore, seedUsers, AUTH_TOKEN } from './app'

const authHeader = `Bearer ${AUTH_TOKEN}`

beforeEach(() => {
  resetStore()
})

// ---------------------------------------------------------------------------
// Auth middleware
// ---------------------------------------------------------------------------
describe('authentication', () => {
  it('returns 401 without Authorization header', async () => {
    const res = await request(app).get('/api/users').expect(401)

    expect(res.body.error).toBe('Authorization header required')
  })

  it('returns 403 with invalid token', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', 'Bearer wrong-token')
      .expect(403)

    expect(res.body.error).toBe('Invalid token')
  })

  it('succeeds with valid token', async () => {
    await request(app)
      .get('/api/users')
      .set('Authorization', authHeader)
      .expect(200)
  })
})

// ---------------------------------------------------------------------------
// GET /api/users
// ---------------------------------------------------------------------------
describe('GET /api/users', () => {
  beforeEach(() => {
    seedUsers([
      { name: 'Alice', email: 'alice@test.com' },
      { name: 'Bob', email: 'bob@test.com' },
      { name: 'Carol', email: 'carol@test.com' },
      { name: 'Dave', email: 'dave@test.com' },
      { name: 'Eve', email: 'eve@test.com' },
    ])
  })

  it('returns paginated users', async () => {
    const res = await request(app)
      .get('/api/users')
      .query({ page: 1, limit: 2 })
      .set('Authorization', authHeader)
      .expect(200)

    expect(res.body.data).toHaveLength(2)
    expect(res.body.meta).toEqual({
      total: 5,
      page: 1,
      limit: 2,
      totalPages: 3,
    })
  })

  it('returns second page', async () => {
    const res = await request(app)
      .get('/api/users')
      .query({ page: 2, limit: 2 })
      .set('Authorization', authHeader)
      .expect(200)

    expect(res.body.data).toHaveLength(2)
    expect(res.body.data[0].name).toBe('Carol')
    expect(res.body.meta.page).toBe(2)
  })

  it('returns empty data for page beyond range', async () => {
    const res = await request(app)
      .get('/api/users')
      .query({ page: 100, limit: 10 })
      .set('Authorization', authHeader)
      .expect(200)

    expect(res.body.data).toHaveLength(0)
  })

  it('filters by search query', async () => {
    const res = await request(app)
      .get('/api/users')
      .query({ search: 'alice' })
      .set('Authorization', authHeader)
      .expect(200)

    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].name).toBe('Alice')
  })

  it('returns 400 for invalid page', async () => {
    const res = await request(app)
      .get('/api/users')
      .query({ page: -1 })
      .set('Authorization', authHeader)
      .expect(400)

    expect(res.body.error).toMatch(/page/)
  })

  it('returns 400 for invalid limit', async () => {
    const res = await request(app)
      .get('/api/users')
      .query({ limit: 0 })
      .set('Authorization', authHeader)
      .expect(400)

    expect(res.body.error).toMatch(/limit/)
  })
})

// ---------------------------------------------------------------------------
// GET /api/users/:id
// ---------------------------------------------------------------------------
describe('GET /api/users/:id', () => {
  beforeEach(() => {
    seedUsers([{ name: 'Alice', email: 'alice@test.com' }])
  })

  it('returns a user by id', async () => {
    const res = await request(app)
      .get('/api/users/1')
      .set('Authorization', authHeader)
      .expect(200)

    expect(res.body).toEqual({ id: 1, name: 'Alice', email: 'alice@test.com' })
  })

  it('returns 404 for unknown id', async () => {
    const res = await request(app)
      .get('/api/users/999')
      .set('Authorization', authHeader)
      .expect(404)

    expect(res.body.error).toMatch(/999/)
  })
})

// ---------------------------------------------------------------------------
// POST /api/users
// ---------------------------------------------------------------------------
describe('POST /api/users', () => {
  it('creates a new user', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', authHeader)
      .send({ name: 'Zara', email: 'zara@test.com' })
      .expect(201)

    expect(res.body).toEqual({
      id: expect.any(Number),
      name: 'Zara',
      email: 'zara@test.com',
    })
  })

  it('returns 400 for missing name', async () => {
    await request(app)
      .post('/api/users')
      .set('Authorization', authHeader)
      .send({ email: 'no-name@test.com' })
      .expect(400)
  })

  it('returns 400 for invalid email', async () => {
    await request(app)
      .post('/api/users')
      .set('Authorization', authHeader)
      .send({ name: 'Test', email: 'not-an-email' })
      .expect(400)
  })

  it('returns 409 for duplicate email', async () => {
    seedUsers([{ name: 'Alice', email: 'alice@test.com' }])

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', authHeader)
      .send({ name: 'Alice2', email: 'alice@test.com' })
      .expect(409)

    expect(res.body.error).toBe('email already exists')
  })
})

// ---------------------------------------------------------------------------
// PUT /api/users/:id
// ---------------------------------------------------------------------------
describe('PUT /api/users/:id', () => {
  beforeEach(() => {
    seedUsers([{ name: 'Alice', email: 'alice@test.com' }])
  })

  it('updates a user', async () => {
    const res = await request(app)
      .put('/api/users/1')
      .set('Authorization', authHeader)
      .send({ name: 'Alice Updated' })
      .expect(200)

    expect(res.body.name).toBe('Alice Updated')
    expect(res.body.email).toBe('alice@test.com') // unchanged
  })

  it('returns 404 for unknown user', async () => {
    await request(app)
      .put('/api/users/999')
      .set('Authorization', authHeader)
      .send({ name: 'Ghost' })
      .expect(404)
  })

  it('returns 409 when updating to duplicate email', async () => {
    seedUsers([{ name: 'Bob', email: 'bob@test.com' }])

    await request(app)
      .put('/api/users/1')
      .set('Authorization', authHeader)
      .send({ email: 'bob@test.com' })
      .expect(409)
  })
})

// ---------------------------------------------------------------------------
// DELETE /api/users/:id
// ---------------------------------------------------------------------------
describe('DELETE /api/users/:id', () => {
  beforeEach(() => {
    seedUsers([{ name: 'Alice', email: 'alice@test.com' }])
  })

  it('deletes a user', async () => {
    await request(app)
      .delete('/api/users/1')
      .set('Authorization', authHeader)
      .expect(204)

    // Verify it's gone
    await request(app)
      .get('/api/users/1')
      .set('Authorization', authHeader)
      .expect(404)
  })

  it('returns 404 for unknown user', async () => {
    await request(app)
      .delete('/api/users/999')
      .set('Authorization', authHeader)
      .expect(404)
  })
})
