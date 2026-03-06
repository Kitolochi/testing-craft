import { vi, describe, it, expect, beforeEach } from 'vitest'
import { getUser, getUserByEmail, createUser, deleteUser } from './user-service'

// Mock the entire db module
vi.mock('./db', () => ({
  query: vi.fn(),
  execute: vi.fn(),
}))

// Import the mocked functions for assertion/configuration
import { query, execute } from './db'

describe('user-service', () => {
  beforeEach(() => {
    vi.mocked(query).mockReset()
    vi.mocked(execute).mockReset()
  })

  // -------------------------------------------------------------------------
  // getUser
  // -------------------------------------------------------------------------
  describe('getUser', () => {
    it('returns user when found', async () => {
      vi.mocked(query).mockResolvedValue([{ id: 1, name: 'Alice', email: 'alice@test.com' }])

      const user = await getUser(1)

      expect(user).toEqual({ id: 1, name: 'Alice', email: 'alice@test.com' })
      expect(query).toHaveBeenCalledWith('SELECT * FROM users WHERE id = ?', [1])
    })

    it('returns null when not found', async () => {
      vi.mocked(query).mockResolvedValue([])

      const user = await getUser(999)

      expect(user).toBeNull()
    })

    it('propagates database errors', async () => {
      vi.mocked(query).mockRejectedValue(new Error('Connection lost'))

      await expect(getUser(1)).rejects.toThrow('Connection lost')
    })
  })

  // -------------------------------------------------------------------------
  // getUserByEmail
  // -------------------------------------------------------------------------
  describe('getUserByEmail', () => {
    it('returns user by email', async () => {
      const mockUser = { id: 2, name: 'Bob', email: 'bob@test.com' }
      vi.mocked(query).mockResolvedValue([mockUser])

      const user = await getUserByEmail('bob@test.com')

      expect(user).toEqual(mockUser)
      expect(query).toHaveBeenCalledWith('SELECT * FROM users WHERE email = ?', ['bob@test.com'])
    })

    it('returns null for unknown email', async () => {
      vi.mocked(query).mockResolvedValue([])

      expect(await getUserByEmail('unknown@test.com')).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // createUser
  // -------------------------------------------------------------------------
  describe('createUser', () => {
    it('creates a new user', async () => {
      const newUser = { id: 10, name: 'Carol', email: 'carol@test.com' }

      // First call: check if email exists (returns empty)
      // Second call: fetch newly created user
      vi.mocked(query)
        .mockResolvedValueOnce([])         // getUserByEmail check
        .mockResolvedValueOnce([newUser])   // fetch after insert

      vi.mocked(execute).mockResolvedValue({ affectedRows: 1 })

      const result = await createUser('Carol', 'carol@test.com')

      expect(result).toEqual(newUser)
      expect(execute).toHaveBeenCalledWith(
        'INSERT INTO users (name, email) VALUES (?, ?)',
        ['Carol', 'carol@test.com'],
      )
    })

    it('throws when email already exists', async () => {
      vi.mocked(query).mockResolvedValue([{ id: 1, name: 'Alice', email: 'alice@test.com' }])

      await expect(createUser('Alice2', 'alice@test.com')).rejects.toThrow(
        'User with email alice@test.com already exists',
      )
      expect(execute).not.toHaveBeenCalled()
    })

    it('throws when insert affects zero rows', async () => {
      vi.mocked(query).mockResolvedValue([])
      vi.mocked(execute).mockResolvedValue({ affectedRows: 0 })

      await expect(createUser('Dave', 'dave@test.com')).rejects.toThrow(
        'Failed to create user',
      )
    })
  })

  // -------------------------------------------------------------------------
  // deleteUser
  // -------------------------------------------------------------------------
  describe('deleteUser', () => {
    it('returns true when user is deleted', async () => {
      vi.mocked(execute).mockResolvedValue({ affectedRows: 1 })

      expect(await deleteUser(1)).toBe(true)
      expect(execute).toHaveBeenCalledWith('DELETE FROM users WHERE id = ?', [1])
    })

    it('returns false when user does not exist', async () => {
      vi.mocked(execute).mockResolvedValue({ affectedRows: 0 })

      expect(await deleteUser(999)).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // vi.spyOn demonstration
  // -------------------------------------------------------------------------
  describe('spyOn usage', () => {
    it('can spy on console.warn without replacing it', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      console.warn('test warning')

      expect(warnSpy).toHaveBeenCalledWith('test warning')
      warnSpy.mockRestore()
    })
  })
})
