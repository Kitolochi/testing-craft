import express, { Request, Response, NextFunction } from 'express'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface User {
  id: number
  name: string
  email: string
}

// ---------------------------------------------------------------------------
// In-memory store (reset-able for tests)
// ---------------------------------------------------------------------------
let nextId = 1
let users: User[] = []

export function resetStore() {
  nextId = 1
  users = []
}

export function seedUsers(items: Array<{ name: string; email: string }>) {
  items.forEach((item) => {
    users.push({ id: nextId++, ...item })
  })
}

// ---------------------------------------------------------------------------
// Auth middleware
// ---------------------------------------------------------------------------
const AUTH_TOKEN = 'test-token-123'

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization header required' })
    return
  }

  const token = header.slice(7)
  if (token !== AUTH_TOKEN) {
    res.status(403).json({ error: 'Invalid token' })
    return
  }

  next()
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export const app = express()
app.use(express.json())

// GET /api/users — list with pagination and search
app.get('/api/users', requireAuth, (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1)
  const limit = Number(req.query.limit ?? 10)
  const search = (req.query.search as string) ?? ''

  if (page < 1) {
    res.status(400).json({ error: 'page must be >= 1' })
    return
  }

  if (limit < 1 || limit > 100) {
    res.status(400).json({ error: 'limit must be between 1 and 100' })
    return
  }

  let filtered = users
  if (search) {
    const lower = search.toLowerCase()
    filtered = users.filter(
      (u) =>
        u.name.toLowerCase().includes(lower) ||
        u.email.toLowerCase().includes(lower),
    )
  }

  const start = (page - 1) * limit
  const data = filtered.slice(start, start + limit)

  res.json({
    data,
    meta: {
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit),
    },
  })
})

// GET /api/users/:id
app.get('/api/users/:id', requireAuth, (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const user = users.find((u) => u.id === id)

  if (!user) {
    res.status(404).json({ error: `User ${id} not found` })
    return
  }

  res.json(user)
})

// POST /api/users
app.post('/api/users', requireAuth, (req: Request, res: Response) => {
  const { name, email } = req.body

  if (!name || typeof name !== 'string') {
    res.status(400).json({ error: 'name is required and must be a string' })
    return
  }

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    res.status(400).json({ error: 'valid email is required' })
    return
  }

  const existing = users.find((u) => u.email === email)
  if (existing) {
    res.status(409).json({ error: 'email already exists' })
    return
  }

  const user: User = { id: nextId++, name, email }
  users.push(user)

  res.status(201).json(user)
})

// PUT /api/users/:id
app.put('/api/users/:id', requireAuth, (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const index = users.findIndex((u) => u.id === id)

  if (index === -1) {
    res.status(404).json({ error: `User ${id} not found` })
    return
  }

  const { name, email } = req.body

  if (name !== undefined && typeof name !== 'string') {
    res.status(400).json({ error: 'name must be a string' })
    return
  }

  if (email !== undefined) {
    if (typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({ error: 'valid email is required' })
      return
    }
    const duplicate = users.find((u) => u.email === email && u.id !== id)
    if (duplicate) {
      res.status(409).json({ error: 'email already exists' })
      return
    }
  }

  users[index] = {
    ...users[index],
    ...(name !== undefined && { name }),
    ...(email !== undefined && { email }),
  }

  res.json(users[index])
})

// DELETE /api/users/:id
app.delete('/api/users/:id', requireAuth, (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const index = users.findIndex((u) => u.id === id)

  if (index === -1) {
    res.status(404).json({ error: `User ${id} not found` })
    return
  }

  users.splice(index, 1)
  res.status(204).send()
})

export { AUTH_TOKEN }
