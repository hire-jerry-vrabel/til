import { useState, useCallback } from 'react'
import type { GitHubData, GitHubEvent } from '../types'

export function useGitHub() {
  const [github, setGithub] = useState<GitHubData | null>(null)

  const fetchGitHub = useCallback(async () => {
    const [userRes, eventsRes] = await Promise.all([
      fetch('https://api.github.com/users/hire-jerry-vrabel'),
      fetch('https://api.github.com/users/hire-jerry-vrabel/events/public?per_page=100'),
    ])
    const user = await userRes.json() as { public_repos: number }
    const events = await eventsRes.json() as GitHubEvent[]

    const activity: Record<string, number> = {}
    const now = new Date()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      activity[d.toISOString().split('T')[0]] = 0
    }
    let commits = 0
    events.forEach((e: GitHubEvent) => {
      if (e.type === 'PushEvent') {
        const date = e.created_at.split('T')[0]
        if (activity[date] !== undefined) {
          activity[date] += e.payload.commits?.length ?? 1
          commits += e.payload.commits?.length ?? 1
        }
      }
    })

    const days = Object.keys(activity).sort().reverse()
    let streak = 0
    for (const day of days) {
      if (activity[day] > 0) streak++
      else break
    }

    const latestPush = events.find((e: GitHubEvent) => e.type === 'PushEvent')
    setGithub({
      commits,
      repos: user.public_repos,
      streak,
      activity: Object.entries(activity).map(([date, count]) => ({
        date: date.slice(5),
        count,
      })),
      latestRepo: latestPush?.repo?.name?.replace('hire-jerry-vrabel/', '') ?? '',
    })
  }, [])

  return { github, fetchGitHub }
}
