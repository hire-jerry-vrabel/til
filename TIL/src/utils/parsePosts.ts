import type { ComponentType } from "react"
import { readingTime } from "./readingTime"

export interface Post {
  slug: string
  title: string
  date: string
  tags: string[]
  category: string
  excerpt: string
  readingTime: number
  published: boolean
  image: string | null
  video: string | null
  Component: ComponentType
}

interface MDXModule {
  default: ComponentType
  frontmatter: Record<string, unknown>
}

const modules = import.meta.glob<MDXModule>("../../posts/*.mdx", { eager: true })

export function getPosts(): Post[] {
  const posts: Post[] = []

  for (const path in modules) {
    const mod = modules[path]
    const data = mod.frontmatter || {}

    if (data.published === false) continue

    const slug = path
      .replace(/.*\//, "")
      .replace(".mdx", "")

    const title = (data.title as string) || slug

    const excerpt = (data.excerpt as string) || title + "..."

    posts.push({
      slug,
      title,
      date: data.date ? String(data.date) : "",
      tags: (data.tags as string[]) || [],
      category: (data.category as string) || "general",
      excerpt,
      readingTime: readingTime(title),
      published: data.published !== false,
      image: (data.image as string) || null,
      video: (data.video as string) || null,
      Component: mod.default,
    })
  }

  return posts.sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

export function getPostBySlug(slug: string): Post | undefined {
  return getPosts().find(p => p.slug === slug)
}

export function getAllTags(posts: Post[]): string[] {
  const tags = new Set<string>()
  posts.forEach(p => p.tags.forEach(t => tags.add(t)))
  return Array.from(tags).sort()
}
