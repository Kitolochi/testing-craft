import express, { Request, Response } from 'express'

// ---------------------------------------------------------------------------
// Minimal Express app that serves HTML pages for E2E testing.
// Pages: /login, /dashboard, /about, /contact
// Auth: simple session cookie — no real security, just enough for E2E demos.
// ---------------------------------------------------------------------------

const app = express()
app.use(express.urlencoded({ extended: true }))

// ---------------------------------------------------------------------------
// Credentials (hardcoded for testing purposes)
// ---------------------------------------------------------------------------
const VALID_EMAIL = 'user@example.com'
const VALID_PASSWORD = 'password123'

// ---------------------------------------------------------------------------
// Simple session tracking via cookie
// ---------------------------------------------------------------------------
const activeSessions = new Set<string>()

function isLoggedIn(req: Request): boolean {
  const cookie = req.headers.cookie ?? ''
  const match = cookie.match(/session=([^;]+)/)
  return match !== null && activeSessions.has(match[1])
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

// Login page — renders a form, handles POST for authentication
app.get('/login', (_req: Request, res: Response) => {
  const error = ''
  res.send(loginPage(error))
})

app.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body

  // Validate required fields
  if (!email || !password) {
    res.send(loginPage('Email and password are required'))
    return
  }

  // Check credentials
  if (email !== VALID_EMAIL || password !== VALID_PASSWORD) {
    res.send(loginPage('Invalid credentials'))
    return
  }

  // Create session and redirect to dashboard
  const sessionId = Math.random().toString(36).slice(2)
  activeSessions.add(sessionId)
  res.setHeader('Set-Cookie', `session=${sessionId}; Path=/; HttpOnly`)
  res.redirect('/dashboard')
})

// Dashboard — requires authentication
app.get('/dashboard', (req: Request, res: Response) => {
  if (!isLoggedIn(req)) {
    res.redirect('/login')
    return
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>Dashboard</title></head>
    <body>
      <nav>
        <a href="/dashboard">Dashboard</a>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
      </nav>
      <h1>Dashboard</h1>
      <p>Welcome back, user@example.com!</p>
      <a href="/logout">Log out</a>
    </body>
    </html>
  `)
})

// About page — public
app.get('/about', (_req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>About</title></head>
    <body>
      <nav>
        <a href="/dashboard">Dashboard</a>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
      </nav>
      <h1>About</h1>
      <p>This is a demo application for Playwright E2E testing.</p>
    </body>
    </html>
  `)
})

// Contact page — public, with a form
app.get('/contact', (_req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>Contact</title></head>
    <body>
      <nav>
        <a href="/dashboard">Dashboard</a>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
      </nav>
      <h1>Contact Us</h1>
      <form method="POST" action="/contact">
        <label for="name">Name</label>
        <input id="name" name="name" type="text" required />

        <label for="email">Email</label>
        <input id="email" name="email" type="email" required />

        <label for="message">Message</label>
        <textarea id="message" name="message" required></textarea>

        <button type="submit">Send Message</button>
      </form>
    </body>
    </html>
  `)
})

app.post('/contact', (req: Request, res: Response) => {
  const { name, email, message } = req.body

  if (!name || !email || !message) {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="UTF-8"><title>Contact</title></head>
      <body>
        <h1>Contact Us</h1>
        <p class="error">All fields are required</p>
      </body>
      </html>
    `)
    return
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>Contact</title></head>
    <body>
      <h1>Contact Us</h1>
      <p class="success">Message sent successfully!</p>
    </body>
    </html>
  `)
})

// Logout — clears session
app.get('/logout', (req: Request, res: Response) => {
  const cookie = req.headers.cookie ?? ''
  const match = cookie.match(/session=([^;]+)/)
  if (match) {
    activeSessions.delete(match[1])
  }
  res.setHeader('Set-Cookie', 'session=; Path=/; HttpOnly; Max-Age=0')
  res.redirect('/login')
})

// Root redirects to login
app.get('/', (_req: Request, res: Response) => {
  res.redirect('/login')
})

// ---------------------------------------------------------------------------
// HTML helpers
// ---------------------------------------------------------------------------
function loginPage(error: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>Login</title></head>
    <body>
      <h1>Login</h1>
      ${error ? `<p class="error">${error}</p>` : ''}
      <form method="POST" action="/login">
        <label for="email">Email</label>
        <input id="email" name="email" type="email" />

        <label for="password">Password</label>
        <input id="password" name="password" type="password" />

        <button type="submit">Log in</button>
      </form>
    </body>
    </html>
  `
}

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
const PORT = 3210

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})

export { app }
