import { query, execute } from './db'

export interface User {
  id: number
  name: string
  email: string
}

export async function getUser(id: number): Promise<User | null> {
  const rows = await query('SELECT * FROM users WHERE id = ?', [id])
  return (rows[0] as User) ?? null
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const rows = await query('SELECT * FROM users WHERE email = ?', [email])
  return (rows[0] as User) ?? null
}

export async function createUser(name: string, email: string): Promise<User> {
  const existing = await getUserByEmail(email)
  if (existing) {
    throw new Error(`User with email ${email} already exists`)
  }

  const result = await execute(
    'INSERT INTO users (name, email) VALUES (?, ?)',
    [name, email],
  )

  if (result.affectedRows === 0) {
    throw new Error('Failed to create user')
  }

  // Fetch the newly created user
  const rows = await query('SELECT * FROM users WHERE email = ?', [email])
  return rows[0] as User
}

export async function deleteUser(id: number): Promise<boolean> {
  const result = await execute('DELETE FROM users WHERE id = ?', [id])
  return result.affectedRows > 0
}
