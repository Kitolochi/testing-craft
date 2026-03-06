import { http, HttpResponse, delay } from 'msw'

export interface User {
  id: number
  name: string
  email: string
}

// In-memory store for deterministic test data
let nextId = 1
const users: User[] = [
  { id: nextId++, name: 'Alice', email: 'alice@test.com' },
  { id: nextId++, name: 'Bob', email: 'bob@test.com' },
  { id: nextId++, name: 'Carol', email: 'carol@test.com' },
]

export const handlers = [
  // GET /api/users — list with optional limit
  http.get('https://api.example.com/users', async ({ request }) => {
    const url = new URL(request.url)
    const limit = Number(url.searchParams.get('limit') ?? users.length)

    await delay(50) // simulate network latency

    return HttpResponse.json(users.slice(0, limit))
  }),

  // GET /api/users/:id — single user
  http.get('https://api.example.com/users/:id', ({ params }) => {
    const id = Number(params.id)
    const user = users.find((u) => u.id === id)

    if (!user) {
      return HttpResponse.json(
        { error: `User ${id} not found` },
        { status: 404 },
      )
    }

    return HttpResponse.json(user)
  }),

  // POST /api/users — create user
  http.post('https://api.example.com/users', async ({ request }) => {
    const body = (await request.json()) as { name: string; email: string }

    if (!body.name || !body.email) {
      return HttpResponse.json(
        { error: 'name and email are required' },
        { status: 400 },
      )
    }

    const newUser: User = {
      id: nextId++,
      name: body.name,
      email: body.email,
    }

    users.push(newUser)

    return HttpResponse.json(newUser, { status: 201 })
  }),

  // DELETE /api/users/:id — delete user
  http.delete('https://api.example.com/users/:id', ({ params }) => {
    const id = Number(params.id)
    const index = users.findIndex((u) => u.id === id)

    if (index === -1) {
      return HttpResponse.json(
        { error: `User ${id} not found` },
        { status: 404 },
      )
    }

    users.splice(index, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]
