import Fuse from 'fuse.js'
import type { Post } from './parsePosts'

const FUSE_OPTIONS = {
  keys: [
    { name: 'title', weight: 0.6 },
    { name: 'excerpt', weight: 0.3 },
    { name: 'tags', weight: 0.1 },
  ],
  threshold: 0.3,
  includeScore: true,
  minMatchCharLength: 2,
}

let fuse: Fuse<Post> | null = null

export function initSearch(posts: Post[]): void {
  fuse = new Fuse(posts, FUSE_OPTIONS)
}

export function searchPosts(query: string, posts: Post[]): Post[] {
  if (!query.trim()) return posts

  if (!fuse) initSearch(posts)

  return fuse!
    .search(query)
    .map(result => result.item)
}
