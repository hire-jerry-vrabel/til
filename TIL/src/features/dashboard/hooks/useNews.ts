import { useState, useCallback } from 'react'
import type { NewsItem } from '../types'
import { PROXY_URL } from '../constants'

interface NewsFeedResponse {
  items: NewsItem[]
  sources: { name: string; status: 'ok' | 'error' }[]
  fetchedAt: string
}

export function useNews() {
  const [news, setNews] = useState<NewsItem[]>([])

  const fetchNews = useCallback(async () => {
    const res = await fetch(`${PROXY_URL}/news/feed`)
    const data: NewsFeedResponse = await res.json()
    setNews(data.items ?? [])
  }, [])

  return { news, fetchNews }
}
