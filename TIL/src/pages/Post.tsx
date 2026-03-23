import { useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { marked } from 'marked'
import { format } from 'date-fns'
import { ReadingTime } from '../components/ReadingTime'
import { getPostBySlug } from '../utils/parsePosts'

export function Post() {
  const { slug } = useParams<{ slug: string }>()
  const post = useMemo(() => getPostBySlug(slug || ''), [slug])

  useEffect(() => {
    if (post) {
      document.title = `${post.title} — TIL`
    }
    return () => {
      document.title = 'TIL — Today I Learned'
    }
  }, [post])

  if (!post) {
    return (
      <main className="post-not-found">
        <h1>Post not found</h1>
        <Link to="/">← Back to all posts</Link>
      </main>
    )
  }

  const html = marked(post.content) as string
  const formattedDate = post.date
    ? format(new Date(post.date), 'MMMM d, yyyy')
    : ''

  return (
    <main className="post">
      <div className="post-inner">
        <Link to="/" className="post-back">← All posts</Link>

        <header className="post-header">
          <div className="post-meta">
            <span className="post-date">{formattedDate}</span>
            <ReadingTime minutes={post.readingTime} />
          </div>
          <h1 className="post-title">{post.title}</h1>
          <div className="post-tags">
            {post.tags.map(tag => (
              <Link
                key={tag}
                to={`/?tag=${tag}`}
                className="tag"
              >
                {tag}
              </Link>
            ))}
          </div>
        </header>

        <div
          className="post-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <footer className="post-footer">
          <Link to="/" className="post-back">← All posts</Link>
        </footer>
      </div>
    </main>
  )
}
