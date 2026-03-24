import { Link } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"
import { ReadingTime } from "./ReadingTime"
import type { Post } from "../utils/parsePosts"

interface Props {
  post: Post
}

export function PostCard({ post }: Props) {
  const getDisplayDate = (dateStr: string): string => {
    if (!dateStr) return ""
    const postDate = new Date(dateStr + "T00:00:00")
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (postDate.getTime() === today.getTime()) return "today"
    if (postDate.getTime() === yesterday.getTime()) return "yesterday"
    return formatDistanceToNow(postDate, { addSuffix: true })
  }

  const timeAgo = getDisplayDate(post.date)

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
