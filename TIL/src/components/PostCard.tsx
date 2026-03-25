import { Link } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"
import { ReadingTime } from "./ReadingTime"
import type { Post } from "../utils/parsePosts"

interface Props {
  post: Post
}

function getYoutubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
}

function getVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/([0-9]+)/)
  return match ? match[1] : null
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

  // Determine teaser media
  const teaserImage = post.image
  const videoTeaser = !teaserImage && post.video ? post.video : null

  const getVideoThumbnail = (): string | null => {
    if (!videoTeaser) return null
    const youtubeMatch = videoTeaser.match(/youtube\.com\/embed\/([^"]+)/)
      || videoTeaser.match(/^([a-zA-Z0-9_-]{11})$/)
    if (youtubeMatch) return getYoutubeThumbnail(youtubeMatch[1])
    const vimeoId = getVimeoId(videoTeaser)
    if (vimeoId) return `https://vumbnail.com/${vimeoId}.jpg`
    return null
  }

  const videoThumbnail = getVideoThumbnail()

  return (
    <article className="post-card">
      <Link to={`/post/${post.slug}`} className="post-card-link">
        {teaserImage && (
          <div className="post-card-image">
            <img src={teaserImage} alt={post.title} />
          </div>
        )}
        {videoTeaser && videoThumbnail && (
          <div className="post-card-image is-video">
            <img src={videoThumbnail} alt={post.title} />
            <div className="post-card-play">▶</div>
          </div>
        )}
        <div className="post-card-body">
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
        </div>
      </Link>
    </article>
  )
}
