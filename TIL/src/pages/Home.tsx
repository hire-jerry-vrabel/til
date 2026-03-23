import { useMemo, useState } from 'react'
import { PostCard } from '../components/PostCard'
import { SearchBar } from '../components/SearchBar'
import { TagFilter } from '../components/TagFilter'
import { getAllTags, getPosts } from '../utils/parsePosts'
import { searchPosts } from '../utils/search'

export function Home() {
  const posts = useMemo(() => getPosts(), [])
  const tags = useMemo(() => getAllTags(posts), [posts])
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let result = searchPosts(query, posts)
    if (activeTag) {
      result = result.filter(p => p.tags.includes(activeTag))
    }
    return result
  }, [query, activeTag, posts])

  return (
    <main className="home">
      <div className="home-hero">
        <h1 className="home-title">Today I Learned</h1>
        <p className="home-subtitle">
          A daily log of things I pick up as a Senior Web Application Developer.
          TypeScript · React · Node.js · GraphQL · AWS · System Design.
        </p>
        <div className="home-stats">
          <span>{posts.length} posts</span>
          <span>·</span>
          <span>{tags.length} topics</span>
        </div>
      </div>

      <div className="home-controls">
        <SearchBar query={query} onChange={setQuery} />
        <TagFilter
          tags={tags}
          activeTag={activeTag}
          onTagClick={setActiveTag}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="home-empty">
          <p>No posts found for <strong>{query}</strong></p>
          <button onClick={() => { setQuery(''); setActiveTag(null) }}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className="post-list">
          {filtered.map(post => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </main>
  )
}
