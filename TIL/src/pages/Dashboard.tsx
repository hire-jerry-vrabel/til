import { useEffect, useState, useCallback } from 'react'
import type {
  WeatherData, AirQualityData, SportsTeam, GitHubData, AIInsight,
} from '../features/dashboard/types'
import { useAirQuality } from '../features/dashboard/hooks/useAirQuality'
import { PROXY_URL } from '../features/dashboard/constants'
import { useWeather, WEATHER_CODES, } from '../features/dashboard/hooks/useWeather'
import { useGitHub } from '../features/dashboard/hooks/useGitHub'
import { useSports } from '../features/dashboard/hooks/useSports'
import { useCTA } from '../features/dashboard/hooks/useCTA'
import { AirQualityCard } from '../features/dashboard/components/AirQualityCard'
import { SportsCard } from '../features/dashboard/components/SportsCard'
import { WeatherCard } from '../features/dashboard/components/WeatherCard'
import { GitHubCard } from '../features/dashboard/components/GitHubCard'
import { CTACard } from '../features/dashboard/components/CTACard'

// ─── Dashboard ───────────────────────────────────────────────────────────────

export function Dashboard() {
  const { weather, fetchWeather } = useWeather()
  const { airQuality, fetchAirQuality } = useAirQuality()
  const { sports, fetchSports } = useSports()
  const { github, fetchGitHub } = useGitHub()
  const { cta, mapTrains, fetchCTA } = useCTA()
  const [insight, setInsight] = useState<AIInsight>({ text: '', loading: false })
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)


  const fetchInsight = useCallback(async (
    w: WeatherData | null,
    aq: AirQualityData | null,
    s: SportsTeam[],
    g: GitHubData | null
  ) => {
    if (!w || !aq || !g) return
    setInsight({ text: '', loading: true })

    const context = `
      Weather in Rogers Park, Chicago: ${w.temp}°F, feels like ${w.feelsLike}°F, ${WEATHER_CODES[w.weathercode] ?? 'Unknown'}, wind ${w.windspeed}mph.
      Air quality: AQI ${aq.aqi} (${aq.label}), PM2.5: ${aq.pm25}, PM10: ${aq.pm10}.
      GitHub activity (last 30 days): ${g.commits} commits, ${g.streak} day streak, latest repo: ${g.latestRepo}.
      Chicago sports today: ${s.map(t => `${t.name}: ${t.status}`).join('; ')}.
    `.trim()

    try {
      const res = await fetch(`${PROXY_URL}/ai/insight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 150,
          system: 'You are a witty, concise data analyst. Generate exactly 2-3 sentences summarizing the data with a clever cross-domain observation. Be specific with numbers. Mention Rogers Park or Chicago naturally. Keep it under 60 words.',
          messages: [{ role: 'user', content: context }],
        }),
      })
      const data = await res.json() as { content?: { text: string }[] }
      setInsight({ text: data.content?.[0]?.text ?? '', loading: false })
    } catch {
      setInsight({ text: '', loading: false })
    }
  }, [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    await Promise.allSettled([
      fetchWeather(),
      fetchAirQuality(),
      fetchSports(),
      fetchGitHub(),
      fetchCTA(),
    ])
    setLastUpdated(new Date())
    setLoading(false)
  }, [fetchWeather, fetchAirQuality, fetchSports, fetchGitHub, fetchCTA])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchAll])

  useEffect(() => {
    if (!loading && weather && airQuality && github) {
      fetchInsight(weather, airQuality, sports, github)
    }
  }, [loading, weather, airQuality, github, sports, fetchInsight])

  return (
    <main className="dashboard">
      <div className="dashboard__hero">
        <div>
          <h1 className="dashboard__title">Rogers Park Dashboard</h1>
          <p className="dashboard__subtitle">
            Live data from Rogers Park, Chicago · 60626
          </p>
        </div>
        <div className="dashboard__meta">
          <button className="dashboard__refresh" onClick={fetchAll} disabled={loading}>
            {loading ? '⟳' : '↺'} Refresh
          </button>
          {lastUpdated && (
            <span className="dashboard__updated">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {(insight.text || insight.loading) && (
        <div className="dashboard__insight">
          <span className="dashboard__insight-icon">🤖</span>
          {insight.loading ? (
            <span className="dashboard__insight-loading">Generating insight…</span>
          ) : (
            <p className="dashboard__insight-text">{insight.text}</p>
          )}
        </div>
      )}

      <div className="dashboard__grid">

        {/* Weather */}
        <WeatherCard weather={weather} />

        {/* AirQuality */}
        <AirQualityCard airQuality={airQuality} />

        {/* GitHub */}
        <GitHubCard github={github} />

        {/* Chicago Sports */}
        <SportsCard sports={sports} />

        {/* CTA Red Line */}
        <CTACard cta={cta} mapTrains={mapTrains} />

      </div>
    </main>
  )
}
