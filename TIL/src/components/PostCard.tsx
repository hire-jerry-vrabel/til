import { useState } from "react"
import { Link } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"
import { ReadingTime } from "./ReadingTime"
import { VideoModal } from "./VideoModal"
import type { Post } from "../utils/parsePosts"

interface Props {
  post: Post
}

type VideoType = "youtube" | "vimeo" | "local"

interface VideoInfo {
  src: string
  type: VideoType
  thumbnail: string
}

function getVideoInfo(video: string): VideoInfo | null {
  // YouTube ID (11 chars) or youtube.com URL
  const youtubeMatch = video.match(/(?:youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    || (video.length === 11 ? [null, video] : null)
  if (youtubeMatch) {
    return {
      src: youtubeMatch[1],
      type: "youtube",
      thumbnail: `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`
    }
  }

  // Vimeo
  const vimeoMatch = video.match(/vimeo\.com\/([0-9]+)/)
    || video.match(/^([0-9]+)$/)
  if (vimeoMatch) {
    return {
      src: vimeoMatch[1],
      type: "vimeo",
      thumbnail: `https://vumbnail.com/${vimeoMatch[1]}.jpg`
    }
  }

  // Local / hosted mp4
  if (video.match(/\.mp4|\.(webm|ogg)$/i)) {
    return {
      src: video,
      type: "local",
      thumbnail: ""
    }
  }

  return null
}

export function PostCard({ post }: Props) {
  const [modalOpen, setModalOpen] = useState(false)

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
  const videoInfo = post.video ? getVideoInfo(post.video) : null
  const teaserImage = post.image || (videoInfo?.thumbnail ?? null)
  const isVideo = !!videoInfo

  return (
    <>
      <article className="post-card">
        {teaserImage && (
          <div
            className={`post-card-image${isVideo ? " is-video" : ""}`}
            onClick={isVideo ? () => setModalOpen(true) : undefined}
            style={{ cursor: isVideo ? "pointer" : "default" }}
          >
            <img src={teaserImage} alt={post.title} />
            {isVideo && (
              <div className="post-card-play">
                <span className="post-card-play-icon">▶</span>
              </div>
            )}
          </div>
        )}
        <div className="post-card-body">
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
        </div>
      </article>

      {modalOpen && videoInfo && (
        <VideoModal
          src={videoInfo.src}
          type={videoInfo.type}
          title={post.title}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  )
}
