import { Factory } from 'fishery'
import type { Post } from '../src/types'
import { userFactory } from './user.factory'

interface PostTransientParams {
  draft?: boolean
}

export const postFactory = Factory.define<Post, PostTransientParams>(
  ({ sequence, transientParams, associations }) => ({
    id: sequence,
    title: `Post Title ${sequence}`,
    body: `This is the body content for post ${sequence}. It contains enough text to be realistic.`,
    published: !transientParams.draft,
    author: associations.author || userFactory.build(),
    tags: ['testing', 'example'],
    createdAt: new Date('2024-06-15').toISOString(),
  }),
)
