import { useEffect, useMemo, useCallback } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { MDXProvider } from "@mdx-js/react"
import { format } from "date-fns"
import { ReadingTime } from "../components/ReadingTime"
import { getPostBySlug, getPosts } from "../utils/parsePosts"
import { useSwipe } from "../hooks/useSwipe"
import { useOGTags, resetOGTags } from "../hooks/useOGTags"
import { useKeyboardNav } from "../hooks/useKeyboardNav"
import { YouTube } from "../components/mdx/YouTube"
import { Vimeo } from "../components/mdx/Vimeo"
import { Video } from "../components/mdx/Video"
import { Callout } from "../components/mdx/Callout"
import { ParticleCanvas } from "../components/mdx/ParticleCanvas"
import { TypeWriter } from "../components/mdx/TypeWriter"
import { CodeQuiz } from "../components/mdx/CodeQuiz"
import { AnimationPlayground } from "../components/mdx/AnimationPlayground"

const mdxComponents = {
  YouTube,
  Vimeo,
  Video,
  Callout,
  ParticleCanvas,
  TypeWriter,
  CodeQuiz,
  AnimationPlayground,
}

export function Post() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const allPosts = useMemo(() => getPosts(), [])
  const post = useMemo(() => getPostBySlug(slug || ""), [slug])

  const currentIndex = useMemo(
    () => allPosts.findIndex(p => p.slug === slug),
    [allPosts, slug]
  )

  const prevPost = currentIndex < allPosts.length - 1
    ? allPosts[currentIndex + 1]
    : null

  const nextPost = currentIndex > 0
    ? allPosts[currentIndex - 1]
    : null

  const goNext = useCallback(() => {
    if (nextPost) navigate(`/post/${nextPost.slug}`)
  }, [nextPost, navigate])

  const goPrev = useCallback(() => {
    if (prevPost) navigate(`/post/${prevPost.slug}`)
  }, [prevPost, navigate])

  const swipeHandlers = useSwipe({
    onSwipeLeft: goNext,
    onSwipeRight: goPrev,
  })

  useKeyboardNav({
    onLeft: goPrev,
    onRight: goNext,
  })

  useEffect(() => {
    if (post) {
      useOGTags({
        title: post.title,
        description: post.excerpt,
        image: post.image,
        url: `/post/${post.slug}`,
        type: "article",
      })
    }
    return () => {
      resetOGTags()
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

  const formattedDate = post.date
    ? format(new Date(post.date + "T00:00:00"), "MMMM d, yyyy")
    : ""

  const { Component } = post

  return (
    <main className="post" {...swipeHandlers}>
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
              <Link key={tag} to={`/?tag=${tag}`} className="tag">
                {tag}
              </Link>
            ))}
          </div>
        </header>

        <div className="post-content">
          <MDXProvider components={mdxComponents}>
            <Component />
          </MDXProvider>
        </div>

        <nav className="post-nav" aria-label="Post navigation">
          <div className="post-nav-prev">
            {prevPost ? (
              <Link to={`/post/${prevPost.slug}`} className="post-nav-link">
                <span className="post-nav-direction">← Older</span>
                <span className="post-nav-title">{prevPost.title}</span>
              </Link>
            ) : (
              <span className="post-nav-empty" />
            )}
          </div>
          <div className="post-nav-next">
            {nextPost ? (
              <Link to={`/post/${nextPost.slug}`} className="post-nav-link post-nav-link--right">
                <span className="post-nav-direction">Newer →</span>
                <span className="post-nav-title">{nextPost.title}</span>
              </Link>
            ) : (
              <span className="post-nav-empty" />
            )}
          </div>
        </nav>

        <footer className="post-footer">
          <Link to="/" className="post-back">← All posts</Link>
          <p className="post-swipe-hint" aria-hidden="true">
            ← swipe to navigate →
          </p>
        </footer>
      </div>
    </main>
  )
}
