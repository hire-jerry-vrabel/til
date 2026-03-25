---
title: "Why the marked Custom Renderer Breaks with this.parser is undefined"
date: 2026-03-24
tags: [typescript, react, markdown, debugging]
category: typescript-javascript
published: true
---

## The Bug

I was building a custom video embed syntax for my TIL blog using
`marked`'s `Renderer` class. The goal was to intercept paragraph
tokens that matched patterns like `@[youtube](videoId)` and replace
them with iframe embeds.

The implementation looked reasonable:
```typescript
import { marked, Renderer } from "marked"
import type { Tokens } from "marked"

const renderer = new Renderer()
const originalParagraph = renderer.paragraph.bind(renderer)

renderer.paragraph = (token: Tokens.Paragraph) => {
  const youtube = token.text.match(/^@\[youtube\]\(([^)]+)\)$/)
  if (youtube) {
    return `<iframe src="https://www.youtube.com/embed/${youtube[1]}"></iframe>`
  }
  return originalParagraph(token)
}

marked.use({ renderer })
```

But every time the component rendered I got this:
```
Uncaught TypeError: can't access property "parseInline",
this.parser is undefined
```

## Why It Happens

The root cause is subtle. When you call `renderer.paragraph.bind(renderer)`
before the renderer has been attached to a `marked` parser instance,
`this.parser` is `undefined`.

The `Renderer` class in marked expects `this.parser` to be set
internally by marked's `Parser` when it processes tokens. Calling
`bind(renderer)` captures the renderer in its unattached state —
before `this.parser` has been assigned.

When `originalParagraph` is later called inside your custom method,
it tries to access `this.parser.parseInline()` for inline token
processing — and crashes because `this.parser` is still `undefined`.

The problem is compounded in React because `marked.use({ renderer })`
mutates the global marked instance. Calling it inside a component
means it runs on every render, repeatedly corrupting the internal
parser state.

## The Fix — Preprocess Instead of Override

The cleanest solution is to skip the Renderer entirely and preprocess
the content with a plain string replacement before passing it to
`marked`:
```typescript
function preprocessVideoEmbeds(content: string): string {
  return content
    .replace(
      /^@\[youtube\]\(([^)]+)\)$/gm,
      (_, id) => `<div class="video-embed">
        <iframe
          src="https://www.youtube.com/embed/${id}"
          allow="accelerometer; autoplay"
          allowfullscreen
        ></iframe>
      </div>`
    )
    .replace(
      /^@\[vimeo\]\(([^)]+)\)$/gm,
      (_, id) => `<div class="video-embed">
        <iframe src="https://player.vimeo.com/video/${id}"
          allowfullscreen
        ></iframe>
      </div>`
    )
    .replace(
      /^@\[video\]\(([^)]+)\)$/gm,
      (_, src) => `<div class="video-local">
        <video controls><source src="${src}" /></video>
      </div>`
    )
}

// Then use it:
const html = marked(preprocessVideoEmbeds(post.content)) as string
```

This works because:
- It runs before marked touches the content
- It doesn't touch marked's internal state at all
- It's a pure function — no side effects, no global mutation
- It's easier to read and test than a custom Renderer

## The Lesson

marked's `Renderer` API is powerful but has a sharp edge — it relies
on internal parser state (`this.parser`) that only exists after marked
has wired everything together. Calling `bind()` on renderer methods
before that wiring happens captures a broken `this` context.

If you're adding custom syntax to marked, reach for a preprocessor
first. Reserve the Renderer API for cases where you genuinely need
access to the parsed token tree — and never call `marked.use()`
inside a React component.
