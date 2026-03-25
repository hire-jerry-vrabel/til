import { useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { marked, Renderer } from "marked"
import type { Tokens } from "marked"
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

  // Custom renderer for video embeds
  const renderer = new Renderer()

  const originalParagraph = renderer.paragraph.bind(renderer)
  renderer.paragraph = (token: Tokens.Paragraph) => {
    const text = token.text

    // YouTube: @[youtube](videoId)
    const youtube = text.match(/^@\[youtube\]\(([^)]+)\)$/)
    if (youtube) {
      return `<div class="video-embed video-youtube">
        <iframe
          src="https://www.youtube.com/embed/${youtube[1]}"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>`
    }

    // Vimeo: @[vimeo](videoId)
    const vimeo = text.match(/^@\[vimeo\]\(([^)]+)\)$/)
    if (vimeo) {
      return `<div class="video-embed video-vimeo">
        <iframe
          src="https://player.vimeo.com/video/${vimeo[1]}"
          frameborder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>`
    }

    // Local or hosted video: @[video](url)
    const video = text.match(/^@\[video\]\(([^)]+)\)$/)
    if (video) {
      return `<div class="video-local">
        <video controls preload="metadata">
          <source src="${video[1]}" />
          Your browser does not support the video tag.
        </video>
      </div>`
    }

    return originalParagraph(token)
  }

  marked.use({ renderer })
  const html = marked(post.content) as string
  const formattedDate = post.date
    ? format(new Date(post.date + "T00:00:00"), 'MMMM d, yyyy')
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
