---
title: "Adding Image Support to the TIL PWA Blog"
date: 2026-03-24
tags: [vite, pwa, markdown, react]
category: general
published: true
---

![hire-jerry-vrabel](/til/images/hire-jerry-vrabel.gif)

## The Problem

The TIL blog renders Markdown to HTML using `marked` — but out of
the box there was no clear convention for handling images in posts.
External images via full URLs work fine, but local images needed
a defined pattern so they'd survive the Vite build and deploy
correctly to GitHub Pages.

## How It Works

The key insight is that Vite serves everything in the `public/`
directory as static assets at the root of the build output. That
means any file placed in `TIL/public/images/` is automatically
available at `/images/your-file.png` in development — and at
`/til/images/your-file.png` on GitHub Pages (matching the `base`
path set in `vite.config.ts`).

No import statements. No build plugins. No special configuration.
Just drop the file in `public/images/` and reference it with the
correct path.

## The Convention

**Local images** — store in `TIL/public/images/` and reference
using the GitHub Pages base path:
```markdown
![alt text](/til/images/your-image.png)
```

**External images** — just use the full URL directly:
```markdown
![alt text](https://example.com/image.png)
```

**Naming convention** — kebab-case with the post date prefix
so images stay organized as the blog grows:
```
2026-03-24-system-design-diagram.png
2026-03-24-vite-config-screenshot.png
```

## Local Dev vs Production

One gotcha — in local development the base path is `/til/` but
Vite serves assets from `/til/` too, so `/til/images/` works
in both environments without any conditional logic.

If you reference `/images/your-file.png` without the `/til/` prefix
it will work locally but break on GitHub Pages. Always use the
full `/til/images/` prefix.

## The Takeaway

Vite's `public/` directory is the simplest possible solution for
static assets in a blog — no plugins, no configuration, no CDN.
For a developer blog that deploys to GitHub Pages it's exactly
the right level of complexity. Zero.
