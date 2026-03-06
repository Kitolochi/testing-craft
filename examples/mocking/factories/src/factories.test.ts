import { describe, it, expect } from 'vitest'
import { userFactory } from '../factories/user.factory'
import { postFactory } from '../factories/post.factory'

// ---------------------------------------------------------------------------
// userFactory
// ---------------------------------------------------------------------------
describe('userFactory', () => {
  it('builds a user with sequential ids', () => {
    const user1 = userFactory.build()
    const user2 = userFactory.build()

    expect(user2.id).toBeGreaterThan(user1.id)
    expect(user1.name).toMatch(/^User \d+$/)
    expect(user1.email).toMatch(/^user\d+@test\.com$/)
  })

  it('builds with default role "member"', () => {
    const user = userFactory.build()

    expect(user.role).toBe('member')
    expect(user.active).toBe(true)
  })

  it('builds admin via transient params', () => {
    const admin = userFactory.build({}, { transient: { admin: true } })

    expect(admin.role).toBe('admin')
  })

  it('builds inactive user via transient params', () => {
    const inactive = userFactory.build({}, { transient: { inactive: true } })

    expect(inactive.active).toBe(false)
  })

  it('allows explicit overrides', () => {
    const user = userFactory.build({
      name: 'Alice',
      email: 'alice@example.com',
    })

    expect(user.name).toBe('Alice')
    expect(user.email).toBe('alice@example.com')
  })

  it('builds a list of users', () => {
    const users = userFactory.buildList(5)

    expect(users).toHaveLength(5)

    const ids = users.map((u) => u.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(5) // all unique
  })

  it('builds a list with shared overrides', () => {
    const admins = userFactory.buildList(3, { role: 'admin' })

    admins.forEach((user) => {
      expect(user.role).toBe('admin')
    })
  })
})

// ---------------------------------------------------------------------------
// postFactory
// ---------------------------------------------------------------------------
describe('postFactory', () => {
  it('builds a post with an auto-generated author', () => {
    const post = postFactory.build()

    expect(post.title).toMatch(/^Post Title \d+$/)
    expect(post.author).toBeDefined()
    expect(post.author.id).toBeGreaterThan(0)
    expect(post.published).toBe(true)
  })

  it('builds a draft post via transient params', () => {
    const draft = postFactory.build({}, { transient: { draft: true } })

    expect(draft.published).toBe(false)
  })

  it('accepts an explicit author association', () => {
    const alice = userFactory.build({ name: 'Alice' })
    const post = postFactory.build(
      {},
      { associations: { author: alice } },
    )

    expect(post.author.name).toBe('Alice')
    expect(post.author.id).toBe(alice.id)
  })

  it('builds a list of posts', () => {
    const posts = postFactory.buildList(3)

    expect(posts).toHaveLength(3)
    posts.forEach((post) => {
      expect(post.tags).toContain('testing')
      expect(post.author).toBeDefined()
    })
  })

  it('builds posts with a shared author', () => {
    const author = userFactory.build({ name: 'Shared Author' })
    const posts = postFactory.buildList(3, {}, {
      associations: { author },
    })

    posts.forEach((post) => {
      expect(post.author.name).toBe('Shared Author')
      expect(post.author.id).toBe(author.id)
    })
  })

  it('allows overriding tags', () => {
    const post = postFactory.build({ tags: ['typescript', 'vitest'] })

    expect(post.tags).toEqual(['typescript', 'vitest'])
  })
})

// ---------------------------------------------------------------------------
// Combined usage patterns
// ---------------------------------------------------------------------------
describe('factory composition', () => {
  it('creates a realistic test scenario', () => {
    const admin = userFactory.build(
      { name: 'Admin User' },
      { transient: { admin: true } },
    )

    const posts = postFactory.buildList(5, {}, {
      associations: { author: admin },
    })

    expect(admin.role).toBe('admin')
    expect(posts).toHaveLength(5)
    posts.forEach((post) => {
      expect(post.author.role).toBe('admin')
    })
  })

  it('builds mixed user list for testing filters', () => {
    const activeMembers = userFactory.buildList(3)
    const inactiveMembers = userFactory.buildList(2, {}, {
      transient: { inactive: true },
    })
    const admins = userFactory.buildList(1, {}, {
      transient: { admin: true },
    })

    const allUsers = [...activeMembers, ...inactiveMembers, ...admins]

    expect(allUsers).toHaveLength(6)
    expect(allUsers.filter((u) => u.active)).toHaveLength(4)
    expect(allUsers.filter((u) => !u.active)).toHaveLength(2)
    expect(allUsers.filter((u) => u.role === 'admin')).toHaveLength(1)
  })
})
