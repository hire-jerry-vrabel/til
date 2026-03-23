import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { ReadingTime } from './ReadingTime'
import type { Post } from '../utils/parsePosts'

interface Props {
  post: Post
}

export function PostCard({ post }: Props) {
  const timeAgo = post.date
    ? formatDistanceToNow(new Date(post.date), { addSuffix: true })
    : ''

  return (
    <article className="post-card">
      <Link to={`/post/${post.slug}`} className="post-card-link">
        <div className="post-card-meta">
          <span className="post-card-date">{timeAgo}</span>
          <ReadingTime minutes={post.readingTime} />
        </div>
        <h2 className="post-card-title">{post.title}</h2>
        <p className="post-card-excerpt">{post.excerpt}</p>
        <div className="post-card-tags">
          {post.tags.map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      </Link>
    </article>
  )
}
