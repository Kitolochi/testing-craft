// ---------------------------------------------------------------------------
// Minimal Express server for k6 load testing
// ---------------------------------------------------------------------------
// Provides a few endpoints with simulated latency so k6 has something
// realistic to measure. Start with `node server.js` before running k6.
// ---------------------------------------------------------------------------

const express = require('express')

const app = express()
app.use(express.json())

// ---------------------------------------------------------------------------
// In-memory data store
// ---------------------------------------------------------------------------
const users = [
  { id: 1, name: 'Alice', email: 'alice@test.com' },
  { id: 2, name: 'Bob', email: 'bob@test.com' },
  { id: 3, name: 'Carol', email: 'carol@test.com' },
]
let nextId = 4

// Simulate variable response latency (0–50ms)
function randomDelay() {
  return new Promise((resolve) => setTimeout(resolve, Math.random() * 50))
}

// ---------------------------------------------------------------------------
// Health check — fast endpoint for smoke tests
// ---------------------------------------------------------------------------
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

// ---------------------------------------------------------------------------
// GET /api/users — list all users
// ---------------------------------------------------------------------------
app.get('/api/users', async (_req, res) => {
  await randomDelay()
  res.json({ data: users, total: users.length })
})

// ---------------------------------------------------------------------------
// GET /api/users/:id — get single user
// ---------------------------------------------------------------------------
app.get('/api/users/:id', async (req, res) => {
  await randomDelay()
  const user = users.find((u) => u.id === Number(req.params.id))

  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  res.json(user)
})

// ---------------------------------------------------------------------------
// POST /api/users — create a user
// ---------------------------------------------------------------------------
app.post('/api/users', async (req, res) => {
  await randomDelay()
  const { name, email } = req.body

  if (!name || !email) {
    res.status(400).json({ error: 'name and email are required' })
    return
  }

  const user = { id: nextId++, name, email }
  users.push(user)
  res.status(201).json(user)
})

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
const PORT = 3220

app.listen(PORT, () => {
  console.log(`k6 target server running at http://localhost:${PORT}`)
})
