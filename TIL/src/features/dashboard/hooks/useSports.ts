import { useState, useCallback } from 'react'
import type { SportsTeam, ESPNCompetitor, ESPNEvent } from '../types'

const CHICAGO_TEAMS = [
  { sport: 'baseball', league: 'mlb', name: 'Cubs', abbr: 'CHC', fallbackLogo: 'https://a.espncdn.com/i/teamlogos/mlb/500/chc.png' },
  { sport: 'baseball', league: 'mlb', name: 'White Sox', abbr: 'CHW', fallbackLogo: 'https://a.espncdn.com/i/teamlogos/mlb/500/chw.png' },
  { sport: 'football', league: 'nfl', name: 'Bears', abbr: 'CHI', fallbackLogo: 'https://a.espncdn.com/i/teamlogos/nfl/500/chi.png' },
  { sport: 'basketball', league: 'nba', name: 'Bulls', abbr: 'CHI', fallbackLogo: 'https://a.espncdn.com/i/teamlogos/nba/500/chi.png' },
  { sport: 'hockey', league: 'nhl', name: 'Blackhawks', abbr: 'CHI', fallbackLogo: 'https://a.espncdn.com/i/teamlogos/nhl/500/chic.png' },
  { sport: 'soccer', league: 'usa.1', name: 'Fire FC', abbr: 'CHI', fallbackLogo: 'https://a.espncdn.com/i/teamlogos/soccer/500/182.png' },
  { sport: 'soccer', league: 'usa.nwsl', name: 'Stars FC', abbr: 'CHI', fallbackLogo: 'https://a.espncdn.com/i/teamlogos/soccer/500/15360.png' },
  { sport: 'basketball', league: 'wnba', name: 'Sky', abbr: 'CHI', fallbackLogo: 'https://a.espncdn.com/i/teamlogos/wnba/500/chi.png' },
]

export function useSports() {
  const [sports, setSports] = useState<SportsTeam[]>([])

  const fetchSports = useCallback(async () => {
    const results = await Promise.allSettled(
      CHICAGO_TEAMS.map(async team => {
        const res = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/${team.sport}/${team.league}/scoreboard`
        )
        const data = await res.json() as { events?: ESPNEvent[] }
        const event = data.events?.find((e: ESPNEvent) =>
          e.competitions?.[0]?.competitors?.some((c: ESPNCompetitor) =>
            c.team.abbreviation === team.abbr
          )
        )
        if (!event) return { name: team.name, logo: team.fallbackLogo, status: 'No game scheduled', detail: '' }
        const comp = event.competitions[0]
        const home = comp.competitors.find((c: ESPNCompetitor) => c.homeAway === 'home')
        const away = comp.competitors.find((c: ESPNCompetitor) => c.homeAway === 'away')
        const isChicago = home?.team.abbreviation === team.abbr
        const chicago = isChicago ? home : away
        const opponent = isChicago ? away : home
        return {
          name: team.name,
          logo: chicago?.team.logo ?? '',
          score: chicago?.score,
          opponent: opponent?.team.displayName,
          opponentLogo: opponent?.team.logo,
          opponentScore: opponent?.score,
          status: comp.status.type.shortDetail?.replace('EDT', 'CDT').replace('EST', 'CST') ?? '',
          detail: isChicago ? 'vs' : '@',
          win: comp.status.type.completed
            ? parseInt(chicago?.score ?? '0') > parseInt(opponent?.score ?? '0')
            : undefined,
        }
      })
    )
    const mapped = results.map((r, i) =>
      r.status === 'fulfilled' ? r.value : { name: CHICAGO_TEAMS[i].name, logo: '', status: 'Unavailable', detail: '' }
    )
    const sorted = mapped.sort((a, b) => {
      const priority = (t: SportsTeam) => {
        if (t.status === 'No game scheduled' || t.status === 'Unavailable') return 3
        const isLive = t.score !== undefined && !t.status.includes('/') && !t.status.includes('PM') && !t.status.includes('AM') && t.win === undefined
        if (isLive) return 0
        if (t.score !== undefined && t.win !== undefined) return 2
        return 1
      }
      const pa = priority(a)
      const pb = priority(b)
      if (pa !== pb) return pa - pb
      return a.status.localeCompare(b.status)
    })
    setSports(sorted)
  }, [])

  return { sports, fetchSports }
}
