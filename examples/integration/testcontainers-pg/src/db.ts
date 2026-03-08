import { Pool, type PoolClient } from 'pg'

// ---------------------------------------------------------------------------
// Database helpers — thin wrapper around pg Pool
// ---------------------------------------------------------------------------
// Provides connection management and typed query helpers for the user table.
// In a real project this would use an ORM (Drizzle, Prisma, Knex), but raw
// pg keeps this example dependency-light and focused on the Testcontainers
// pattern rather than ORM specifics.
// ---------------------------------------------------------------------------

let pool: Pool

// ---------------------------------------------------------------------------
// Connection management
// ---------------------------------------------------------------------------

// Create a connection pool from the DATABASE_URL env var
export function connect(connectionUri: string): Pool {
  pool = new Pool({ connectionString: connectionUri })
  return pool
}

// Get the current pool (throws if connect() hasn't been called)
export function getPool(): Pool {
  if (!pool) {
    throw new Error('Database not connected. Call connect() first.')
  }
  return pool
}

// Close all connections in the pool
export async function disconnect(): Promise<void> {
  if (pool) {
    await pool.end()
  }
}

// ---------------------------------------------------------------------------
// Migration — create the users table
// ---------------------------------------------------------------------------
// In a real project, use a migration tool (drizzle-kit, knex migrate, etc.).
// This inline DDL keeps the example self-contained.
// ---------------------------------------------------------------------------
export async function runMigrations(): Promise<void> {
  const client: PoolClient = await getPool().connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id          SERIAL PRIMARY KEY,
        name        VARCHAR(255) NOT NULL,
        email       VARCHAR(255) NOT NULL UNIQUE,
        created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
  } finally {
    client.release()
  }
}

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------

export interface User {
  id: number
  name: string
  email: string
  created_at: Date
}

export interface CreateUserInput {
  name: string
  email: string
}

// Create a new user and return the inserted row
export async function createUser(input: CreateUserInput): Promise<User> {
  const { rows } = await getPool().query<User>(
    'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
    [input.name, input.email],
  )
  return rows[0]
}

// Find a user by ID, or null if not found
export async function getUserById(id: number): Promise<User | null> {
  const { rows } = await getPool().query<User>(
    'SELECT * FROM users WHERE id = $1',
    [id],
  )
  return rows[0] ?? null
}

// List all users, ordered by ID
export async function listUsers(): Promise<User[]> {
  const { rows } = await getPool().query<User>(
    'SELECT * FROM users ORDER BY id',
  )
  return rows
}

// Update a user's name and/or email, return the updated row
export async function updateUser(
  id: number,
  input: Partial<CreateUserInput>,
): Promise<User | null> {
  const fields: string[] = []
  const values: unknown[] = []
  let paramIndex = 1

  if (input.name !== undefined) {
    fields.push(`name = $${paramIndex++}`)
    values.push(input.name)
  }
  if (input.email !== undefined) {
    fields.push(`email = $${paramIndex++}`)
    values.push(input.email)
  }

  if (fields.length === 0) return getUserById(id)

  values.push(id)
  const { rows } = await getPool().query<User>(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values,
  )
  return rows[0] ?? null
}

// Delete a user by ID, return true if a row was deleted
export async function deleteUser(id: number): Promise<boolean> {
  const { rowCount } = await getPool().query(
    'DELETE FROM users WHERE id = $1',
    [id],
  )
  return (rowCount ?? 0) > 0
}

// Truncate the users table — used between tests for isolation
export async function truncateUsers(): Promise<void> {
  await getPool().query('TRUNCATE users RESTART IDENTITY CASCADE')
}
