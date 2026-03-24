---
title: "Why gray-matter Fails in the Browser and How to Fix It"
date: 2026-03-23
tags: [typescript, vite, pwa, markdown]
category: typescript-javascript
published: true
---

## The Problem

I was building a TIL blog as a PWA using Vite + React + TypeScript.
The plan was to use `gray-matter` to parse Markdown frontmatter from
posts loaded via `import.meta.glob`. It works great in Node.js — but
the moment the browser tried to run it, I got this:
```
Uncaught ReferenceError: Buffer is not defined
```

## Why It Happens

`gray-matter` internally uses Node.js `Buffer` to handle file content.
`Buffer` is a Node.js built-in — it does not exist in the browser.
Even though Vite bundles everything, it cannot polyfill `Buffer`
automatically for every package that assumes a Node environment.

This is a common trap with packages that were written for Node.js
and never designed to run client-side.

## The Fix — Write a Browser-Safe Parser

Instead of reaching for a polyfill, I replaced `gray-matter` entirely
with a small custom parser that uses nothing but standard browser APIs:
```typescript
function parseFrontmatter(raw: string): {
  data: Record<string, unknown>
  content: string
} {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return { data: {}, content: raw }

  const yamlStr = match[1]
  const content = match[2].trim()
  const data: Record<string, unknown> = {}

  for (const line of yamlStr.split('\n')) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue

    const key = line.slice(0, colonIdx).trim()
    const val = line.slice(colonIdx + 1).trim()

    if (val.startsWith('[') && val.endsWith(']')) {
      // Parse array values: [typescript, react]
      data[key] = val
        .slice(1, -1)
        .split(',')
        .map(s => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean)
    } else if (val === 'true') {
      data[key] = true
    } else if (val === 'false') {
      data[key] = false
    } else {
      data[key] = val.replace(/^['"]|['"]$/g, '')
    }
  }

  return { data, content }
}
```

This handles strings, booleans, and simple arrays — which covers
everything a blog frontmatter block typically needs.

## The Lesson

Before adding a package, ask: **was this written for Node or the browser?**

A quick check is to look for `Buffer`, `fs`, `path`, or `process` in
the package source. If you see them and you're building a client-side
app, you either need a browser-safe alternative or you need to write
your own.

In this case, writing my own was 30 lines of code and zero dependencies.
That's a trade worth making.
