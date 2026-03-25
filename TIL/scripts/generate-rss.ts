import { readFileSync, writeFileSync, readdirSync } from "fs"
import { resolve } from "path"

const SITE_URL = "https://hire-jerry-vrabel.github.io/til"
const SITE_TITLE = "TIL — Jerry Vrabel"
const SITE_DESCRIPTION = "Today I Learned — a daily log from a Senior Web Application Developer"

interface Post {
  slug: string
  title: string
  date: string
  excerpt: string
}

function parseFrontmatter(raw: string): { data: Record<string, string>; content: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return { data: {}, content: raw }
  const data: Record<string, string> = {}
  for (const line of match[1].split("\n")) {
    const colonIdx = line.indexOf(":")
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    const val = line.slice(colonIdx + 1).trim().replace(/^["\']|["\']$/g, "")
    data[key] = val
  }
  return { data, content: match[2].trim() }
}

const postsDir = resolve(process.cwd(), "posts")
const distDir = resolve(process.cwd(), "dist")

const files = readdirSync(postsDir)
  .filter(f => f.endsWith(".mdx"))
  .sort()
  .reverse()

const posts: Post[] = files.map(file => {
  const raw = readFileSync(resolve(postsDir, file), "utf-8")
  const { data, content } = parseFrontmatter(raw)
  const slug = file.replace(".mdx", "")
  const excerpt = content.trim().slice(0, 160).replace(/[#*`]/g, "") + "..."
  return {
    slug,
    title: data.title || slug,
    date: data.date || "",
    excerpt,
  }
})

const items = posts.map(post => `
  <item>
    <title><![CDATA[${post.title}]]></title>
    <link>${SITE_URL}/post/${post.slug}</link>
    <guid>${SITE_URL}/post/${post.slug}</guid>
    <pubDate>${new Date(post.date).toUTCString()}</pubDate>
    <description><![CDATA[${post.excerpt}]]></description>
  </item>`).join("")

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_TITLE}</title>
    <link>${SITE_URL}</link>
    <description>${SITE_DESCRIPTION}</description>
    <language>en-us</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`

writeFileSync(resolve(distDir, "feed.xml"), rss)
console.log(`RSS feed generated with ${posts.length} posts`)
