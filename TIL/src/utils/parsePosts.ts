import { readingTime } from "./readingTime"

export interface Post {
  slug: string
  title: string
  date: string
  tags: string[]
  category: string
  excerpt: string
  content: string
  readingTime: number
  published: boolean
  image: string | null
  video: string | null
}

function parseFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) return { data: {}, content: raw }

  const yamlStr = match[1]
  const content = match[2].trim()
  const data: Record<string, unknown> = {}

  for (const line of yamlStr.split("\n")) {
    const colonIdx = line.indexOf(":")
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    const val = line.slice(colonIdx + 1).trim()

    if (val.startsWith("[") && val.endsWith("]")) {
      data[key] = val
        .slice(1, -1)
        .split(",")
        .map(s => s.trim().replace(/^["\'"]|["\'"]$/g, ""))
        .filter(Boolean)
    } else if (val === "true") {
      data[key] = true
    } else if (val === "false") {
      data[key] = false
    } else {
      data[key] = val.replace(/^["\'"]|["\'"]$/g, "")
    }
  }

  return { data, content }
}

const modules = import.meta.glob("../../posts/*.md", { query: "?raw", import: "default", eager: true })

export function getPosts(): Post[] {
  const posts: Post[] = []

  for (const path in modules) {
    const raw = modules[path] as string
    const { data, content } = parseFrontmatter(raw)

    if (data.published === false) continue

    const slug = path
      .replace(/.*\//, "")
      .replace(".md", "")

    const excerpt = (data.excerpt as string)
      || content.trim().replace(/!\[.*?\]\(.*?\)/g, "").replace(/[#*`]/g, "").trim().slice(0, 160) + "..."

    posts.push({
      slug,
      title: (data.title as string) || slug,
      date: data.date ? String(data.date) : "",
      tags: (data.tags as string[]) || [],
      category: (data.category as string) || "general",
      excerpt,
      content,
      readingTime: readingTime(content),
      published: data.published !== false,
      image: (data.image as string) || null,
      video: (data.video as string) || null,
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
