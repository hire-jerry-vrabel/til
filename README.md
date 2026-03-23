# TIL — Today I Learned

A daily log of things I learn as a Senior Web Application Developer.
Built as a PWA with Vite + React + TypeScript. Deployed on GitHub Pages.

🌐 **Live site:** https://hire-jerry-vrabel.github.io/til
📡 **RSS feed:** https://hire-jerry-vrabel.github.io/til/feed.xml

---

## Stack

| Layer | Choice |
|---|---|
| Frontend | React 19 + TypeScript |
| Build tool | Vite 7 |
| PWA | vite-plugin-pwa + Workbox |
| Routing | React Router v7 |
| Markdown | Custom browser-safe frontmatter parser |
| Search | Fuse.js — client-side, no backend needed |
| Dates | date-fns |
| Deploy | GitHub Actions → GitHub Pages |

---

## Features

- 📝 Markdown posts with frontmatter — title, date, tags, category
- 🌙 Dark mode — persisted in localStorage, respects system preference
- 🔍 Full-text search via Fuse.js
- 🏷️ Tag filtering
- ⏱️ Reading time estimates
- 📡 RSS feed — auto-generated at build time
- 📲 Installable PWA with offline support
- 🚀 Auto-deployed on every push to main

---

## Writing a Post

Create a new `.md` file in the `TIL/posts/` directory:
```markdown
---
title: "Your post title"
date: 2026-03-23
tags: [typescript, react]
category: typescript-javascript
published: true
---

Your content here...
```

Push to main and it deploys automatically.

---

## Project Structure
```
til/
├── .github/
│   └── workflows/
│       └── deploy.yml        — GitHub Actions deploy pipeline
├── TIL/
│   ├── posts/                — Markdown post files live here
│   ├── scripts/
│   │   └── generate-rss.ts  — RSS feed generator (runs at build time)
│   ├── src/
│   │   ├── components/       — Header, PostCard, SearchBar, TagFilter, etc.
│   │   ├── hooks/            — useDarkMode
│   │   ├── pages/            — Home, Post
│   │   ├── styles/           — CSS variables and theming
│   │   └── utils/            — parsePosts, search, readingTime
│   └── vite.config.ts
└── README.md
```

---

## Local Development
```bash
cd TIL
npm install
npm run dev
```

Open http://localhost:5173/til/

---

## Part of hire-jerry-vrabel

This repo is part of my structured job search as a Senior Web Application Developer.

👉 [github.com/hire-jerry-vrabel](https://github.com/hire-jerry-vrabel)
📫 hire.jerry.vrabel@gmail.com

*Last updated: March 2026*
