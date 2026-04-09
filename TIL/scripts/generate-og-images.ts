import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { writeFileSync, mkdirSync, readdirSync, readFileSync } from 'fs'
import { join } from 'path'

const outDir = join(process.cwd(), 'dist/og')
mkdirSync(outDir, { recursive: true })

// Load Inter from @fontsource/inter (installed locally)
const fontRegular = readFileSync(
  join(process.cwd(), 'node_modules/@fontsource/inter/files/inter-latin-400-normal.woff')
)
const fontBold = readFileSync(
  join(process.cwd(), 'node_modules/@fontsource/inter/files/inter-latin-700-normal.woff')
)

const fonts: Parameters<typeof satori>[1]['fonts'] = [
  { name: 'Inter', data: fontRegular, weight: 400, style: 'normal' },
  { name: 'Inter', data: fontBold, weight: 700, style: 'normal' },
]

const postsDir = join(process.cwd(), 'posts')
const files = readdirSync(postsDir).filter(f => f.endsWith('.mdx'))

interface PostMeta {
  slug: string
  title: string
  date: string
  tags: string[]
  excerpt: string
}

function parseFrontmatter(content: string): Record<string, string | string[]> {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return {}
  const result: Record<string, string | string[]> = {}
  for (const line of match[1].split('\n')) {
    const [key, ...rest] = line.split(':')
    if (!key || !rest.length) continue
    const value = rest.join(':').trim().replace(/^["']|["']$/g, '')
    if (value.startsWith('[')) {
      result[key.trim()] = value
        .replace(/[\[\]]/g, '')
        .split(',')
        .map(s => s.trim().replace(/^["']|["']$/g, ''))
    } else {
      result[key.trim()] = value
    }
  }
  return result
}

const posts: PostMeta[] = files.map(file => {
  const content = readFileSync(join(postsDir, file), 'utf-8')
  const fm = parseFrontmatter(content)
  const slug = file.replace('.mdx', '')
  const title = (fm.title as string) || slug
  return {
    slug,
    title,
    date: (fm.date as string) || '',
    tags: (fm.tags as string[]) || [],
    excerpt: (fm.description as string) || (fm.excerpt as string) || title,
  }
})

for (const post of posts) {
  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '60px',
          backgroundColor: '#0f172a',
          fontFamily: 'Inter',
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                fontSize: '18px',
                color: '#6366f1',
                marginBottom: '16px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontWeight: '700',
              },
              children: (post.tags as string[]).slice(0, 3).join(' · ') || 'TIL',
            },
          },
          {
            type: 'div',
            props: {
              style: {
                fontSize: post.title.length > 40 ? '52px' : '64px',
                fontWeight: '700',
                color: '#f1f5f9',
                lineHeight: '1.1',
                marginBottom: '24px',
              },
              children: post.title,
            },
          },
          {
            type: 'div',
            props: {
              style: {
                fontSize: '22px',
                color: '#94a3b8',
                lineHeight: '1.4',
                maxWidth: '900px',
              },
              children: post.excerpt.slice(0, 120),
            },
          },
          {
            type: 'div',
            props: {
              style: {
                marginTop: '40px',
                fontSize: '18px',
                color: '#475569',
              },
              children: `hire-jerry-vrabel.github.io/til · ${post.date}`,
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts,
    }
  )

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } })
  const png = resvg.render().asPng()
  writeFileSync(join(outDir, `${post.slug}.png`), png)
  console.log(`OG: ${post.slug}.png`)
}

console.log(`Generated ${posts.length} OG images`)
