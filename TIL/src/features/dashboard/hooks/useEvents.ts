import { useState, useCallback } from 'react'
import type { EventItem } from '../types'
import { PROXY_URL } from '../constants'

interface EventsFeedResponse {
  items: EventItem[]
  sources: { name: string; status: 'ok' | 'error' }[]
  fetchedAt: string
}

export function useEvents() {
  const [events, setEvents] = useState<EventItem[]>([])

  const fetchEvents = useCallback(async () => {
    const res = await fetch(`${PROXY_URL}/events/feed`)
    const data: EventsFeedResponse = await res.json()
    setEvents(data.items ?? [])
  }, [])

  return { events, fetchEvents }
}
