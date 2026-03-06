export interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'member' | 'guest'
  active: boolean
  createdAt: string
}

export interface Post {
  id: number
  title: string
  body: string
  published: boolean
  author: User
  tags: string[]
  createdAt: string
}
