import React, { useState, useEffect } from 'react'

// ---------------------------------------------------------------------------
// Button — simple click handler with disabled state
// ---------------------------------------------------------------------------
interface ButtonProps {
  label: string
  onClick: () => void
  disabled?: boolean
}

export function Button({ label, onClick, disabled = false }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  )
}

// ---------------------------------------------------------------------------
// LoginForm — form submission with client-side validation
// ---------------------------------------------------------------------------
interface LoginFormProps {
  onSubmit: (email: string, password: string) => void
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    onSubmit(email, password)
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="text"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && <p role="alert">{error}</p>}

      <button type="submit">Log in</button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// UserList — async data loading with loading/error/empty states
// ---------------------------------------------------------------------------
export interface User {
  id: number
  name: string
}

interface UserListProps {
  fetchUsers: () => Promise<User[]>
}

export function UserList({ fetchUsers }: UserListProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    fetchUsers()
      .then((data) => {
        if (!cancelled) {
          setUsers(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [fetchUsers])

  if (loading) return <p>Loading users...</p>
  if (error) return <p role="alert">Error: {error}</p>
  if (users.length === 0) return <p>No users found</p>

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
