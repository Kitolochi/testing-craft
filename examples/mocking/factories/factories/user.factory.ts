import { Factory } from 'fishery'
import type { User } from '../src/types'

interface UserTransientParams {
  admin?: boolean
  inactive?: boolean
}

export const userFactory = Factory.define<User, UserTransientParams>(
  ({ sequence, transientParams }) => ({
    id: sequence,
    name: `User ${sequence}`,
    email: `user${sequence}@test.com`,
    role: transientParams.admin ? 'admin' : 'member',
    active: !transientParams.inactive,
    createdAt: new Date('2024-01-01').toISOString(),
  }),
)
