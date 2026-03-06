const BASE_URL = 'https://api.example.com'

export interface User {
  id: number
  name: string
  email: string
}

export async function getUsers(limit?: number): Promise<User[]> {
  const url = new URL(`${BASE_URL}/users`)
  if (limit !== undefined) {
    url.searchParams.set('limit', String(limit))
  }

  const response = await fetch(url.toString())

  if (!response.ok) {
    throw new Error(`Failed to fetch users: ${response.status}`)
  }

  return response.json()
}

export async function getUser(id: number): Promise<User> {
  const response = await fetch(`${BASE_URL}/users/${id}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch user ${id}: ${response.status}`)
  }

  return response.json()
}

export async function createUser(name: string, email: string): Promise<User> {
  const response = await fetch(`${BASE_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email }),
  })

  if (!response.ok) {
    const body = await response.json()
    throw new Error(body.error ?? `Failed to create user: ${response.status}`)
  }

  return response.json()
}

export async function deleteUser(id: number): Promise<void> {
  const response = await fetch(`${BASE_URL}/users/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error(`Failed to delete user ${id}: ${response.status}`)
  }
}
